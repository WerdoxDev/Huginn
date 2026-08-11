package dev.huginn;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class NotificationDismissedReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        MessageNotifier.clearConversation(
                context,
                intent.getStringExtra(MessageNotifier.EXTRA_CONVERSATION_ID)
        );
    }
}
