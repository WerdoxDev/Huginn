import { Snowflake } from "@sapphire/snowflake";

const epoch = new Date("2023-01-01T00:00:00.000Z");

const globalSnowflake = new Snowflake(epoch);

export const snowflake = {
   generate() {
      const value = globalSnowflake.generate();
      return value.toString();
   },
};
