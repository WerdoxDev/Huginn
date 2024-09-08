import { router } from "#server";
import { githubToken } from "#setup";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";

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

      const versions = (await response.json()) as { name: string; assets: { browser_download_url: string; name: string }[] }[];

      console.log(response);

      function getWindowsAssetUrl(version?: { assets: { browser_download_url: string; name: string }[] }) {
         return version?.assets.find(x => x.name.endsWith(".exe"))?.browser_download_url;
      }

      const latestRelease = versions.find(x => !x.name.includes("dev"));
      const latestDev = versions.find(x => x.name.includes("dev"));

      const releaseWindowsSetupUrl = getWindowsAssetUrl(latestRelease);
      const devWindowsSetupUrl = getWindowsAssetUrl(latestDev);

      setResponseStatus(event, HttpCode.OK);
      return {
         release: latestRelease ? { version: latestRelease.name, windowsSetupUrl: releaseWindowsSetupUrl } : undefined,
         dev: latestDev ? { version: latestDev.name, windowsSetupUrl: devWindowsSetupUrl } : undefined,
      };
   }),
);
