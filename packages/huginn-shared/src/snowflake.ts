import { Snowflake as SnowflakeLibrary } from "@sapphire/snowflake";

export type Snowflake = string;

const epoch = new Date("2023-01-01T00:00:00.000Z");

const globalSnowflake = new SnowflakeLibrary(epoch);

export const snowflake = {
	generateString(workerId: WorkerID): string {
		const value = globalSnowflake.generate({ workerId: BigInt(workerId) });
		return value.toString();
	},
	generate(workerId: WorkerID): bigint {
		const value = globalSnowflake.generate({ workerId: BigInt(workerId) });
		return value;
	},
};

export enum WorkerID {
	AUTH = 0,
	CHANNEL = 1,
	MESSAGE = 2,
	RELATIONSHIP = 3,
	GATEWAY = 4,
	API = 5,
	APP = 6,
	IDENTITY_PROVIDER = 7,
	TESTING = 8,
}
