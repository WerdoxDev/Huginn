package dev.huginn;

import static android.content.pm.PackageManager.PERMISSION_GRANTED;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.SharedPreferences;
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

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

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
                @Permission(
                        alias = "readMediaLegacy",
                        strings = {Manifest.permission.READ_EXTERNAL_STORAGE}
                ),
                @Permission(
                        alias = "readMediaImages",
                        strings = {"android.permission.READ_MEDIA_IMAGES"}
                ),
                @Permission(
                        alias = "readMediaVideo",
                        strings = {"android.permission.READ_MEDIA_VIDEO"}
                ),
                @Permission(
                        alias = "readMediaVisualUserSelected",
                        strings = {"android.permission.READ_MEDIA_VISUAL_USER_SELECTED"}
                )
        }
)


public class GalleryPlugin extends Plugin {
    private final String TAG = GalleryPlugin.class.getSimpleName();

    public enum MediaPermissionState {
        GRANTED,   // Full access to all media
        PARTIAL,   // Android 14+ user selected subset
        DENIED_ONCE,
        DENIED     // No access
    }

    private static final int THUMBNAIL_SIZE = 200;
    private static final int THUMBNAIL_QUALITY = 80; // JPEG quality

    @PluginMethod
    public void checkOrRequestPermission(PluginCall call) {
        Boolean skipPartial = call.getBoolean("skipPartial");
        if (skipPartial == null) skipPartial = false;

        Log.d(TAG, String.format("check or request permission: skipPartial=%b", skipPartial));

        MediaPermissionState current = getMediaPermissionState();
        if (current != MediaPermissionState.DENIED && current != MediaPermissionState.DENIED_ONCE && !skipPartial) {
            resolvePermissionCall(call, current);
        } else {
            requestMediaPermissions(call);
        }
    }

    @PluginMethod
    public void getMedia(PluginCall call) {
        boolean hasPermission = checkMediaPermissionState(call);
        if (!hasPermission) {
            return;
        }

        executeGetMedia(call);
    }

    @PluginMethod
    public void getMediaThumbnail(PluginCall call) {
        boolean hasPermission = checkMediaPermissionState(call);
        if (!hasPermission) {
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

        call.setKeepAlive(true);
        ;

        bridge.execute(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                String base64 = generateThumbnail(cr, Uri.parse(uri), id, size, quality);

                JSObject data = new JSObject();
                data.put("base64", base64);
                call.resolve(data);

            } catch (Exception e) {
                call.reject("Failed to generate thumbnail: " + e.getMessage());
            } finally {
                call.setKeepAlive(false);
            }
        });
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
        Log.d(TAG, String.format("executeGetMedia called with: type=%s, after=%d, limit=%d", type, after, limit));

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

    private String generateThumbnail(ContentResolver cr, Uri uri, long id, int size, int quality) {
        Bitmap bmp = null;
        try {
            bmp = cr.loadThumbnail(uri, new Size(size, size), null);

            ByteArrayOutputStream stream = new ByteArrayOutputStream(
                    bmp.getWidth() * bmp.getHeight()  // rough pre-size to avoid resizing
            );
            bmp.compress(Bitmap.CompressFormat.JPEG, quality, stream);

            return "data:image/jpeg;base64," + Base64.encodeToString(
                    stream.toByteArray(), Base64.NO_WRAP
            );

        } catch (IOException e) {
            return "";
        } finally {
            if (bmp != null) bmp.recycle();
        }
    }

    private boolean checkMediaPermissionState(PluginCall call) {
        MediaPermissionState current = getMediaPermissionState();
        Log.d(TAG, String.format("media permission state=%s", current));

        if (current == MediaPermissionState.DENIED_ONCE) {
            JSObject result = new JSObject();
            result.put("error", "permission_denied_once");
            call.resolve(result);
            return false;
        } else if (current == MediaPermissionState.DENIED) {
            JSObject result = new JSObject();
            result.put("error", "permission_denied");
            call.resolve(result);
            return false;
        }

        return true;
    }

    private void resolvePermissionCall(PluginCall call, MediaPermissionState state) {
        Log.d(TAG, String.format("resolve permission call: state=%s", state));

        JSObject result = new JSObject();
        result.put("status", state.name().toLowerCase()); // "granted" | "partial" | "denied"
        result.put("isPartial", state == MediaPermissionState.PARTIAL);
        call.resolve(result);
    }

    private void resolveWithSettingsRequired(PluginCall call, MediaPermissionState state) {
        Log.d(TAG, "resolve with settings required call");

        JSObject result = new JSObject();
        result.put("status", state.name().toLowerCase()); // "granted" | "partial" | "denied"
        result.put("isPartial", false);
        result.put("settingsRequired", true);
        call.resolve(result);
    }

    public void requestMediaPermissions(PluginCall call) {
        Log.d(TAG, "request media permissions");
        // Already have sufficient access — resolve immediately
        MediaPermissionState current = getMediaPermissionState();
        if (current == MediaPermissionState.GRANTED) {
            resolvePermissionCall(call, current);
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            boolean imagesPermanentlyDenied = isPermissionPermanentlyDenied(Manifest.permission.READ_MEDIA_IMAGES);
            boolean videoPermanentlyDenied = isPermissionPermanentlyDenied(Manifest.permission.READ_MEDIA_VIDEO);

            if (imagesPermanentlyDenied || videoPermanentlyDenied) {
                resolveWithSettingsRequired(call, current);
                return;
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            markAskedBefore(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED);
            requestPermissionForAliases(new String[]{"readMediaImages", "readMediaVideo", "readMediaVisualUserSelected"}, call, "onMediaPermissionResult");
        } else if (Build.VERSION.SDK_INT == Build.VERSION_CODES.TIRAMISU) {
            markAskedBefore(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO);
            requestPermissionForAliases(
                    new String[]{"readMediaImages", "readMediaVideo"},
                    call,
                    "onMediaPermissionResult"
            );
        } else {
            markAskedBefore(Manifest.permission.READ_EXTERNAL_STORAGE);
            requestPermissionForAlias("readMediaLegacy", call, "onMediaPermissionResult");
        }
    }

    @PermissionCallback
    private void onMediaPermissionResult(PluginCall call) {
        MediaPermissionState state = getMediaPermissionState();
        resolvePermissionCall(call, state);
    }

    public MediaPermissionState getMediaPermissionState() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34 = Android 14
            return getPermissionStateApi34();
        } else if (Build.VERSION.SDK_INT == Build.VERSION_CODES.TIRAMISU) { // API 33 = Android 13
            return getPermissionStateApi33();
        } else {
            return getPermissionStateLegacy();
        }
    }

    private MediaPermissionState getPermissionStateApi34() {
        PermissionState imagesState = getPermissionState("readMediaImages");
        PermissionState videoState = getPermissionState("readMediaVideo");
        PermissionState partialState = getPermissionState("readMediaVisualUserSelected");

        if (imagesState == PermissionState.GRANTED && videoState == PermissionState.GRANTED) {
            return MediaPermissionState.GRANTED;
        } else if (partialState == PermissionState.GRANTED) {
            // User granted access to a subset of their media
            return MediaPermissionState.PARTIAL;
        } else if (imagesState == PermissionState.PROMPT_WITH_RATIONALE || videoState == PermissionState.PROMPT_WITH_RATIONALE) {
            return MediaPermissionState.DENIED_ONCE;
        } else {
            return MediaPermissionState.DENIED;
        }
    }

    private MediaPermissionState getPermissionStateApi33() {
        PermissionState imagesState = getPermissionState("readMediaImages");
        PermissionState videoState = getPermissionState("readMediaVideo");

        if (imagesState == PermissionState.GRANTED && videoState == PermissionState.GRANTED) {
            return MediaPermissionState.GRANTED;
        } else if (imagesState == PermissionState.PROMPT_WITH_RATIONALE || videoState == PermissionState.PROMPT_WITH_RATIONALE) {
            return MediaPermissionState.DENIED_ONCE;
        } else {
            return MediaPermissionState.DENIED;
        }
    }

    private MediaPermissionState getPermissionStateLegacy() {
        PermissionState legacyState = getPermissionState("readMediaLegacy");
        if (legacyState == PermissionState.GRANTED) {
            return MediaPermissionState.GRANTED;
        } else if (legacyState == PermissionState.PROMPT_WITH_RATIONALE) {
            return MediaPermissionState.DENIED_ONCE;
        } else {
            return MediaPermissionState.DENIED;
        }
    }

    private boolean isPermissionPermanentlyDenied(String permission) {
        boolean denied = ContextCompat.checkSelfPermission(getContext(), permission)
                != PackageManager.PERMISSION_GRANTED;
        // shouldShowRequestPermissionRationale returns false in two cases:
        //   1. Never asked yet (first time)
        //   2. User checked "Don't ask again" / exhausted prompt slots
        // So we need to track whether we've asked before to distinguish them.
        boolean shouldShow = ActivityCompat.shouldShowRequestPermissionRationale(
                getActivity(), permission
        );

        boolean hasAsked = hasAskedBefore(permission);

        Log.d(TAG, String.format("is permission permanently denied: denied=%b, shouldShow=%b, hasAskedBefore=%b", denied, shouldShow, hasAsked));

        return denied && !shouldShow && hasAsked;
    }

    private boolean hasAskedBefore(String permission) {
        SharedPreferences prefs = getContext()
                .getSharedPreferences("media_permission_prefs", Context.MODE_PRIVATE);
        return prefs.getBoolean("asked_" + permission, false);
    }

    private void markAskedBefore(String... permissions) {
        SharedPreferences.Editor editor = getContext()
                .getSharedPreferences("media_permission_prefs", Context.MODE_PRIVATE)
                .edit();
        for (String p : permissions) {
            editor.putBoolean("asked_" + p, true);
        }
        editor.apply();
    }

}
