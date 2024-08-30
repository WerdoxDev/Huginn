import { router } from "@/server";
import { APIPostUniqueUsernameResult, HttpCode } from "@huginn/shared";
import { useValidatedBody } from "@utils/route-utils";
import { validateUsernameUnique } from "@utils/validation";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ username: z.string() });

router.post(
   "/unique-username",
   defineEventHandler(async event => {
      const body = await useValidatedBody(event, schema);

      const isUnique = await validateUsernameUnique(body.username.toLowerCase());
      const json: APIPostUniqueUsernameResult = { taken: !isUnique };

      setResponseStatus(event, HttpCode.OK);
      return json;
   }),
);
