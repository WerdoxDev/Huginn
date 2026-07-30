import type { Snowflake } from "@huginnjs/shared";

export type DateDirectory = {
   name: string;
   subDirectories: string[];
};

export type ClientFile = {
   directory: string;
   clientId: string;
   numOfFiles: number;
};

export type ClientFileWithUser = ClientFile & {
   username?: string;
   isLoading?: boolean;
   error?: string;
};
