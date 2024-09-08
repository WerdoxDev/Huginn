export type Version = {
   patch?: number;
   minor: number;
   major: number;
};

export enum BuildType {
   RELEASE = "RELEASE",
   DEBUG = "DEBUG",
}

export type AppVersion = {
   type: BuildType;
   version: Version;
};

export type BuildFiles = {
   nsisZipFile: { path: string; name: string };
   nsisSigFile: { path: string; name: string };
   nsisSetupFile: { path: string; name: string };
};

export type UpdateFileInfo = {
   version: string;
   notes: string;
   pub_date: string;
   platforms: Record<string, { signature: string; url: string }>;
};
