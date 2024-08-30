import { router, tokenInvalidator } from "@/server";
import { useVerifiedJwt } from "@/utils/route-utils";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";

router.post(
   "/auth/logout",
   defineEventHandler(async event => {
      const { token } = await useVerifiedJwt(event);

      tokenInvalidator.invalidate(token);

      setResponseStatus(event, HttpCode.NO_CONTENT);
      return null;
   }),
);
