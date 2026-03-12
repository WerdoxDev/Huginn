import { octokit } from "#setup";
import { envs } from "#setup";
import { getAllTags } from "#utils/route-utils";
import Elysia, { t } from "elysia";
import * as semver from "semver";

const paramSchema = t.Object({
   target: t.Union([t.Literal("none"), t.Literal("win")]),
   file: t.String(),
});

export const getUpdate = new Elysia().get(
   "/api/update/:target/:file",
   async ({ status, params: { file, target }, redirect, set }) => {
      if (target === "none") {
         return status("No Content");
      }

      const tags = await getAllTags();

      if (file !== "latest.yml") {
         const version = file.match(/_([\d.]+)_/)?.[1];
         const tag = `app@v${version}`;
         const release = await octokit.rest.repos.getReleaseByTag({
            owner: envs.REPO_OWNER,
            repo: envs.REPO,
            tag,
         });

         const asset = release.data.assets.find((x) => x.name === file);
         return redirect(asset?.browser_download_url ?? "");
      }

      const [latestTag] = tags
         .filter((x) => x.name.startsWith("app@v"))
         .toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

      const latestVersion = latestTag.name.replace("app@v", "");
      const latestRelease = await octokit.rest.repos.getReleaseByTag({
         owner: envs.REPO_OWNER,
         repo: envs.REPO,
         tag: latestTag.name,
      });

      const latestInfo = await (
         await fetch(latestRelease.data.assets.find((x) => x.name === "latest.yml")?.browser_download_url ?? "")
      ).arrayBuffer();

      // We don't have a version
      if (!latestVersion) {
         return status("No Content");
      }

      // Send newest version
      if (target === "win" && latestVersion) {
         set.headers = { "content-type": "text/yaml" };
         return status("OK", latestInfo);
      }
   },
   {
      params: paramSchema,
   },
);
