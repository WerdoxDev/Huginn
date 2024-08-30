import { router } from "@/cdn";
import { uploadsDir } from "@/index";
import { extractFileInfo, findImageByName, transformImage } from "@/utils/file-utils";
import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";
import path from "path";
import { z } from "zod";

const schema = z.object({ avatarHash: z.string() });

router.get(
   "/avatars/:userId/:avatarHash",
   defineEventHandler(async event => {
      const avatashHash = (await useValidatedParams(event, schema)).avatarHash;
      const { name, format, mimeType } = extractFileInfo(avatashHash);

      // Best scenario, file already exists and ready to serve
      const file = Bun.file(path.resolve(uploadsDir, `avatars/${name}.${format}`));

      if (await file.exists()) {
         console.log(await file.arrayBuffer());
         setResponseStatus(event, HttpCode.OK);
         setResponseHeader(event, "Content-Type", mimeType);
         return file.stream();
      }

      // File doesn't exist so we have to see if another format exists
      const { file: otherFile } = await findImageByName("avatars", name);

      const result = await transformImage(otherFile, format, 100);
      await Bun.write(path.resolve(uploadsDir, `avatars/${avatashHash}`), result);

      setResponseStatus(event, HttpCode.OK);
      setResponseHeader(event, "Content-Type", mimeType);
      return result;
   }),
);
