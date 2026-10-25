import { MaximumIncrement, MaximumProcessId, MaximumWorkerId, Snowflake as SnowflakeLibrary } from "@sapphire/snowflake";
import { describe, expect, test } from "bun:test";

import { snowflake, WorkerID } from "./snowflake";

const epoch = Date.parse("2023-01-01T00:00:00.000Z");

describe("timestamp snowflake bounds", () => {
   test("includes every possible worker, process, and increment at the timestamp", () => {
      const timestamp = Date.parse("2026-10-21T12:34:56.789Z");
      const generator = new SnowflakeLibrary(epoch);
      const minimum = generator.generate({ timestamp, workerId: 0n, processId: 0n, increment: 0n });
      const maximum = generator.generate({ timestamp, workerId: MaximumWorkerId, processId: MaximumProcessId, increment: MaximumIncrement });

      expect(snowflake.getMinimum(timestamp)).toBe(minimum.toString());
      expect(snowflake.getMaximum(new Date(timestamp))).toBe(maximum.toString());
      expect(snowflake.getTimestamp(minimum.toString())).toBe(timestamp);
      expect(snowflake.getTimestamp(maximum.toString())).toBe(timestamp);
      expect(BigInt(snowflake.getMaximum(timestamp)) + 1n).toBe(BigInt(snowflake.getMinimum(timestamp + 1)));
      expect(BigInt(snowflake.getMinimum(timestamp)) - 1n).toBe(BigInt(snowflake.getMaximum(timestamp - 1)));
   });

   test("handles the epoch and PostgreSQL's maximum supported timestamp", () => {
      expect(snowflake.getMinimum(epoch)).toBe("0");
      expect(snowflake.getMaximum(epoch)).toBe("4194303");
      expect(snowflake.getMaximum(epoch + 2 ** 41 - 1)).toBe(((1n << 63n) - 1n).toString());
   });

   test("rejects timestamps that cannot be represented", () => {
      for (const timestamp of [epoch - 1, epoch + 0.5, NaN, Infinity, new Date("invalid"), epoch + 2 ** 41]) {
         expect(() => snowflake.getMinimum(timestamp)).toThrow(RangeError);
         expect(() => snowflake.getMaximum(timestamp)).toThrow(RangeError);
      }
   });

   test("contains a normally generated ID without advancing the generator for bounds", () => {
      const id = snowflake.generateString(WorkerID.TESTING);
      const timestamp = snowflake.getTimestamp(id);
      expect(BigInt(snowflake.getMinimum(timestamp))).toBeLessThanOrEqual(BigInt(id));
      expect(BigInt(snowflake.getMaximum(timestamp))).toBeGreaterThanOrEqual(BigInt(id));
   });
});
