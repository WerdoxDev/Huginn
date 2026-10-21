import { Snowflake as SnowflakeLibrary } from "@sapphire/snowflake";

export type Snowflake = string;

const epoch = new Date("2023-01-01T00:00:00.000Z");

const globalSnowflake = new SnowflakeLibrary(epoch);

function minimumAtTimestamp(timestamp: number | Date): bigint {
   const milliseconds = timestamp instanceof Date ? timestamp.getTime() : timestamp;
   if (!Number.isSafeInteger(milliseconds) || milliseconds < epoch.getTime() || milliseconds - epoch.getTime() >= 2 ** 41) {
      throw new RangeError("Timestamp must be a whole millisecond within the supported snowflake range");
   }

   return BigInt(milliseconds - epoch.getTime()) << 22n;
}

export const snowflake = {
   generateString(workerId: WorkerID): string {
      const value = globalSnowflake.generate({ workerId: BigInt(workerId) });
      return value.toString();
   },
   generate(workerId: WorkerID): bigint {
      const value = globalSnowflake.generate({ workerId: BigInt(workerId) });
      return value;
   },
   getTimestamp(id: Snowflake): number {
      return Number(globalSnowflake.deconstruct(id).timestamp);
   },
   /** The earliest possible ID at this millisecond, for an exclusive before bound. */
   getMinimum(timestamp: number | Date): Snowflake {
      return minimumAtTimestamp(timestamp).toString();
   },
   /** The latest possible ID at this millisecond, for an exclusive after bound. */
   getMaximum(timestamp: number | Date): Snowflake {
      return (minimumAtTimestamp(timestamp) | ((1n << 22n) - 1n)).toString();
   },
};

export const WorkerID = {
   AUTH: 0,
   CHANNEL: 1,
   MESSAGE: 2,
   RELATIONSHIP: 3,
   GATEWAY: 4,
   API: 5,
   APP: 6,
   IDENTITY_PROVIDER: 7,
   TESTING: 8,
   EMBED: 9,
   THUMBNAIL: 10,
   ATTACHMENT: 11,
   CALL: 12,
   VOICE: 13,
   MESSAGE_REFERENCE: 14,
   EMAIL_VERIFICATION: 15,
   VIDEO: 16,
   PASSWORD_RESET: 17,
} as const;

export type WorkerID = (typeof WorkerID)[keyof typeof WorkerID];
