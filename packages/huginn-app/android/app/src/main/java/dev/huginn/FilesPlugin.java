package dev.huginn;

import android.app.Activity;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "Files")
public class FilesPlugin extends Plugin {
    private static final String RECENTS_PREFERENCES = "file_recents";
    private static final String RECENTS_KEY = "uris";
    private static final int MAX_RECENT_FILES = 100;

    @PluginMethod
    public void getRecentFiles(PluginCall call) {
        int limit = Math.max(1, Math.min(call.getInt("limit", 40), MAX_RECENT_FILES));

        bridge.execute(() -> {
            try {
                JSArray files = new JSArray();
                addPersistedFiles(files, limit);

                JSObject result = new JSObject();
                result.put("files", files);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to load recent files", error);
            }
        });
    }

    @PluginMethod
    public void pickFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, call.getBoolean("multiple", true));
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "onFilesPicked");
    }

    @ActivityCallback
    private void onFilesPicked(PluginCall call, ActivityResult activityResult) {
        if (call == null) return;

        Intent data = activityResult.getData();
        if (activityResult.getResultCode() != Activity.RESULT_OK || data == null) {
            JSObject result = new JSObject();
            result.put("files", new JSArray());
            call.resolve(result);
            return;
        }

        bridge.execute(() -> {
            try {
                List<Uri> selectedUris = getSelectedUris(data);
                JSArray files = new JSArray();

                for (Uri uri : selectedUris) {
                    persistReadPermission(uri, data.getFlags());
                    JSObject file = getFileDetails(uri);
                    if (file != null) files.put(file);
                }

                saveRecentUris(selectedUris);

                JSObject result = new JSObject();
                result.put("files", files);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to read selected files", error);
            }
        });
    }

    private List<Uri> getSelectedUris(Intent data) {
        List<Uri> selectedUris = new ArrayList<>();
        ClipData clipData = data.getClipData();

        if (clipData != null) {
            for (int index = 0; index < clipData.getItemCount(); index++) {
                selectedUris.add(clipData.getItemAt(index).getUri());
            }
        } else if (data.getData() != null) {
            selectedUris.add(data.getData());
        }

        return selectedUris;
    }

    private void persistReadPermission(Uri uri, int resultFlags) {
        int takeFlags = resultFlags & Intent.FLAG_GRANT_READ_URI_PERMISSION;
        if (takeFlags == 0) return;

        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, takeFlags);
        } catch (RuntimeException ignored) {
            // Some document providers grant access for the current app session only.
        }
    }

    private void saveRecentUris(List<Uri> selectedUris) {
        SharedPreferences preferences = getContext().getSharedPreferences(RECENTS_PREFERENCES, Context.MODE_PRIVATE);
        JSONArray previousUris;

        try {
            previousUris = new JSONArray(preferences.getString(RECENTS_KEY, "[]"));
        } catch (Exception ignored) {
            previousUris = new JSONArray();
        }

        JSONArray nextUris = new JSONArray();
        Set<String> includedUris = new HashSet<>();

        for (Uri uri : selectedUris) {
            String value = uri.toString();
            if (includedUris.add(value)) nextUris.put(value);
        }

        for (int index = 0; index < previousUris.length() && nextUris.length() < MAX_RECENT_FILES; index++) {
            String value = previousUris.optString(index);
            if (!value.isEmpty() && includedUris.add(value)) nextUris.put(value);
        }

        preferences.edit().putString(RECENTS_KEY, nextUris.toString()).apply();
    }

    private void addPersistedFiles(JSArray files, int limit) {
        SharedPreferences preferences = getContext().getSharedPreferences(RECENTS_PREFERENCES, Context.MODE_PRIVATE);
        JSONArray recentUris;

        try {
            recentUris = new JSONArray(preferences.getString(RECENTS_KEY, "[]"));
        } catch (Exception ignored) {
            recentUris = new JSONArray();
        }

        for (int index = 0; index < recentUris.length() && files.length() < limit; index++) {
            String value = recentUris.optString(index);
            if (value.isEmpty()) continue;

            try {
                Uri uri = Uri.parse(value);
                if (!canReadFile(getContext().getContentResolver(), uri)) continue;

                JSObject file = getFileDetails(uri);
                if (file != null) files.put(file);
            } catch (RuntimeException ignored) {
                // Ignore stale URI grants or documents that no longer exist.
            }
        }
    }

    private JSObject getFileDetails(Uri uri) {
        ContentResolver resolver = getContext().getContentResolver();
        String[] projection = {
                OpenableColumns.DISPLAY_NAME,
                OpenableColumns.SIZE,
                DocumentsContract.Document.COLUMN_LAST_MODIFIED
        };

        try (Cursor cursor = resolver.query(uri, projection, null, null, null)) {
            if (cursor == null || !cursor.moveToFirst()) return null;

            int nameColumn = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
            int sizeColumn = cursor.getColumnIndex(OpenableColumns.SIZE);
            int modifiedColumn = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED);

            String name = nameColumn >= 0 ? cursor.getString(nameColumn) : null;
            long size = sizeColumn >= 0 && !cursor.isNull(sizeColumn) ? cursor.getLong(sizeColumn) : 0;
            long modifiedAt = modifiedColumn >= 0 && !cursor.isNull(modifiedColumn) ? cursor.getLong(modifiedColumn) : 0;
            return createFile(uri, name, resolver.getType(uri), size, modifiedAt);
        }
    }

    private boolean canReadFile(ContentResolver resolver, Uri uri) {
        try (AssetFileDescriptor descriptor = resolver.openAssetFileDescriptor(uri, "r")) {
            return descriptor != null;
        } catch (Exception ignored) {
            return false;
        }
    }

    private JSObject createFile(Uri uri, String name, String mimeType, long size, long modifiedAt) {
        JSObject file = new JSObject();
        file.put("uri", uri.toString());
        file.put("name", name != null && !name.isEmpty() ? name : "Unnamed file");
        file.put("mimeType", mimeType != null && !mimeType.isEmpty() ? mimeType : "application/octet-stream");
        file.put("size", size);
        file.put("modifiedAt", modifiedAt);
        return file;
    }
}
