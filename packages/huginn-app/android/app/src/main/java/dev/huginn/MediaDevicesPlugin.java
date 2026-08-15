package dev.huginn;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebChromeClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
        name = "MediaDevices",
        permissions = {
                @Permission(alias = MediaDevicesPlugin.MICROPHONE, strings = {Manifest.permission.RECORD_AUDIO}),
                @Permission(alias = MediaDevicesPlugin.CAMERA, strings = {Manifest.permission.CAMERA})
        }
)
public class MediaDevicesPlugin extends Plugin {
    public static final String MICROPHONE = "microphone";
    public static final String CAMERA = "camera";

    private static final String EVENT_AUDIO_ROUTES_CHANGED = "audioRoutesChanged";
    private static final String EVENT_AUDIO_ROUTE_CHANGED = "audioRouteChanged";
    private static final String PERMISSION_PREFERENCES = "media_device_permission_prefs";
    private static final String TAG = MediaDevicesPlugin.class.getSimpleName();

    public enum MediaPermissionState {
        GRANTED,
        PROMPT,
        DENIED_ONCE,
        DENIED
    }

    private AudioManager audioManager;
    private AudioDeviceCallback audioDeviceCallback;
    private AudioManager.OnCommunicationDeviceChangedListener communicationDeviceChangedListener;
    private boolean communicationStarted;
    private int previousAudioMode = AudioManager.MODE_NORMAL;
    private String selectedRouteId;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        registerAudioRouteListeners();
    }

    @Override
    protected void handleOnDestroy() {
        unregisterAudioRouteListeners();
        stopCommunicationInternal();
    }

    @PluginMethod
    public void getPermissionStatus(PluginCall call) {
        resolvePermissionStatus(call);
    }

    @PluginMethod
    public void checkOrRequestPermissions(PluginCall call) {
        boolean requestMicrophone = call.getBoolean(MICROPHONE, true);
        boolean requestCamera = call.getBoolean(CAMERA, true);

        List<String> aliases = new ArrayList<>();
        List<String> permissions = new ArrayList<>();

        if (requestMicrophone && shouldRequestPermission(Manifest.permission.RECORD_AUDIO)) {
            aliases.add(MICROPHONE);
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }
        if (requestCamera && shouldRequestPermission(Manifest.permission.CAMERA)) {
            aliases.add(CAMERA);
            permissions.add(Manifest.permission.CAMERA);
        }

        if (aliases.isEmpty()) {
            resolvePermissionStatus(call);
            return;
        }

        markAskedBefore(permissions.toArray(new String[0]));
        requestPermissionForAliases(aliases.toArray(new String[0]), call, "onMediaDevicePermissionResult");
    }

    @PermissionCallback
    private void onMediaDevicePermissionResult(PluginCall call) {
        resolvePermissionStatus(call);
    }

    @PluginMethod
    public void getAudioRoutes(PluginCall call) {
        call.resolve(buildAudioRouteState());
    }

    @PluginMethod
    public void startCommunication(PluginCall call) {
        startCommunicationInternal();
        call.resolve(buildAudioRouteState());
    }

    @PluginMethod
    public void stopCommunication(PluginCall call) {
        stopCommunicationInternal();
        JSObject result = buildAudioRouteState();
        result.put("accepted", true);
        call.resolve(result);
    }

    @PluginMethod
    public void setAudioRoute(PluginCall call) {
        String routeId = call.getString("routeId");
        if (routeId == null || routeId.isEmpty()) {
            call.reject("routeId is required");
            return;
        }

        AudioDeviceInfo route = findRoute(routeId);
        if (route == null) {
            call.reject("The requested audio route is no longer available", "audio_route_unavailable");
            return;
        }

//        startCommunicationInternal();

        boolean accepted;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            accepted = audioManager.setCommunicationDevice(route);
        } else {
            accepted = setLegacyAudioRoute(route);
        }

        if (!accepted) {
            call.reject("Android rejected the requested audio route", "audio_route_rejected");
            return;
        }

        selectedRouteId = routeId;
        JSObject result = buildAudioRouteState();
        result.put("accepted", true);
        call.resolve(result);
        notifyListeners(EVENT_AUDIO_ROUTE_CHANGED, result);
    }

    private void resolvePermissionStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put(MICROPHONE, buildPermissionState(Manifest.permission.RECORD_AUDIO));
        result.put(CAMERA, buildPermissionState(Manifest.permission.CAMERA));
        call.resolve(result);
    }

    private JSObject buildPermissionState(String permission) {
        MediaPermissionState state = getMediaPermissionState(permission);
        JSObject result = new JSObject();
        result.put("status", state.name().toLowerCase());
        result.put("settingsRequired", state == MediaPermissionState.DENIED);
        return result;
    }

    private MediaPermissionState getMediaPermissionState(String permission) {
        if (ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED) {
            return MediaPermissionState.GRANTED;
        }

        if (isPermissionPermanentlyDenied(permission)) {
            return MediaPermissionState.DENIED;
        }

        if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), permission)) {
            return MediaPermissionState.DENIED_ONCE;
        }

        return MediaPermissionState.PROMPT;
    }

    private boolean shouldRequestPermission(String permission) {
        MediaPermissionState state = getMediaPermissionState(permission);
        return state == MediaPermissionState.PROMPT || state == MediaPermissionState.DENIED_ONCE;
    }

    private boolean isPermissionPermanentlyDenied(String permission) {
        boolean denied = ContextCompat.checkSelfPermission(getContext(), permission) != PackageManager.PERMISSION_GRANTED;
        boolean shouldShow = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), permission);
        boolean hasAsked = hasAskedBefore(permission);

        Log.d(TAG, String.format(
                "permission=%s denied=%b shouldShow=%b hasAskedBefore=%b",
                permission,
                denied,
                shouldShow,
                hasAsked
        ));

        return denied && !shouldShow && hasAsked;
    }

    private boolean hasAskedBefore(String permission) {
        SharedPreferences preferences = getContext().getSharedPreferences(PERMISSION_PREFERENCES, Context.MODE_PRIVATE);
        return preferences.getBoolean("asked_" + permission, false);
    }

    private void markAskedBefore(String... permissions) {
        SharedPreferences.Editor editor = getContext()
                .getSharedPreferences(PERMISSION_PREFERENCES, Context.MODE_PRIVATE)
                .edit();
        for (String permission : permissions) {
            editor.putBoolean("asked_" + permission, true);
        }
        editor.apply();
    }

    private void startCommunicationInternal() {
        if (audioManager == null || communicationStarted) return;

        previousAudioMode = audioManager.getMode();
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        communicationStarted = true;
    }

    private void stopCommunicationInternal() {
        if (audioManager == null || !communicationStarted) return;

        resetAudioRouteInternal();
        audioManager.setMode(previousAudioMode);
        communicationStarted = false;
    }

    private void resetAudioRouteInternal() {
        if (audioManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.clearCommunicationDevice();
        } else {
            audioManager.stopBluetoothSco();
            audioManager.setBluetoothScoOn(false);
            audioManager.setSpeakerphoneOn(false);
        }
        selectedRouteId = null;
    }

    private boolean setLegacyAudioRoute(AudioDeviceInfo route) {
        int type = route.getType();

        if (isBluetoothRoute(type)) {
            audioManager.setSpeakerphoneOn(false);
            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
            return true;
        }

        audioManager.stopBluetoothSco();
        audioManager.setBluetoothScoOn(false);
        audioManager.setSpeakerphoneOn(type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
        return true;
    }

    private AudioDeviceInfo findRoute(String routeId) {
        for (AudioDeviceInfo route : getAvailableAudioRoutes()) {
            if (getRouteId(route).equals(routeId)) return route;
        }
        return null;
    }

    private List<AudioDeviceInfo> getAvailableAudioRoutes() {
        if (audioManager == null) return new ArrayList<>();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return audioManager.getAvailableCommunicationDevices();
        }

        List<AudioDeviceInfo> routes = new ArrayList<>();
        for (AudioDeviceInfo device : audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) {
            if (isLegacyCommunicationRoute(device.getType())) routes.add(device);
        }
        return routes;
    }

    private JSObject buildAudioRouteState() {
        List<AudioDeviceInfo> availableRoutes = getAvailableAudioRoutes();
        AudioDeviceInfo activeRoute = getActiveAudioRoute(availableRoutes);
        ensureSelectedAudioRoute(availableRoutes);
        String activeRouteId = activeRoute == null ? null : getRouteId(activeRoute);

        JSArray routes = new JSArray();
        for (AudioDeviceInfo route : availableRoutes) {
            routes.put(buildAudioRoute(route, getRouteId(route).equals(activeRouteId)));
        }

        JSObject result = new JSObject();
        result.put("routes", routes);
        result.put("activeRouteId", activeRouteId == null ? JSObject.NULL : activeRouteId);
        result.put("selectedRouteId", selectedRouteId == null ? JSObject.NULL : selectedRouteId);
        result.put("communicationStarted", communicationStarted);
        result.put("supportsIndividualRoutes", Build.VERSION.SDK_INT >= Build.VERSION_CODES.S);
        return result;
    }

    private void ensureSelectedAudioRoute(List<AudioDeviceInfo> availableRoutes) {
        if (selectedRouteId != null && findRouteInList(availableRoutes, selectedRouteId) != null) return;

        AudioDeviceInfo defaultRoute = findFirstRouteOfType(availableRoutes, AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
        if (defaultRoute == null && !availableRoutes.isEmpty()) defaultRoute = availableRoutes.get(0);
        selectedRouteId = defaultRoute == null ? null : getRouteId(defaultRoute);
    }

    private JSObject buildAudioRoute(AudioDeviceInfo route, boolean active) {
        JSObject result = new JSObject();
        result.put("id", getRouteId(route));
        result.put("name", getRouteName(route));
        result.put("type", getRouteType(route.getType()));
        result.put("active", active);
        return result;
    }

    private AudioDeviceInfo getActiveAudioRoute(List<AudioDeviceInfo> availableRoutes) {
        if (audioManager == null) return null;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return audioManager.getCommunicationDevice();
        }

        if (selectedRouteId != null) {
            AudioDeviceInfo selected = findRouteInList(availableRoutes, selectedRouteId);
            if (selected != null) return selected;
        }

        @SuppressWarnings("deprecation")
        boolean speakerphoneOn = audioManager.isSpeakerphoneOn();
        if (speakerphoneOn)
            return findFirstRouteOfType(availableRoutes, AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);

        @SuppressWarnings("deprecation")
        boolean bluetoothScoOn = audioManager.isBluetoothScoOn();
        if (bluetoothScoOn) return findFirstBluetoothRoute(availableRoutes);

        AudioDeviceInfo external = findFirstExternalRoute(availableRoutes);
        if (external != null) return external;

        return findFirstRouteOfType(availableRoutes, AudioDeviceInfo.TYPE_BUILTIN_EARPIECE);
    }

    private AudioDeviceInfo findRouteInList(List<AudioDeviceInfo> routes, String routeId) {
        for (AudioDeviceInfo route : routes) {
            if (getRouteId(route).equals(routeId)) return route;
        }
        return null;
    }

    private AudioDeviceInfo findFirstRouteOfType(List<AudioDeviceInfo> routes, int type) {
        for (AudioDeviceInfo route : routes) {
            if (route.getType() == type) return route;
        }
        return null;
    }

    private AudioDeviceInfo findFirstBluetoothRoute(List<AudioDeviceInfo> routes) {
        for (AudioDeviceInfo route : routes) {
            if (isBluetoothRoute(route.getType())) return route;
        }
        return null;
    }

    private AudioDeviceInfo findFirstExternalRoute(List<AudioDeviceInfo> routes) {
        for (AudioDeviceInfo route : routes) {
            int type = route.getType();
            if (type != AudioDeviceInfo.TYPE_BUILTIN_EARPIECE && type != AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                return route;
            }
        }
        return null;
    }

    private String getRouteId(AudioDeviceInfo route) {
        return Integer.toString(route.getId());
    }

    private String getRouteName(AudioDeviceInfo route) {
        switch (route.getType()) {
            case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE:
                return "Phone";
            case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER:
                return "Speaker";
            default:
                String productName = route.getProductName().toString().trim();
                return productName.isEmpty() ? getRouteType(route.getType()) : productName;
        }
    }

    private String getRouteType(int type) {
        switch (type) {
            case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE:
                return "earpiece";
            case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER:
                return "speaker";
            case AudioDeviceInfo.TYPE_WIRED_HEADSET:
            case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
                return "wired";
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
            case AudioDeviceInfo.TYPE_BLUETOOTH_A2DP:
                return "bluetooth";
            case AudioDeviceInfo.TYPE_USB_ACCESSORY:
            case AudioDeviceInfo.TYPE_USB_DEVICE:
            case AudioDeviceInfo.TYPE_USB_HEADSET:
                return "usb";
            case AudioDeviceInfo.TYPE_HEARING_AID:
                return "hearing_aid";
            case AudioDeviceInfo.TYPE_HDMI:
            case AudioDeviceInfo.TYPE_HDMI_ARC:
                return "hdmi";
            default:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (type == AudioDeviceInfo.TYPE_BLE_HEADSET || type == AudioDeviceInfo.TYPE_BLE_SPEAKER) {
                        return "bluetooth";
                    }
                    if (type == AudioDeviceInfo.TYPE_HDMI_EARC) return "hdmi";
                }
                return "other";
        }
    }

    private boolean isBluetoothRoute(int type) {
        if (type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP)
            return true;
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && (type == AudioDeviceInfo.TYPE_BLE_HEADSET || type == AudioDeviceInfo.TYPE_BLE_SPEAKER);
    }

    private boolean isLegacyCommunicationRoute(int type) {
        switch (type) {
            case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE:
            case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER:
            case AudioDeviceInfo.TYPE_WIRED_HEADSET:
            case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
            case AudioDeviceInfo.TYPE_USB_ACCESSORY:
            case AudioDeviceInfo.TYPE_USB_DEVICE:
            case AudioDeviceInfo.TYPE_USB_HEADSET:
            case AudioDeviceInfo.TYPE_HEARING_AID:
                return true;
            default:
                return false;
        }
    }

    private void registerAudioRouteListeners() {
        if (audioManager == null) return;

        audioDeviceCallback = new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                notifyAudioRoutesChanged();
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                notifyAudioRoutesChanged();
            }
        };
        audioManager.registerAudioDeviceCallback(audioDeviceCallback, new Handler(Looper.getMainLooper()));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            communicationDeviceChangedListener = device -> {
                if (device == null) selectedRouteId = null;
                notifyListeners(EVENT_AUDIO_ROUTE_CHANGED, buildAudioRouteState());
            };
            audioManager.addOnCommunicationDeviceChangedListener(
                    getContext().getMainExecutor(),
                    communicationDeviceChangedListener
            );
        }
    }

    private void unregisterAudioRouteListeners() {
        if (audioManager == null) return;

        if (audioDeviceCallback != null) {
            audioManager.unregisterAudioDeviceCallback(audioDeviceCallback);
            audioDeviceCallback = null;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && communicationDeviceChangedListener != null) {
            audioManager.removeOnCommunicationDeviceChangedListener(communicationDeviceChangedListener);
            communicationDeviceChangedListener = null;
        }
    }

    private void notifyAudioRoutesChanged() {
        JSObject state = buildAudioRouteState();
        notifyListeners(EVENT_AUDIO_ROUTES_CHANGED, state);
        notifyListeners(EVENT_AUDIO_ROUTE_CHANGED, state);
    }
}
