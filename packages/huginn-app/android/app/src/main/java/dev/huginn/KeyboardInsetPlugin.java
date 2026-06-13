package dev.huginn;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "KeyboardInset")
public class KeyboardInsetPlugin extends Plugin {

//    @PluginMethod
//    public void getLastHeight(PluginCall call) {
//        JSObject ret = new JSObject();
//        ret.put("keyboardHeight", lastKeyboardHeight);
//        call.resolve(ret);
//    }

//    private float lastKeyboardHeight = 0;

    public void notifyKeyboard(boolean isShowing, float heightDp) {
//        lastKeyboardHeight = heightDp;
        JSObject data = new JSObject();
        data.put("height", heightDp);
        data.put("isShowing", isShowing);
        notifyListeners("keyboardInsetChange", data);
    }
}