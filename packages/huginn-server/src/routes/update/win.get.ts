import Elysia, { t } from "elysia";
import * as semver from "semver";

import { octokit } from "#setup";
import { env } from "#setup";
import { getAllTags, getReleaseByTag } from "#utils/route-utils";

export const getWinUpdate = new Elysia().get(
   "/api/update/win/:file",
   async ({ status, params: { file }, redirect, set }) => {
      const tags = await getAllTags();

      // Non-manifest request: extract version from filename and redirect to asset
      if (file !== "latest.yml") {
         const version = file.match(/_([\d.]+)_/)?.[1];
         const tag = `app@v${version}`;
         const release = await getReleaseByTag(tag);

         const asset = release.assets.find((x) => x.name === file);
         return redirect(asset?.browser_download_url ?? "");
      }

      // Manifest request: return the latest.yml for the newest release
      const [latestTag] = tags
         .filter((x) => x.name.startsWith("app@v"))
         .toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

      const latestVersion = latestTag?.name.replace("app@v", "");

      if (!latestVersion) {
         return status("No Content");
      }

      const latestRelease = await octokit.rest.repos.getReleaseByTag({
         owner: env.REPO_OWNER,
         repo: env.REPO,
         tag: latestTag.name,
      });

      const latestYmlUrl = latestRelease.data.assets.find((x) => x.name === "latest.yml")?.browser_download_url;

      const latestInfo = await (await fetch(latestYmlUrl ?? "")).arrayBuffer();

      set.headers = { "content-type": "text/yaml" };
      return status("OK", latestInfo);
   },
   {
      params: t.Object({ file: t.String() }),
   },
);
