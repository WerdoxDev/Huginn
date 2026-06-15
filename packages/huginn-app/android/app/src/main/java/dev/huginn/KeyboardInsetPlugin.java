package dev.huginn;

import android.content.Context;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import androidx.appcompat.app.AppCompatActivity;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "KeyboardInset")
public class KeyboardInsetPlugin extends Plugin {
    @PluginMethod
    public void show(PluginCall call) {
        AppCompatActivity activity = getActivity();
        ((InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE)).showSoftInput(activity.getCurrentFocus(), 0);
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        AppCompatActivity activity = getActivity();
        InputMethodManager inputManager = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
        View v = activity.getCurrentFocus();
        if (v != null) {
            inputManager.hideSoftInputFromWindow(v.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
        }

        call.resolve();
    }

    public void notifyKeyboard(boolean isShowing, float heightDp) {
        JSObject data = new JSObject();
        data.put("height", heightDp);
        data.put("isShowing", isShowing);
        notifyListeners("keyboardInsetChange", data);
    }
}