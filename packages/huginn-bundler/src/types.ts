export type BuildFlavour = "release" | "nightly";

export type BuildFiles = {
   nsisSigFile: { path: string; name: string };
   nsisSetupFile: { path: string; name: string };
};

export type CargoContent = {
   package: { version: string };
};

export type Suggestions = {
   latest?: string | null;
   latestNightly?: string | null;
   localLatest?: string | null;
   localLatestNightly?: string | null;
   nextPatch?: string | null;
   nextMinor?: string | null;
   nextMajor?: string | null;
   nextNightly?: string | null;
};
