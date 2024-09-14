export type Version = {
   patch?: number;
   minor: number;
   major: number;
};

export type BuildFlavour = "release" | "nightly";

export type AppVersion = {
   type: BuildFlavour;
   version: Version;
};

export type BuildFiles = {
   nsisSigFile: { path: string; name: string };
   nsisSetupFile: { path: string; name: string };
};

export type UpdateFileInfo = {
   version: string;
   notes: string;
   pub_date: string;
   platforms: Record<string, { signature: string; url: string }>;
};

export type CargoContent = {
   package: { version: string };
};

export type PackageContent = {
   version: string;
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
