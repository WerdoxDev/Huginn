# Isolated Android testing on Linux

Researched 2026-11-22. Advisory only; no emulator was provisioned or launched for this research.

## Recommended approach

Use Gradle Managed Devices (called **build-managed devices** in current Android documentation) for Huginn's existing Android instrumentation smoke tests. Use a separate ephemeral emulator wrapper for exploratory `adb` sessions or tools that need a continuously running device. This is a recommendation based on the documented lifecycle ownership below and the existing Capacitor/Gradle instrumentation setup reported during repository inspection.

## Managed instrumentation

The Android Gradle plugin creates, deploys, and tears down configured devices for instrumented tests; it uses snapshots to restore a clean state. Devices are declared in the Android module's Gradle configuration, support API 27+, and run with `./gradlew <deviceName><Variant>AndroidTest`. Groups and sharding are available but increase resource demands. This fits an existing `AndroidJUnitRunner` suite; adopting it means defining a device and changing the smoke command from the connected-device task to the managed-device task. It does not turn arbitrary shell commands into managed instrumentation. [Android managed devices](https://developer.android.com/studio/test/managed-devices)

Choose a regular system image first for WebView/UI and permission behavior. Android's Automated Test Device images disable hardware rendering and remove components including SystemUI, Settings, and several apps; screenshots relying on hardware rendering are unsupported. The managed-device guide still suggests `swiftshader_indirect` for rendering-less servers, while the current acceleration guide marks that mode deprecated since Emulator 36.4.9. Validate graphics settings against the installed emulator instead of copying that flag blindly. [Managed devices and ATDs](https://developer.android.com/studio/test/managed-devices), [current rendering modes](https://developer.android.com/studio/run/emulator-acceleration)

## Host prerequisite

Linux acceleration uses KVM and requires suitable user permissions; AMD hosts need AMD-V. Confirm actual availability using `~/Android/Sdk/emulator/emulator -accel-check`. CPU virtualization flags alone do not establish KVM availability. The inspected environment reports `/dev/kvm` missing; resolve firmware/module/device access on the actual host before implementing a routine. Current command-line documentation describes acceleration-off software emulation as unsupported and very slow, requiring explicit opt-in. [Linux acceleration](https://developer.android.com/studio/run/emulator-acceleration), [acceleration options](https://developer.android.com/studio/run/emulator-commandline)

## Ephemeral exploratory device

Allocate a temporary run directory and create a dedicated AVD there, or copy a stopped, dedicated template including its AVD metadata and writable images. Share the SDK system image; keep writable images and any SD-card image inside the run directory. `ANDROID_AVD_HOME` controls AVD lookup, `ANDROID_USER_HOME` controls SDK-tool preferences, and `-datadir` redirects writable image storage. A copied AVD may contain paths pointing back to its source: validate or regenerate metadata rather than assuming a directory copy is isolated. [Android environment variables](https://developer.android.com/tools/variables), [AVD data directories](https://developer.android.com/studio/run/emulator-commandline)

For headless operation use `-no-window`; `-no-audio` disables audio. `-no-snapshot` disables Quick Boot loading and saving, **not persistent user-data writes**. `-wipe-data` resets installed apps/settings but leaves `sdcard.img` intact. These flags are therefore insufficient isolation when pointed at a personal AVD. Use a disposable directory, then remove it after stopping the owned process. Prefer a free even console port and its adjacent ADB port. [Emulator command line](https://developer.android.com/studio/run/emulator-commandline)

`-read-only` provides another supported option: the emulator uses copies of writable QCOW2 parts and discards guest-disk changes on exit, allowing concurrent instances of one AVD. It starts from the template's existing state, not necessarily factory defaults. Treat it as disposable guest-disk state, not a security sandbox or a promise that no host metadata is written. [Emulator read-only instances](https://developer.android.com/studio/releases/emulator)

Snapshots include apps, user data, settings, and running state. They depend on the system image, emulator version, and AVD configuration; updates or configuration changes can invalidate them. Keep any cached template/version combination deliberate. [Snapshot behavior and requirements](https://developer.android.com/studio/run/emulator-snapshots)

## Targeting, networking, and cleanup

Pass `adb -s <ownedSerial>` on every device operation; `-s` overrides `ANDROID_SERIAL`. A separate server can use `-P <port>` or `-L <socket>`; consistently address that same server for startup, commands, and shutdown. A private server is optional extra lifecycle separation and does not itself restrict commands to one device. `--one-device` is specifically a USB restriction. Never issue unqualified `adb kill-server`, global disconnect, or broad process kills as cleanup on a shared development machine. [ADB manual](https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/docs/user/adb.1.md)

From the emulator, `10.0.2.2` reaches the host loopback interface; emulator `localhost` means the guest. This allows a dedicated local test instance without exposing its service on every host interface. [Android Emulator network address space](https://developer.android.com/studio/run/emulator-networking-address)

Engineering recommendations for the wrapper: record the exact child PID and serial; set bounded boot/test timeouts; wait for Android boot completion as well as ADB transport; capture logs before teardown; use an idempotent `EXIT`/`INT`/`TERM` cleanup trap; stop and wait for only the owned emulator; preserve the test exit code; then remove only its validated run directory. A shell trap cannot handle `SIGKILL`, host crashes, or power loss. Add a timeout supervisor and a startup stale-run sweep using ownership records and process identity checks. Persistent SDK/system-image downloads and optional template caches remain even when each test device is disposable. These are implementation recommendations, not guarantees supplied by Android.
