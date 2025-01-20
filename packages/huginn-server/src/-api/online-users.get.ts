import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { gateway, router } from "#server";

router.get(
	"/online-users",
	defineEventHandler((event) => {
		setResponseStatus(event, HttpCode.OK);
		return { count: gateway.getSessionsCount() };
	}),
);
