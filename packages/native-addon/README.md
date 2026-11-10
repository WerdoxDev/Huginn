# Native addon and Hyprland overlay

Build with `bun run --cwd packages/native-addon build`. Linux builds require a C/C++20 compiler, CMake, OpenSSL development files, pkg-config, Wayland client development files (1.20+), and `wayland-scanner`.

On Arch these come from `base-devel cmake openssl pkgconf wayland`. On Ubuntu install `build-essential cmake libssl-dev pkg-config libwayland-dev libwayland-bin`.

Linux builds produce both `build/Release/huginn_addon.node` and `build/Release/huginn-hyprland-overlay`. Rebuild the native package and Electron bundle when updating the overlay. Electron packaging unpacks the helper alongside the native binding, preserving executable permissions; the runtime dependency is `libwayland-client` (`wayland` on Arch).

## Overlay behavior

Huginn uses the same `/overlay` React page and voice-host connection on Windows and Hyprland. On Hyprland, Electron renders the page offscreen at up to 30 FPS and streams premultiplied BGRA bitmaps to the helper. The helper uses shared-memory Wayland buffers on an `overlay` layer named `huginn-overlay`, with an empty pointer input region and keyboard interactivity disabled. It does not require compositor configuration or inject code into games.

The Electron backend uses Hyprland's command and event sockets to follow the target window address, focus, closure, and output. Geometry is sampled every 100 ms because the event socket does not provide continuous resize/move notifications. Coordinates are output-local logical units; viewporter maps the bitmap to that size on scaled displays. Only the 400-logical-pixel strip containing the voice UI is rendered. The overlay hides when the target loses focus and exits when the target, host, renderer, helper, or compositor connection closes.

This backend requires Hyprland, layer-shell, viewporter, and named Wayland outputs. Bitmap copies are used initially; GPU texture sharing is not implemented. Frame queues are bounded and superseded paints are discarded when the helper falls behind. Desktop software outside the compositor, such as a nested Gamescope session, needs separate integration to identify its individual windows.

## Global shortcuts on Hyprland

The Electron app registers shortcuts automatically through Hyprland's runtime Lua API (tested on Hyprland 0.56.2). Users configure mute/deafen in Huginn; no additions to their Hyprland configuration are needed. Older Hyprland configurations without the Lua API are not supported by this shortcut backend.

Bindings exist only in the compositor's running configuration. Huginn listens for shortcut actions on the Hyprland event socket, restores bindings after a configuration reload, and disables them while the Keybinds settings page is open. Conflicting compositor shortcuts and a second Huginn instance are rejected instead of replacing existing bindings. Normal quit removes Huginn's bindings. If the app crashes, a compositor-side lease disables its orphaned bindings within 15 seconds; they are removed when Huginn next registers shortcuts or the compositor configuration reloads.

This backend uses only Hyprland's local IPC sockets, with no extra packages, keyboard-device permissions, or changes to user configuration files. Other platforms retain Electron's `globalShortcut` implementation. Regression tests are in `packages/huginn-app/electron/hyprland-keybinds.test.ts` and `keybinds-controller.test.ts`; the socket tests require local Unix socket access.

## Protocol sources

The XML files in `src/platform/linux/protocols` retain their upstream licenses:

- [wlr-layer-shell-unstable-v1](https://gitlab.freedesktop.org/wlroots/wlr-protocols/-/blob/master/unstable/wlr-layer-shell-unstable-v1.xml): its `namespace` argument is renamed `namespace_` to allow generated headers to compile as C++.
- [viewporter](https://gitlab.freedesktop.org/wayland/wayland-protocols/-/blob/main/stable/viewporter/viewporter.xml).
- [xdg-shell](https://gitlab.freedesktop.org/wayland/wayland-protocols/-/blob/main/stable/xdg-shell/xdg-shell.xml), referenced by layer-shell's popup request.

Generated protocol code stays in the build directory. Window tracking and frame transport tests are in `packages/huginn-app/electron/hyprland-*.test.ts`; the socket tests need permission to create local Unix sockets.
