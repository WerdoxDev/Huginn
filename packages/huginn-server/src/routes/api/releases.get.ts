import { router } from "#server";
import { githubToken } from "#setup";
import { request } from "#utils/server-request";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";

router.get(
   "/releases",
   defineEventHandler(async event => {
      const versions = (await (
         await fetch("https://api.github.com/repos/WerdoxDev/Huginn/releases", {
            headers: {
               Authentication: "Bearer " + githubToken,
               "X-GitHub-Api-Version": "2022-11-28",
               Accept: "application/vnd.github+json",
            },
         })
      ).json()) as { name: string; assets: { browser_download_url: string; name: string }[] }[];

      function getWindowsAssetUrl(version?: { assets: { browser_download_url: string; name: string }[] }) {
         return version?.assets.find(x => x.name.endsWith(".exe"))?.browser_download_url;
      }

      const latestRelease = versions.find(x => !x.name.includes("dev"));
      const latestDev = versions.find(x => x.name.includes("dev"));

      const releaseWindowsExeUrl = getWindowsAssetUrl(latestRelease);
      const devWindowsExeUrl = getWindowsAssetUrl(latestDev);

      setResponseStatus(event, HttpCode.OK);
      return {
         release: latestRelease ? { version: latestRelease.name, windowsExeUrl: releaseWindowsExeUrl } : undefined,
         dev: latestDev ? { version: latestDev.name, windowsExeUrl: devWindowsExeUrl } : undefined,
      };
   }),
);
