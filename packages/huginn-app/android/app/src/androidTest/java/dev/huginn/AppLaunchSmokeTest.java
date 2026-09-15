package dev.huginn;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.webkit.WebView;

import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

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
