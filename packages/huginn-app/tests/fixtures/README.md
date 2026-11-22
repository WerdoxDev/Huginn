# Media viewer validation

The media viewer smoke fixture renders message attachments and an expression with the real viewer, modal store, portal lifecycle, sliders, and video player. Its media is local, so the checks need no live Huginn instance. The application startup check uses the built app on port 4173; viewer checks use the fixture through Vite on port 4174. Both are selected explicitly in `playwright.config.ts`.

Run from `packages/huginn-app`:

```sh
pnpm exec vitest run src/components/message/MediaViewer.test.tsx src/components/VideoPlayer.test.tsx
pnpm run typecheck
pnpm run smoke:web
```

The integrated Vitest cases cover playback, mouse mapping and click suppression, touch transitions, control isolation, fullscreen bypass, and native Back handler ordering. The browser checks cover actual wheel and touch delivery, rendered zoom and pan bounds, fixed and hidden controls, seek and volume input, native fullscreen, restored framing, and viewport changes. Fullscreen viewport resizing uses Chromium device metrics because Chromium forbids resizing its fullscreen native window through Playwright's window API.

## Runtime results

On 22 November 2026, all 521 app Vitest tests and the six Chromium media viewer smoke checks passed, and app typechecking passed. Both review axes, Standards and Spec, had no remaining findings after corrections.

A production-built fixture mounted into the installed Android app on a Xiaomi 21081111RG with Android System WebView 157.0.8103.50 entered native fullscreen with playback still paused at 7 seconds and volume at zero. The native Back attempt navigated the host WebView and interrupted the check. This injected fixture does not establish fullscreen exit continuity or Back ordering in a clean Capacitor build. Repeat both checks in an installed build containing these changes. The app page and original media volume were restored after the probe.

Electron fullscreen behavior and production Capacitor performance remain unverified. Device profiling must still cover cold and warm opening, large media, zoom and pan, rotation, and concurrent message updates, recording frame timing, long tasks, layout and paint work, and tap response. Desktop Chromium and jsdom results do not establish Android smoothness.

## Fixture media

`viewer.png` and `viewer.webm` are generated test patterns with no external content. Regenerate them with FFmpeg:

```sh
ffmpeg -f lavfi -i testsrc2=size=640x360:rate=1 -frames:v 1 -y viewer.png
ffmpeg -f lavfi -i testsrc2=size=640x360:rate=10 -t 30 -an -c:v libvpx -b:v 60k -y viewer.webm
```
