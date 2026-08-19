import { describe, expect, test } from "bun:test";

import { ANDROID_MANIFEST_ASSET, ANDROID_NATIVE_CUT_ASSET, getLatestCompatibleAndroidRelease } from "./android-update";

function release(version: string, nativeCut = false) {
   return {
      tag_name: `app@v${version}`,
      assets: [{ name: ANDROID_MANIFEST_ASSET }, ...(nativeCut ? [{ name: ANDROID_NATIVE_CUT_ASSET }] : [])],
   };
}

const releases = [release("3.1.0"), release("3.0.0", true), release("2.5.0"), release("2.0.0", true), release("1.5.0")];

describe("getLatestCompatibleAndroidRelease", () => {
   test("returns the latest release when there is no newer native cut", () => {
      expect(getLatestCompatibleAndroidRelease(releases, "3.0.0")?.tag_name).toBe("app@v3.1.0");
   });

   test("stops at the first native cut newer than the installed APK", () => {
      expect(getLatestCompatibleAndroidRelease(releases, "2.0.0")?.tag_name).toBe("app@v2.5.0");
      expect(getLatestCompatibleAndroidRelease(releases, "1.0.0")?.tag_name).toBe("app@v1.5.0");
   });

   test("treats clients without a native version as older than every recorded cut", () => {
      expect(getLatestCompatibleAndroidRelease(releases)?.tag_name).toBe("app@v1.5.0");
   });
});
