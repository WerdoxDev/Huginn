import { HttpCode } from "@huginn/shared";
import { gateway } from "#setup";

export default defineEventHandler((event) => {
	setResponseStatus(event, HttpCode.OK);
	return { count: gateway.getSessionsCount() };
});
