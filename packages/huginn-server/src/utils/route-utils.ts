import { type ErrorFactory, createErrorFactory, unauthorized } from "@huginn/backend-shared";
import { Errors, HttpCode, type IdentityTokenPayload, type TokenPayload, type Unpacked } from "@huginn/shared";
import type { Endpoints } from "@octokit/types";
import { type H3Event, getHeader, setResponseStatus } from "h3";
import * as semver from "semver";
import { type DBError, DBErrorType, prisma } from "#database";
import { octokit } from "#server";
import { envs } from "#setup";
import { verifyToken } from "./token-factory";

export async function useVerifiedJwt<IdentityToken extends boolean = false>(event: H3Event, identity?: IdentityToken) {
	const bearer = getHeader(event, "Authorization");

	if (!bearer) {
		throw unauthorized(event);
	}

	const token = bearer.split(" ")[1];

	const { valid, payload } = await verifyToken(token);

	if (!valid || !payload) {
		throw unauthorized(event);
	}

	if (!identity && !(await prisma.user.exists({ id: BigInt((payload as TokenPayload).id) }))) {
		throw unauthorized(event);
	}

	// if (identity && !(await prisma.identityProvider.exists({ id: BigInt((payload as IdentityTokenPayload).providerId) }))) {
	// 	throw unauthorized(event);
	// }

	return { payload: payload as IdentityToken extends true ? IdentityTokenPayload : TokenPayload, token };
}

export function handleCommonDBErrors(event: H3Event, error: DBError) {
	let errorFactory: ErrorFactory | undefined;

	if (error.isErrorType(DBErrorType.INVALID_ID)) {
		setResponseStatus(event, HttpCode.BAD_REQUEST);
		errorFactory = createErrorFactory(Errors.invalidId(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_USER)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownUser(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownRelationship(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_CHANNEL)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownChannel(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_MESSAGE)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownMessage(error.cause));
	}

	return errorFactory;
}

export function getWindowsAssetUrl(release?: Unpacked<Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"]>) {
	return release?.assets.find((x) => x.name.endsWith("setup.exe"))?.browser_download_url;
}

export function getAppPackageVersion(tagName: string) {
	return tagName.replace("huginn/app-", "");
}

export async function getAllAppReleases() {
	const releases = (await octokit.rest.repos.listReleases({ owner: envs.REPO_OWNER, repo: envs.REPO })).data
		.filter((x) => x.tag_name.includes("huginn/app"))
		.sort((v1, v2) => semver.rcompare(getAppPackageVersion(v1.tag_name), getAppPackageVersion(v2.tag_name)));
	return releases;
}
