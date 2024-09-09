import { router } from "#server";
import { githubToken } from "#setup";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";

// Release: huginn-0.3.3
// Nightly: huginn-0.3.3-nightly-20240909
type ReleaseInfo = {
   release?: {
      version: string;
      date: string;
      windowsSetupUrl?: string;
   };
   nightly?: {
      version: string;
      date: string;
      windowsSetupUrl?: string;
   };
};

type GithubRelease = {
   name: string;
   assets: { browser_download_url: string; name: string }[];
   created_at: string;
};

router.get(
   "/releases",
   defineEventHandler(async event => {
      console.log(githubToken);
      const response = await fetch("https://api.github.com/repos/WerdoxDev/Huginn/releases", {
         headers: {
            Authorization: "Bearer " + githubToken,
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github+json",
         },
      });

      const versions = (await response.json()) as GithubRelease[];

      console.log(response);

      function getWindowsAssetUrl(release?: GithubRelease) {
         return release?.assets.find(x => x.name.endsWith(".exe"))?.browser_download_url;
      }

      const latestRelease = versions.find(x => !x.name.includes("nightly"));
      const latestNightly = versions.find(x => x.name.includes("nightly"));

      const releaseWindowsSetupUrl = getWindowsAssetUrl(latestRelease);
      const nightlyWindowsSetupUrl = getWindowsAssetUrl(latestNightly);

      const nameSplit = latestNightly?.name.split("-");
      const dateSplit = nameSplit?.[2] ?? "0000";

      console.log(dateSplit);

      const nightlyDate = new Date(
         parseInt(dateSplit?.substring(0, 4)),
         parseInt(dateSplit?.substring(4, 6)),
         parseInt(dateSplit?.substring(6, 8)),
      );

      const json: ReleaseInfo = {
         release: latestRelease
            ? {
                 version: latestRelease.name,
                 date: latestRelease.created_at,
                 windowsSetupUrl: releaseWindowsSetupUrl,
              }
            : undefined,
         nightly: latestNightly
            ? {
                 version: latestNightly.name,
                 windowsSetupUrl: nightlyWindowsSetupUrl,
                 date: nightlyDate.toISOString(),
              }
            : undefined,
      };

      setResponseStatus(event, HttpCode.OK);
      return json;
   }),
);
