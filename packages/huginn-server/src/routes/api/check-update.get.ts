import { router, s3 } from "#server";
import { AWS_BUCKET, AWS_VERSIONS_OBJECT_KEY } from "#setup";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { APICheckUpdateResult, HttpCode, VersionsObject } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import * as semver from "semver";

type TargetKind = "none" | "windows-latest" | "windows-nightly";

router.get(
   "/check-update/:target/:currentVersion",
   defineEventHandler(async event => {
      // windows-latest, windows-nightly
      const target = (event.context.params?.target ?? "none") as TargetKind;
      const currentVersion = event.context.params?.currentVersion ?? "";

      if (target === "none") {
         setResponseStatus(event, HttpCode.NO_CONTENT);
         return null;
      }

      const getCommand = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: AWS_VERSIONS_OBJECT_KEY });
      const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");

      const sortedVersions = Object.keys(versions).sort(semver.rcompare);

      const latest = sortedVersions.find(x => !semver.prerelease(x));
      const latestNightly = sortedVersions.find(x => semver.prerelease(x)?.[0]);

      if ((target === "windows-latest" && !latest) || (target === "windows-nightly" && !latestNightly)) {
         setResponseStatus(event, HttpCode.NO_CONTENT);
         return null;
      }

      if (
         (target === "windows-latest" && currentVersion === latest) ||
         (target === "windows-nightly" && currentVersion === latestNightly)
      ) {
         setResponseStatus(event, HttpCode.NO_CONTENT);
         return null;
      }

      if (target === "windows-latest" && latest) {
         const version = versions[latest];

         setResponseStatus(event, HttpCode.OK);
         return {
            version: latest,
            notes: version.description,
            pub_date: version.publishDate,
            signature: version.downloads.windows?.signature,
            url: version.downloads.windows?.url,
         } as APICheckUpdateResult;
      } else if (target === "windows-nightly" && latestNightly) {
         const version = versions[latestNightly];

         setResponseStatus(event, HttpCode.OK);
         return {
            version: latestNightly,
            notes: version.description,
            pub_date: version.publishDate,
            signature: version.downloads.windows?.signature,
            url: version.downloads.windows?.url,
         } as APICheckUpdateResult;
      }
   }),
);
