package dev.huginn;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final String TAG = GalleryPlugin.class.getSimpleName();
    private boolean appIsReady = false;
    private InsetPlugin insetPlugin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(InsetPlugin.class);
        registerPlugin(GalleryPlugin.class);
        registerPlugin(FilesPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);

        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !appIsReady);

        registerPlugin(SplashScreenPlugin.class);

        super.onCreate(savedInstanceState);

        clearNotificationHistory(getIntent());

        insetPlugin = (InsetPlugin) getBridge().getPlugin("Inset").getInstance();

        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            int imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
            int navBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int keyboardHeight = Math.max(0, imeHeight);
            boolean isShowing = imeHeight > 0;

            float density = getResources().getDisplayMetrics().density;
            float keyboardHeightDp = keyboardHeight / density;
            float navBarHeightDp = navBarHeight / density;

            int navBar = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int statusBar = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;

            Log.d(TAG, "insets:" + " ime=" + imeHeight + " nav=" + navBar + " status=" + statusBar + " sys=" + systemBars);

            insetPlugin.notifyInsetChange(isShowing, keyboardHeightDp, navBarHeightDp);

            WindowInsetsCompat filteredInsets = new WindowInsetsCompat.Builder(insets)
                    .setInsets(WindowInsetsCompat.Type.ime(), androidx.core.graphics.Insets.NONE)
                    .setInsets(WindowInsetsCompat.Type.navigationBars(), androidx.core.graphics.Insets.NONE)
                    .build();
            return ViewCompat.onApplyWindowInsets(view, filteredInsets);
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        clearNotificationHistory(intent);
    }

    private void clearNotificationHistory(Intent intent) {
        if (intent == null) {
            return;
        }

        String conversationId = intent.getStringExtra(MessageNotifier.EXTRA_CONVERSATION_ID);
        if (conversationId != null) {
            MessageNotifier.clearConversation(this, conversationId);
            intent.removeExtra(MessageNotifier.EXTRA_CONVERSATION_ID);
        }
    }

    public void hideSplash() {
        runOnUiThread(() -> {
            appIsReady = true;
        });
    }
}
