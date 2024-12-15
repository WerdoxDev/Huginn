import type { APIGetUserRelationshipByIdResult, APIGetUserRelationshipsResult, APIPostRelationshipJSONBody } from "@huginn/shared";
import { Routes } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import type { REST } from "../rest";

export class RelationshipAPI {
	private readonly rest: REST;

	public constructor(rest: REST) {
		this.rest = rest;
	}

	public async get(userId: Snowflake): Promise<APIGetUserRelationshipByIdResult> {
		return this.rest.get(Routes.userRelationship(userId), { auth: true }) as Promise<APIGetUserRelationshipByIdResult>;
	}

	public async getAll(): Promise<APIGetUserRelationshipsResult> {
		return this.rest.get(Routes.userRelationships(), { auth: true }) as Promise<APIGetUserRelationshipsResult>;
	}

	public async createRelationship(body: APIPostRelationshipJSONBody): Promise<unknown> {
		return this.rest.post(Routes.userRelationships(), { body, auth: true });
	}

	public async createRelationshipByUserId(userId: Snowflake): Promise<unknown> {
		return this.rest.put(Routes.userRelationship(userId), { auth: true });
	}

	public async remove(userId: Snowflake): Promise<unknown> {
		return this.rest.delete(Routes.userRelationship(userId), { auth: true });
	}
}
