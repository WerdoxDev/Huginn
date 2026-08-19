package dev.huginn;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
public class MessagingService extends FirebaseMessagingService {
    private static final String TAG = MessagingService.class.getSimpleName();
    private MessageNotifier notifier;

    @Override
    public void onCreate() {
        super.onCreate();
        notifier = new MessageNotifier(getApplicationContext());
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();

        if ("add_message".equals(data.get("type")) && !PushNotificationsPlugin.areNotificationsEnabled(this)) {
            Log.w(TAG, "Notifications disabled locally;");
            return;
        }

        boolean suppressNotification = isAppInForeground() && "add_message".equals(data.get("type")) && PushNotificationsPlugin.inActiveChannel(data.get("channelId"));

        if (suppressNotification) return;

        showNotification(remoteMessage);
        if (isAppInForeground()) {
            PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "onNewToken");
        super.onNewToken(token);
        PushNotificationsPlugin.onNewToken(token);
    }

    private boolean isAppInForeground() {
        ActivityManager.RunningAppProcessInfo processInfo = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(processInfo);
        return processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                || processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
    }

    private void showNotification(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();

        String type = getValue(data, "type");

        if (type.equals("add_message")) {
            String content = getValue(data, "content");
            String notificationChannelId = getValue(data, "notificationChannelId");
            String pushMessageId = remoteMessage.getMessageId();
            String messageId = getValue(data, "messageId");
            String channelId = getValue(data, "channelId");
            String authorId = getValue(data, "authorId");

            if (channelId == null || channelId.isEmpty()) {
                Log.w(TAG, "Ignoring message notification without a channelId");
                return;
            }

            long timestamp = Long.parseLong(getValue(data, "timestamp"));
            String username = getValue(data, "username");
            String authorIconUrl = getValue(data, "authorIconUrl");
            String channelIconUrl = getValue(data, "channelIconUrl");
            String channelName = getValue(data, "channelName");
            int channelType = Integer.parseInt(getValue(data, "channelType"));

            int notificationId = pushMessageId == null
                    ? (int) (System.currentTimeMillis() & 0x7fffffff)
                    : pushMessageId.hashCode() & 0x7fffffff;

            assert notificationChannelId != null;

            Intent intent = new Intent(this, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    .setAction(getPackageName() + ".OPEN_NOTIFICATION." + notificationId);
            intent.putExtra("google.message_id", pushMessageId == null ? String.valueOf(notificationId) : pushMessageId);
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }

            Intent shortcutIntent = new Intent(intent)
                    .setAction(getPackageName() + ".OPEN_CONVERSATION." + channelId);
            intent.putExtra(MessageNotifier.EXTRA_CONVERSATION_ID, channelId);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    notificationId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Bitmap avatarBitmap = loadBitmap(authorIconUrl);
            Bitmap channelBitmap = loadBitmap(channelIconUrl);

            Log.d(TAG, "Loaded avatar bitmap: " + (avatarBitmap != null ? "success" : "null"));
            Log.d(TAG, "Loaded channel bitmap: " + (channelBitmap != null ? "success" : "null"));
            Log.d(TAG, "Author icon URL: " + authorIconUrl);
            Log.d(TAG, "Channel icon URL: " + channelIconUrl);

            Bitmap circleAvatarBitmap = avatarBitmap != null
                    ? getCircleBitmap(avatarBitmap)
                    : createFallbackIconBitmap();
            Bitmap circleChannelBitmap = channelBitmap != null
                    ? getCircleBitmap(channelBitmap)
                    : createFallbackIconBitmap();

            IconCompat avatarIcon = IconCompat.createWithBitmap(circleAvatarBitmap);
            IconCompat channelIcon = IconCompat.createWithBitmap(circleChannelBitmap);

            Person author = new Person.Builder()
                    .setName(username)
                    .setKey(authorId)
                    .setIcon(avatarIcon)
                    .build();
            Person me = new Person.Builder().setName("Me").build();

            notifier.addIncomingMessage(
                    channelId,
                    messageId,
                    author,
                    me,
                    content,
                    timestamp,
                    channelType == 1,
                    channelName,
                    circleAvatarBitmap,
                    avatarIcon,
                    channelIcon,
                    shortcutIntent,
                    pendingIntent
            );
        } else if (type.equals("ack_message")) {
            String messageId = getValue(data, "messageId");
            String channelId = getValue(data, "channelId");
            notifier.removeMessage(channelId, messageId);
        }
    }

    private String getValue(Map<String, String> data, String key) {
        return data.get(key);
    }

    private Bitmap loadBitmap(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return null;
        }

        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(imageUrl).openConnection();
            connection.setConnectTimeout(5_000);
            connection.setReadTimeout(5_000);
            connection.setDoInput(true);
            connection.connect();
            if (connection.getResponseCode() < 200 || connection.getResponseCode() >= 300) {
                return null;
            }
            return BitmapFactory.decodeStream(connection.getInputStream());
        } catch (IOException exception) {
            Log.w(TAG, "Could not load notification image", exception);
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private Bitmap getCircleBitmap(Bitmap bitmap) {
        final Bitmap output = Bitmap.createBitmap(bitmap.getWidth(),
                bitmap.getHeight(), Bitmap.Config.ARGB_8888);
        final Canvas canvas = new Canvas(output);

        final int color = Color.RED;
        final Paint paint = new Paint();
        final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
        final RectF rectF = new RectF(rect);

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        paint.setColor(color);
        canvas.drawOval(rectF, paint);

        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, rect, paint);

        bitmap.recycle();

        return output;
    }

    private Bitmap createFallbackIconBitmap() {
        int size = Math.round(64 * getResources().getDisplayMetrics().density);
        Bitmap output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(output);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
//        paint.setColor(getColor(R.color.notification_color));
        paint.setColor(Color.parseColor(PushNotificationsPlugin.getDefaultNotificationColor(this)));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);
        return output;
    }
}
