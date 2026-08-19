package dev.huginn;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class MessageNotifier {
    private static final String TAG = MessageNotifier.class.getSimpleName();
    private static final String PREFERENCES_NAME = "message_notification_history";
    private static final int MAX_MESSAGES_PER_CONVERSATION = 10;
    private static final Object STORE_LOCK = new Object();

    public static final String EXTRA_CONVERSATION_ID = "dev.huginn.notification.CONVERSATION_ID";

    private final Context context;

    public MessageNotifier(Context context) {
        this.context = context;
    }

    @SuppressLint("MissingPermission")
    public void addIncomingMessage(String conversationId, String messageId, Person author, Person me,
                                   String text, long timestamp, boolean isGroup, String channelName,
                                   Bitmap avatarBitmap, IconCompat avatarIcon, IconCompat conversationIcon,
                                   Intent shortcutIntent, PendingIntent contentIntent) {

        List<StoredMessage> storedMessages;
        synchronized (STORE_LOCK) {
            if (!isNotificationActive(conversationId)) {
                clearConversationLocked(context, conversationId);
            }
            storedMessages = readMessagesLocked(context, conversationId);
            storedMessages.add(StoredMessage.from(messageId, text, timestamp, author));
            while (storedMessages.size() > MAX_MESSAGES_PER_CONVERSATION) {
                storedMessages.remove(0);
            }
            writeMessagesLocked(context, conversationId, storedMessages);
        }

        NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(me).setGroupConversation(isGroup);
        if (isGroup) {
            messagingStyle.setConversationTitle(channelName);
        }

        for (int index = 0; index < storedMessages.size(); index++) {
            StoredMessage storedMessage = storedMessages.get(index);
            Person messageAuthor = index == storedMessages.size() - 1
                    ? author
                    : storedMessage.toPerson();
            messagingStyle.addMessage(storedMessage.text, storedMessage.timestamp, messageAuthor);
        }

        Log.d(TAG, "Convo: " + conversationId + " | Message count: " + storedMessages.size());

        ShortcutInfoCompat shortcut = new ShortcutInfoCompat.Builder(context, conversationId)
                .setShortLabel(channelName)
                .setIcon(isGroup ? conversationIcon : avatarIcon)
                .setIntent(shortcutIntent)
                .setPerson(author)
                .setLongLived(true)
                .build();

        ShortcutManagerCompat.pushDynamicShortcut(context, shortcut);

        Intent dismissIntent = new Intent(context, NotificationDismissedReceiver.class)
                .setAction(context.getPackageName() + ".DISMISS_MESSAGE_NOTIFICATION." + conversationId)
                .putExtra(EXTRA_CONVERSATION_ID, conversationId);
        PendingIntent deleteIntent = PendingIntent.getBroadcast(
                context,
                conversationId.hashCode(),
                dismissIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(context, "messages")
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(channelName)
                .setLargeIcon(avatarBitmap)
                .setColor(context.getColor(R.color.notification_color))
                .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
                .setSubText("Huginn")
                .setContentText(text)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
//                .setColor(ContextCompat.getColor(context, R.color.telegram_blue))
                .setStyle(messagingStyle)
                .setShortcutInfo(shortcut)
                .setShowWhen(true)
                .setAutoCancel(true)
                .setContentIntent(contentIntent)
                .setDeleteIntent(deleteIntent)
                .build();

        NotificationManagerCompat.from(context)
                .notify(conversationId.hashCode(), notification);
    }

    @SuppressLint("MissingPermission")
    public void removeMessage(String conversationId, String messageId) {
        if (conversationId == null || conversationId.isEmpty()
                || messageId == null || messageId.isEmpty()) {
            return;
        }

        Notification activeNotification = getActiveNotification(conversationId);
        List<StoredMessage> storedMessages;
        List<Integer> retainedMessageIndices = new ArrayList<>();
        int originalMessageCount;

        synchronized (STORE_LOCK) {
            storedMessages = readMessagesLocked(context, conversationId);
            originalMessageCount = storedMessages.size();
            Long removedMessageTimestamp = null;
            for (int index = 0; index < storedMessages.size(); index++) {
                if (messageId.equals(storedMessages.get(index).messageId)) {
                    removedMessageTimestamp = storedMessages.get(index).timestamp;
                    break;
                }
            }

            if (removedMessageTimestamp == null) {
                return;
            }

            List<StoredMessage> retainedMessages = new ArrayList<>();
            for (int index = 0; index < storedMessages.size(); index++) {
                StoredMessage storedMessage = storedMessages.get(index);
                boolean isRemovedMessage = messageId.equals(storedMessage.messageId);
                if (!isRemovedMessage && storedMessage.timestamp >= removedMessageTimestamp) {
                    retainedMessages.add(storedMessage);
                    retainedMessageIndices.add(index);
                }
            }
            storedMessages = retainedMessages;

            if (storedMessages.isEmpty()) {
                clearConversationLocked(context, conversationId);
            } else {
                writeMessagesLocked(context, conversationId, storedMessages);
            }
        }

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        if (storedMessages.isEmpty()) {
            notificationManager.cancel(conversationId.hashCode());
            return;
        }

        if (activeNotification == null) {
            return;
        }

        NotificationCompat.MessagingStyle existingStyle =
                NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(activeNotification);
        if (existingStyle == null) {
            Log.w(TAG, "Could not rebuild message notification for " + conversationId);
            notificationManager.cancel(conversationId.hashCode());
            return;
        }

        NotificationCompat.MessagingStyle updatedStyle =
                new NotificationCompat.MessagingStyle(existingStyle.getUser())
                        .setGroupConversation(existingStyle.isGroupConversation());
        if (existingStyle.isGroupConversation()) {
            updatedStyle.setConversationTitle(existingStyle.getConversationTitle());
        }

        List<NotificationCompat.MessagingStyle.Message> activeMessages = existingStyle.getMessages();
        if (activeMessages.size() == originalMessageCount
                && !retainedMessageIndices.isEmpty()
                && retainedMessageIndices.get(retainedMessageIndices.size() - 1) < activeMessages.size()) {
            for (int retainedMessageIndex : retainedMessageIndices) {
                updatedStyle.addMessage(activeMessages.get(retainedMessageIndex));
            }
        } else {
            for (StoredMessage storedMessage : storedMessages) {
                updatedStyle.addMessage(
                        storedMessage.text,
                        storedMessage.timestamp,
                        storedMessage.toPerson()
                );
            }
        }

        StoredMessage latestMessage = storedMessages.get(storedMessages.size() - 1);
        Notification updatedNotification = new NotificationCompat.Builder(context, activeNotification)
                .setContentText(latestMessage.text)
                .setWhen(latestMessage.timestamp)
                .setOnlyAlertOnce(true)
                .setStyle(updatedStyle)
                .build();

        notificationManager.notify(conversationId.hashCode(), updatedNotification);
    }

    public static void clearConversation(Context context, String conversationId) {
        if (conversationId == null || conversationId.isEmpty()) {
            return;
        }
        synchronized (STORE_LOCK) {
            clearConversationLocked(context, conversationId);
        }
    }

    public static void clearConversationForNotificationId(Context context, int notificationId) {
        synchronized (STORE_LOCK) {
            SharedPreferences preferences = getPreferences(context);
            SharedPreferences.Editor editor = preferences.edit();
            boolean changed = false;
            for (String conversationId : preferences.getAll().keySet()) {
                if (conversationId.hashCode() == notificationId) {
                    editor.remove(conversationId);
                    changed = true;
                }
            }
            if (changed) {
                editor.apply();
            }
        }
    }

    public static void clearAllConversations(Context context) {
        synchronized (STORE_LOCK) {
            getPreferences(context).edit().clear().apply();
        }
    }

    private boolean isNotificationActive(String conversationId) {
        return getActiveNotification(conversationId) != null;
    }

    private Notification getActiveNotification(String conversationId) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) {
            return null;
        }

        for (StatusBarNotification activeNotification : manager.getActiveNotifications()) {
            Notification notification = activeNotification.getNotification();
            if (activeNotification.getId() == conversationId.hashCode()
                    && conversationId.equals(notification.getShortcutId())) {
                return notification;
            }
        }
        return null;
    }

    private static SharedPreferences getPreferences(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private static List<StoredMessage> readMessagesLocked(Context context, String conversationId) {
        List<StoredMessage> messages = new ArrayList<>();
        String serializedMessages = getPreferences(context).getString(conversationId, null);
        if (serializedMessages == null) {
            return messages;
        }

        try {
            JSONArray jsonMessages = new JSONArray(serializedMessages);
            for (int index = 0; index < jsonMessages.length(); index++) {
                JSONObject jsonMessage = jsonMessages.getJSONObject(index);
                messages.add(new StoredMessage(
                        jsonMessage.optString("messageId", null),
                        jsonMessage.getString("text"),
                        jsonMessage.getLong("timestamp"),
                        jsonMessage.getString("authorName"),
                        jsonMessage.optString("authorKey", null)
                ));
            }
        } catch (JSONException exception) {
            Log.w(TAG, "Could not restore notification messages for " + conversationId, exception);
            clearConversationLocked(context, conversationId);
        }
        return messages;
    }

    private static void writeMessagesLocked(Context context, String conversationId, List<StoredMessage> messages) {
        JSONArray jsonMessages = new JSONArray();
        try {
            for (StoredMessage message : messages) {
                JSONObject jsonMessage = new JSONObject()
                        .put("text", message.text)
                        .put("timestamp", message.timestamp)
                        .put("authorName", message.authorName);
                if (message.messageId != null) {
                    jsonMessage.put("messageId", message.messageId);
                }
                if (message.authorKey != null) {
                    jsonMessage.put("authorKey", message.authorKey);
                }
                jsonMessages.put(jsonMessage);
            }
        } catch (JSONException exception) {
            Log.w(TAG, "Could not persist notification messages for " + conversationId, exception);
            return;
        }

        getPreferences(context).edit()
                .putString(conversationId, jsonMessages.toString())
                .apply();
    }

    private static void clearConversationLocked(Context context, String conversationId) {
        getPreferences(context).edit().remove(conversationId).apply();
    }

    private static final class StoredMessage {
        private final String messageId;
        private final String text;
        private final long timestamp;
        private final String authorName;
        private final String authorKey;

        private StoredMessage(String messageId, String text, long timestamp, String authorName, String authorKey) {
            this.messageId = messageId;
            this.text = text;
            this.timestamp = timestamp;
            this.authorName = authorName;
            this.authorKey = authorKey;
        }

        private static StoredMessage from(String messageId, String text, long timestamp, Person author) {
            CharSequence name = author.getName();
            return new StoredMessage(
                    messageId,
                    text,
                    timestamp,
                    name == null ? "Unknown" : name.toString(),
                    author.getKey()
            );
        }

        private Person toPerson() {
            Person.Builder builder = new Person.Builder().setName(authorName);
            if (authorKey != null) {
                builder.setKey(authorKey);
            }
            return builder.build();
        }
    }
}
