package dev.huginn;

import android.os.Bundle;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private KeyboardInsetPlugin keyboardInsetPlugin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KeyboardInsetPlugin.class);
        super.onCreate(savedInstanceState);

        keyboardInsetPlugin = (KeyboardInsetPlugin) getBridge().getPlugin("KeyboardInset").getInstance();

        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            int imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
            int navBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int keyboardHeight = Math.max(0, imeHeight - navBarHeight);
            boolean istShowing = imeHeight > 0;

            float density = getResources().getDisplayMetrics().density;
            float heightDp = keyboardHeight / density;

            keyboardInsetPlugin.notifyKeyboard(istShowing, heightDp);

            return ViewCompat.onApplyWindowInsets(view, insets);
        });
    }
}