package dev.huginn;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
        name = "PushNotifications",
        permissions = @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = PushNotificationsPlugin.PUSH_NOTIFICATIONS)
)
public class PushNotificationsPlugin extends Plugin {
    private static final String TAG = PushNotificationsPlugin.class.getSimpleName();
    static final String PUSH_NOTIFICATIONS = "receive";

    public static Bridge staticBridge = null;
    public static RemoteMessage lastMessage = null;
    public NotificationManager notificationManager;
    private NotificationChannelManager notificationChannelManager;

    private static final String EVENT_TOKEN_CHANGE = "registration";
    private static final String EVENT_TOKEN_ERROR = "registrationError";

    private static volatile String activeChannelId;

    public void load() {
        Log.d(TAG, "load: ");
        notificationManager = (NotificationManager) getActivity().getSystemService(Context.NOTIFICATION_SERVICE);

        staticBridge = this.bridge;
        if (lastMessage != null) {
            fireNotification(lastMessage);
            lastMessage = null;
        }

        notificationChannelManager = new NotificationChannelManager(getActivity(), notificationManager, getConfig());
    }

    @Override
    protected void handleOnNewIntent(Intent data) {
        super.handleOnNewIntent(data);
        Bundle bundle = data.getExtras();
        if (bundle != null && bundle.containsKey("google.message_id")) {
            JSObject notificationJson = new JSObject();
            JSObject dataObject = new JSObject();
            for (String key : bundle.keySet()) {
                if (key.equals("google.message_id")) {
                    notificationJson.put("id", bundle.getString(key));
                } else {
                    dataObject.put(key, bundle.get(key));
                }
            }
            notificationJson.put("data", dataObject);
            JSObject actionJson = new JSObject();
            actionJson.put("actionId", "tap");
            actionJson.put("notification", notificationJson);
            notifyListeners("pushNotificationActionPerformed", actionJson, true);
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject permissionsResultJSON = new JSObject();
            permissionsResultJSON.put("receive", "granted");
            call.resolve(permissionsResultJSON);
        } else {
            super.checkPermissions(call);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || getPermissionState(PUSH_NOTIFICATIONS) == PermissionState.GRANTED) {
            JSObject permissionsResultJSON = new JSObject();
            permissionsResultJSON.put("receive", "granted");
            call.resolve(permissionsResultJSON);
        } else {
            requestPermissionForAlias(PUSH_NOTIFICATIONS, call, "permissionsCallback");
        }
    }

    @PluginMethod
    public void register(PluginCall call) {
        FirebaseMessaging.getInstance().setAutoInitEnabled(true);
        FirebaseMessaging.getInstance()
                .getToken()
                .addOnCompleteListener((task) -> {
                    if (!task.isSuccessful()) {
                        sendError(task.getException().getLocalizedMessage());
                        return;
                    }
                    sendToken(task.getResult());
                });
        call.resolve();
    }

    @PluginMethod
    public void unregister(PluginCall call) {
        FirebaseMessaging.getInstance().setAutoInitEnabled(false);
        FirebaseMessaging.getInstance().deleteToken();
        call.resolve();
    }

    @PluginMethod
    public void setActiveChannel(PluginCall call) {
        activeChannelId = call.getString("channelId");
        call.resolve();
    }

    @PluginMethod
    public void getDeliveredNotifications(PluginCall call) {
        JSArray notifications = new JSArray();
        StatusBarNotification[] activeNotifications = notificationManager.getActiveNotifications();

        for (StatusBarNotification notif : activeNotifications) {
            JSObject jsNotif = new JSObject();

            jsNotif.put("id", notif.getId());
            jsNotif.put("tag", notif.getTag());

            Notification notification = notif.getNotification();
            if (notification != null) {
                jsNotif.put("title", notification.extras.getCharSequence(Notification.EXTRA_TITLE));
                jsNotif.put("body", notification.extras.getCharSequence(Notification.EXTRA_TEXT));
                jsNotif.put("group", notification.getGroup());
                jsNotif.put("groupSummary", 0 != (notification.flags & Notification.FLAG_GROUP_SUMMARY));

                JSObject extras = new JSObject();

                for (String key : notification.extras.keySet()) {
                    extras.put(key, notification.extras.get(key));
                }

                jsNotif.put("data", extras);
            }

            notifications.put(jsNotif);
        }

        JSObject result = new JSObject();
        result.put("notifications", notifications);
        call.resolve(result);
    }

    @PluginMethod
    public void removeDeliveredNotifications(PluginCall call) {
        JSArray notifications = call.getArray("notifications");

        try {
            for (Object o : notifications.toList()) {
                if (o instanceof JSONObject) {
                    JSObject notif = JSObject.fromJSONObject((JSONObject) o);
                    String tag = notif.getString("tag");
                    Integer id = notif.getInteger("id");

                    if (tag == null) {
                        notificationManager.cancel(id);
                    } else {
                        notificationManager.cancel(tag, id);
                    }
                    MessageNotifier.clearConversationForNotificationId(getActivity(), id);
                } else {
                    call.reject("Expected notifications to be a list of notification objects");
                }
            }
        } catch (JSONException e) {

            call.reject(e.getMessage());
        }

        call.resolve();
    }

    @PluginMethod
    public void removeAllDeliveredNotifications(PluginCall call) {
        notificationManager.cancelAll();
        MessageNotifier.clearAllConversations(getActivity());
        call.resolve();
    }

    @PluginMethod
    public void createChannel(PluginCall call) {
        notificationChannelManager.createChannel(call);
    }

    @PluginMethod
    public void deleteChannel(PluginCall call) {
        notificationChannelManager.deleteChannel(call);
    }

    @PluginMethod
    public void listChannels(PluginCall call) {
        notificationChannelManager.listChannels(call);
    }

    public void sendToken(String token) {
        JSObject data = new JSObject();
        data.put("value", token);
        notifyListeners(EVENT_TOKEN_CHANGE, data, true);
    }

    public void sendError(String error) {
        JSObject data = new JSObject();
        data.put("error", error);
        notifyListeners(EVENT_TOKEN_ERROR, data, true);
    }

    public static void onNewToken(String newToken) {
        PushNotificationsPlugin pushPlugin = PushNotificationsPlugin.getPushNotificationsInstance();
        if (pushPlugin != null) {
            pushPlugin.sendToken(newToken);
        }
        Log.d(TAG, "onNewToken " + newToken);
    }

    public static void sendRemoteMessage(RemoteMessage remoteMessage) {
        PushNotificationsPlugin pushPlugin = PushNotificationsPlugin.getPushNotificationsInstance();
        if (pushPlugin != null) {
            pushPlugin.fireNotification(remoteMessage);
        } else {
            Log.d(TAG, "OH NO");
            lastMessage = remoteMessage;
        }
    }

    public void fireNotification(RemoteMessage remoteMessage) {
        Log.d(TAG, "FIRE NOTIF");
        JSObject remoteMessageData = new JSObject();

        JSObject data = new JSObject();
        remoteMessageData.put("id", remoteMessage.getMessageId());
        for (String key : remoteMessage.getData().keySet()) {
            Object value = remoteMessage.getData().get(key);
            data.put(key, value);
        }
        remoteMessageData.put("data", data);

        RemoteMessage.Notification notification = remoteMessage.getNotification();
        String title = notification == null ? remoteMessage.getData().get("title") : notification.getTitle();
        String body = notification == null ? remoteMessage.getData().get("body") : notification.getBody();
        if (title != null) {
            remoteMessageData.put("title", title);
        }
        if (body != null) {
            remoteMessageData.put("body", body);
        }

        if (notification != null) {
            remoteMessageData.put("click_action", notification.getClickAction());
            Uri link = notification.getLink();
            if (link != null) {
                remoteMessageData.put("link", link.toString());
            }
        }

        notifyListeners("pushNotificationReceived", remoteMessageData, true);
    }

    public static PushNotificationsPlugin getPushNotificationsInstance() {
        if (staticBridge != null && staticBridge.getWebView() != null) {
            PluginHandle handle = staticBridge.getPlugin("PushNotifications");
            if (handle == null) {
                return null;
            }
            return (PushNotificationsPlugin) handle.getInstance();
        }
        return null;
    }

    public static boolean inActiveChannel(String channelId) {
        return channelId != null && channelId.equals(activeChannelId);
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        this.checkPermissions(call);
    }
}
