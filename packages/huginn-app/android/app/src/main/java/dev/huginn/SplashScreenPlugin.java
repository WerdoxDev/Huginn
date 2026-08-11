package dev.huginn;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SplashScreen")
public class SplashScreenPlugin extends Plugin {

    @PluginMethod
    public void hide(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();
        activity.hideSplash();
        call.resolve();
    }
}
