package dev.huginn;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.util.Size;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@CapacitorPlugin(
        name = "Gallery",
        permissions = {
                // Android <= 12
                @Permission(
                        strings = {Manifest.permission.READ_EXTERNAL_STORAGE},
                        alias = "storageOld"
                ),
                // Android 13+
                @Permission(
                        alias = "storageNew",
                        strings = {Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO}
                ),
        }
)
public class GalleryPlugin extends Plugin {

    private static final int THUMBNAIL_SIZE = 200;
    private static final int THUMBNAIL_QUALITY = 80; // JPEG quality

    @PluginMethod
    public void getMedia(PluginCall call) {
        String ungrantedAlias = this.getUngrantedPermissionAlias();
        if (ungrantedAlias != null) {
            requestPermissionForAlias(ungrantedAlias, call, "permissionCallback");
            return;
        }

        executeGetMedia(call);
    }

    @PluginMethod
    public void getMediaThumbnail(PluginCall call) {
        String ungrantedAlias = this.getUngrantedPermissionAlias();
        if (ungrantedAlias != null) {
            requestPermissionForAlias(ungrantedAlias, call, "permissionCallback");
            return;
        }

        String idString = call.getString("id");
        String uri = call.getString("uri");
        Integer size = call.getInt("size");
        Integer quality = call.getInt("quality");

        if (idString == null || uri == null || size == null || quality == null) {
            call.reject("Incorrect parameters");
            return;
        }

        long id = Long.parseLong(idString);
        ContentResolver cr = getContext().getContentResolver();

        String base64 = generateThumbnail(cr, Uri.parse(uri), id, size, quality);
        JSObject result = new JSObject();
        result.put("base64", base64);
        call.resolve(result);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        String ungrantedAlias = this.getUngrantedPermissionAlias();
        if (ungrantedAlias == null) {
            executeGetMedia(call);
        } else {
            call.reject("Permission is required to get medias");
        }
    }

    private void executeGetMedia(PluginCall call) {
        // Options
        Integer limit = call.getInt("limit");
        String afterString = call.getString("after", "0"); // timestamp cursor
        String type = call.getString("types", "all"); // "photos" | "videos" | "all"


        if (limit == null || type == null || afterString == null) {
            call.reject("Incorrect parameters");
            return;
        }

        long after = Long.parseLong(afterString);
        Log.d("HuginnLog", "executeGetMedia: limit=" + limit + ", after=" + after + ", type=" + type);

        new Thread(() -> {
            try {
                JSArray items = queryMediaStore(limit, after, type);
                JSObject result = new JSObject();
                result.put("media", items);
                // Return the last timestamp as the next cursor
                if (items.length() > 0) {
                    JSObject last = (JSObject) items.get(items.length() - 1);
                    result.put("cursor", last.getLong("createdAt"));
                } else {
                    result.put("cursor", 0);
                }
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to query media: " + e.getMessage());
            }
        }).start();
    }

    private String getUngrantedPermissionAlias() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && getPermissionState("storageNew") != PermissionState.GRANTED) {
            return "storageNew";
        } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU && getPermissionState("storageOld") != PermissionState.GRANTED) {
            return "storageOld";
        }

        return null;
    }

    private JSArray queryMediaStore(int limit, long afterTimestamp, String type) throws Exception {
        JSArray results = new JSArray();
        ContentResolver cr = getContext().getContentResolver();

        Uri queryUri = MediaStore.Files.getContentUri("external");
        queryUri(cr, queryUri, type, limit, afterTimestamp, results);

        return results;
    }

    private void queryUri(ContentResolver cr, Uri contentUri, String mediaType,
                          int limit, long afterTimestamp,
                          JSArray results) throws Exception {

        String[] projection = {
                MediaStore.MediaColumns._ID,
                MediaStore.MediaColumns.DISPLAY_NAME,
                MediaStore.MediaColumns.DATE_ADDED,    // seconds since epoch
                MediaStore.MediaColumns.MIME_TYPE,
                MediaStore.MediaColumns.DATA,          // file path (legacy, still works)
                MediaStore.MediaColumns.DURATION,
                MediaStore.MediaColumns.WIDTH,
                MediaStore.MediaColumns.HEIGHT,
                MediaStore.Files.FileColumns.MEDIA_TYPE
        };

        String selection;
        String[] selectionArgs;

        String mediaTypeSelection;
        String[] mediaTypeArgs;

        if ("image".equals(mediaType)) {
            mediaTypeSelection = MediaStore.Files.FileColumns.MEDIA_TYPE + "=?";
            mediaTypeArgs = new String[]{String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE)};
        } else if ("video".equals(mediaType)) {
            mediaTypeSelection = MediaStore.Files.FileColumns.MEDIA_TYPE + "=?";
            mediaTypeArgs = new String[]{String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)};
        } else {
            mediaTypeSelection = "(" + MediaStore.Files.FileColumns.MEDIA_TYPE + "=? OR "
                    + MediaStore.Files.FileColumns.MEDIA_TYPE + "=?)";
            mediaTypeArgs = new String[]{
                    String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE),
                    String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)
            };
        }

        if (afterTimestamp > 0) {
            selection = mediaTypeSelection + " AND " + MediaStore.MediaColumns.DATE_ADDED + " < ?";
            selectionArgs = new String[mediaTypeArgs.length + 1];
            System.arraycopy(mediaTypeArgs, 0, selectionArgs, 0, mediaTypeArgs.length);
            selectionArgs[mediaTypeArgs.length] = String.valueOf(afterTimestamp);
        } else {
            selection = mediaTypeSelection;
            selectionArgs = mediaTypeArgs;
        }

        String sortOrder = MediaStore.MediaColumns.DATE_ADDED + " DESC";

        Cursor cursor;

        Bundle queryArgs = new Bundle();
        queryArgs.putString(ContentResolver.QUERY_ARG_SQL_SORT_ORDER, sortOrder);
        queryArgs.putInt(ContentResolver.QUERY_ARG_LIMIT, limit);
        if (selection != null) {
            queryArgs.putString(ContentResolver.QUERY_ARG_SQL_SELECTION, selection);
            queryArgs.putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, selectionArgs);
        }

        cursor = cr.query(contentUri, projection, queryArgs, null);

        try (Cursor c = cursor) {
            if (c == null) return;

            int idCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID);
            int nameCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME);
            int dateCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED);
            int mimeCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.MIME_TYPE);
            int dataCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA);
            int typeCol = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE);
            int durationCol = c.getColumnIndex(MediaStore.MediaColumns.DURATION);

            while (c.moveToNext()) {
                long id = c.getLong(idCol);
                String name = c.getString(nameCol);
                long dateAdded = c.getLong(dateCol); // seconds
                String mimeType = c.getString(mimeCol);
                int type = c.getInt(typeCol);
                String filePath = c.getString(dataCol);
                long durationMs = durationCol >= 0 ? c.getLong(durationCol) : 0;

                Uri itemUri = ContentUris.withAppendedId(contentUri, id);

                JSObject item = new JSObject();
                item.put("id", String.valueOf(id));
                item.put("uri", itemUri.toString());
                item.put("filePath", filePath != null ? filePath : "");
                item.put("name", name != null ? name : "");
                item.put("mimeType", mimeType != null ? mimeType : "");
                item.put("type", type);
                item.put("createdAt", dateAdded); // seconds, use as cursor

                if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                    item.put("duration", durationMs);
                }

                results.put(item);
            }
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    private String generateThumbnail(ContentResolver cr, Uri uri,
                                     long id, int size, int quality) {
        try {
            Bitmap bmp;

            bmp = cr.loadThumbnail(uri, new Size(size, size), null);

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.JPEG, quality, stream);
            bmp.recycle();

            byte[] bytes = stream.toByteArray();
            return "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);

        } catch (IOException e) {
            return "";
        }
    }
}