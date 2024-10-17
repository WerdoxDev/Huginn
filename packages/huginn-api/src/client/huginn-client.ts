import type { APIPostLoginResult, APIPostRegisterResult, APIUser, LoginCredentials, RegisterUser, Tokens } from "@huginn/shared";
import { type Snowflake, WorkerID, snowflake } from "@huginn/shared";
import { AuthAPI } from "../apis/auth.ts";
import { ChannelAPI } from "../apis/channel.ts";
import { CommonAPI } from "../apis/common.ts";
import { RelationshipAPI } from "../apis/relationship.ts";
import { UserAPI } from "../apis/user.ts";
import { Gateway } from "../gateway/client-gateway.ts";
import { CDN } from "../rest/cdn.ts";
import { REST } from "../rest/rest.ts";
import { TokenHandler } from "../rest/token-handler.ts";
import { type ClientOptions, ClientReadyState } from "../types.ts";
import { createDefaultClientOptions } from "../utils.ts";

export class HuginnClient {
	public readonly options: ClientOptions;
	private rest: REST;
	public cdn: CDN;
	public tokenHandler: TokenHandler;
	public users: UserAPI;
	public relationships: RelationshipAPI;
	public auth: AuthAPI;
	public channels: ChannelAPI;
	public common: CommonAPI;
	public gateway: Gateway;

	public user?: APIUser;

	public readyState: ClientReadyState = ClientReadyState.NONE;

	constructor(options?: Partial<ClientOptions>) {
		const defaultOptions = createDefaultClientOptions();

		this.options = {
			...defaultOptions,
			...options,
		};

		this.tokenHandler = new TokenHandler(this);
		this.rest = new REST(this, this.options.rest);
		this.cdn = new CDN(this.options.rest?.cdn);

		this.auth = new AuthAPI(this.rest);
		this.users = new UserAPI(this.rest);
		this.channels = new ChannelAPI(this.rest);
		this.relationships = new RelationshipAPI(this.rest);
		this.common = new CommonAPI(this.rest);
		this.gateway = new Gateway(this, this.options.gateway);
	}

	async initializeWithToken(tokens: Partial<Tokens>): Promise<void> {
		try {
			this.readyState = ClientReadyState.INITIALIZING;
			if (tokens.token) {
				this.tokenHandler.token = tokens.token;
			} else if (tokens.refreshToken) {
				const newTokens = await this.auth.refreshToken({ refreshToken: tokens.refreshToken });
				this.tokenHandler.refreshToken = newTokens.refreshToken;
				this.tokenHandler.token = newTokens.token;
			}
		} catch (e) {
			this.user = undefined;
			this.tokenHandler.token = undefined;
			this.tokenHandler.refreshToken = undefined;

			this.readyState = ClientReadyState.NONE;

			throw e;
		}
	}

	public async login(credentials: LoginCredentials): Promise<APIPostLoginResult> {
		try {
			this.readyState = ClientReadyState.INITIALIZING;
			const result = await this.auth.login(credentials);

			this.tokenHandler.token = result.token;
			this.tokenHandler.refreshToken = result.refreshToken;

			return result;
		} catch (e) {
			this.readyState = ClientReadyState.NONE;
			throw e;
		}
	}

	public async register(user: RegisterUser): Promise<APIPostRegisterResult> {
		try {
			this.readyState = ClientReadyState.INITIALIZING;
			const result = await this.auth.register(user);

			this.tokenHandler.token = result.token;
			this.tokenHandler.refreshToken = result.refreshToken;

			return result;
		} catch (e) {
			this.readyState = ClientReadyState.NONE;
			throw e;
		}
	}

	public async logout(): Promise<void> {
		await this.auth.logout();

		this.tokenHandler.token = undefined;
		this.user = undefined;
		this.gateway.close();

		this.readyState = ClientReadyState.NONE;
	}

	public get isLoggedIn(): boolean {
		return this.readyState === ClientReadyState.READY;
	}

	public generateNonce(): Snowflake {
		const nonce = snowflake.generateString(WorkerID.API);
		return nonce;
	}
}
