package dev.huginn;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.webkit.WebView;

import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(AndroidJUnit4.class)
public class AppLaunchSmokeTest {
    @Rule
    public ActivityScenarioRule<MainActivity> activityRule = new ActivityScenarioRule<>(MainActivity.class);

    @Test
    public void appStartsAndRendersBundledWebView() throws InterruptedException {
        CountDownLatch pageRendered = new CountDownLatch(1);
        AtomicBoolean rootHasContent = new AtomicBoolean(false);

        activityRule.getScenario().onActivity(activity -> {
            assertNotNull("Capacitor bridge was not created", activity.getBridge());

            WebView webView = activity.getBridge().getWebView();
            assertNotNull("Capacitor WebView was not created", webView);

            pollForRenderedRoot(webView, rootHasContent, pageRendered, System.currentTimeMillis() + 30_000);
        });

        assertTrue("The bundled web app did not render #root within 30 seconds", pageRendered.await(35, TimeUnit.SECONDS));
        assertTrue("The bundled web app rendered an empty #root", rootHasContent.get());
    }

    @Test
    public void messageLineHeightMatchesDesktopCssPixels() throws InterruptedException, JSONException {
        // Run on a device with a non-default system font scale to exercise WebView text zoom.
        CountDownLatch pageRendered = new CountDownLatch(1);
        AtomicBoolean rootHasContent = new AtomicBoolean(false);
        activityRule.getScenario().onActivity(activity -> pollForRenderedRoot(
                activity.getBridge().getWebView(), rootHasContent, pageRendered, System.currentTimeMillis() + 30_000));
        assertTrue("Web app did not render", pageRendered.await(35, TimeUnit.SECONDS));
        assertTrue("Web app rendered an empty root", rootHasContent.get());

        CountDownLatch measured = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        activityRule.getScenario().onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(
                "(() => {"
                        + "const host = document.createElement('div');"
                        + "host.style.cssText = 'position:fixed;visibility:hidden;top:0;left:0;width:300px';"
                        + "const message = document.createElement('div');"
                        + "message.className = 'py-1.5';"
                        + "const paragraph = document.createElement('div');"
                        + "paragraph.className = 'leading-5.5';"
                        + "paragraph.textContent = 'Message line';"
                        + "message.append(paragraph);"
                        + "const composer = document.createElement('div');"
                        + "composer.className = 'py-4.25 leading-5.5';"
                        + "composer.textContent = 'Composer line';"
                        + "host.append(message, composer);"
                        + "document.body.append(host);"
                        + "try { return {line:paragraph.getBoundingClientRect().height,"
                        + "message:message.getBoundingClientRect().height,"
                        + "composer:composer.getBoundingClientRect().height}; }"
                        + "finally { host.remove(); }"
                        + "})()",
                value -> {
                    result.set(value);
                    measured.countDown();
                }));
        assertTrue("WebView did not return typography measurements", measured.await(5, TimeUnit.SECONDS));
        JSONObject sizes = new JSONObject(result.get());
        assertEquals("Line height must not inherit Android system text zoom", 22, sizes.getDouble("line"), 0.05);
        assertEquals("Single-line message height", 34, sizes.getDouble("message"), 0.05);
        assertEquals("Single-line composer height", 56, sizes.getDouble("composer"), 0.05);
    }

    private void pollForRenderedRoot(WebView webView, AtomicBoolean rootHasContent, CountDownLatch pageRendered, long deadline) {
        webView.evaluateJavascript(
                "Boolean(document.getElementById('root')?.childElementCount)",
                result -> {
                    if ("true".equals(result)) {
                        rootHasContent.set(true);
                        pageRendered.countDown();
                    } else if (System.currentTimeMillis() < deadline) {
                        webView.postDelayed(() -> pollForRenderedRoot(webView, rootHasContent, pageRendered, deadline), 250);
                    } else {
                        pageRendered.countDown();
                    }
                }
        );
    }
}
