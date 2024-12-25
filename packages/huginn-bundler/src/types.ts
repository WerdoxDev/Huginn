import type { Endpoints } from "@octokit/types";

export type PackageType = "app" | "api" | "server" | "cdn" | "bifrost" | "bundler" | "shared" | "backend-shared";

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
	localLatest?: string | null;
	nextPatch?: string | null;
	nextMinor?: string | null;
	nextMajor?: string | null;
};

export type GitHubRelease =
	| Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]
	| Endpoints["POST /repos/{owner}/{repo}/releases"]["response"];
