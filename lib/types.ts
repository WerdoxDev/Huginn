export type Snowflake = string;

export type RouteLike = `/${string}`;

export type WebSocketData = {
   id: Snowflake;
};

export type TokenPayload = {
   id: Snowflake;
};
