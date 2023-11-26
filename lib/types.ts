export type Snowflake = string;

export type RouteLike = `/${string}`;

export interface WebSocketData {
   id: Snowflake;
}

export interface TokenPayload {
   id: Snowflake;
}
