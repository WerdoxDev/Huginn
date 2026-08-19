import * as semver from "semver";

export const ANDROID_MANIFEST_ASSET = "manifest.json";
export const ANDROID_NATIVE_CUT_ASSET = "android-native-cut.json";

type AndroidRelease = {
   tag_name: string;
   assets: Array<{ name: string }>;
};

function getVersion(release: AndroidRelease) {
   return release.tag_name.replace("app@", "");
}

export function getLatestCompatibleAndroidRelease<T extends AndroidRelease>(releases: T[], nativeVersion?: string) {
   const nativeCuts = releases
      .filter((release) => release.assets.some((asset) => asset.name === ANDROID_NATIVE_CUT_ASSET))
      .map(getVersion)
      .filter((version) => !nativeVersion || !semver.valid(nativeVersion) || semver.gt(version, nativeVersion))
      .toSorted(semver.compare);

   // A missing nativeVersion identifies an app released before this request field existed.
   // Serve the newest release below its earliest incompatible native cut.
   const [firstIncompatibleNativeCut] = nativeCuts;
   return releases.find((release) => {
      if (!release.assets.some((asset) => asset.name === ANDROID_MANIFEST_ASSET)) return false;
      if (!firstIncompatibleNativeCut) return true;
      return semver.lt(getVersion(release), firstIncompatibleNativeCut);
   });
}
