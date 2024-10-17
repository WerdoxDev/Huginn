import type { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@huginn/shared";
import { Routes } from "@huginn/shared";
import type { REST } from "../rest/rest.ts";

export class CommonAPI {
	private readonly rest: REST;

	public constructor(rest: REST) {
		this.rest = rest;
	}

	public async uniqueUsername(body: APIPostUniqueUsernameJSONBody): Promise<APIPostUniqueUsernameResult> {
		return this.rest.post(Routes.uniqueUsername(), { body }) as Promise<APIPostUniqueUsernameResult>;
	}
}
