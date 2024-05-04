export type HuginnErrorFieldInformation = {
   code: string;
   message: string;
};

export type HuginnErrorGroupWrapper = {
   _errors: HuginnErrorFieldInformation[];
};

export type HuginnError = { [k: string]: HuginnErrorGroupWrapper };

export type HuginnErrorData = {
   code: number;
   errors?: HuginnError;
   message: string;
};

export type RequestBody = {
   //files: RawFile[] | undefined;
   json: unknown | undefined;
};

export function isErrorResponse(error: unknown): error is HuginnErrorFieldInformation {
   return typeof Reflect.get(error as Record<string, unknown>, "message") === "string";
}

export function isErrorGroupWrapper(error: unknown): error is HuginnErrorGroupWrapper {
   return Reflect.has(error as Record<string, unknown>, "_errors");
}

export enum HttpCode {
   OK = 200,
   CREATED = 201,
   NO_CONTENT = 204,
   NOT_MODIFIED = 304,
   BAD_REQUEST = 400,
   UNAUTHORIZED = 401,
   FORBIDDEN = 403,
   NOT_FOUND = 404,
   METHOD_NOT_ALLOWED = 405,
   TOO_MANY_REQUESTS = 429,
   GATEWAY_UNAVAILABLE = 502,
   SERVER_ERROR = 500,
}

export enum JsonCode {
   NONE = 0,
   UNKNOWN_ACCOUNT = 10001,
   UNKNOWN_MESSAGE = 10002,
   UNKNOWN_MEMBER = 10003,
   UNKNOWN_USER = 10004,
   UNKNOWN_CHANNEL = 10005,
   UNKNOWN_RELATIONSHIP = 10006,
   INVALID_FORM_BODY = 20001,
   USERNAME_NOT_FOUND = 30001,
   RELATION_SELF_REQUEST = 30002,
   RELATION_EXISTS = 30003,
}

export enum GatewayCode {
   UNKNOWN = 4000,
   AUTHENTICATION_FAILED = 4004,
   SESSION_TIMEOUT = 4009,
   INVALID_INTENTS = 4013,
}

export enum FieldCode {
   REQUIRED = "REQUIRED",
   INVALID_LOGIN = "INVALID_LOGIN",
   TOO_SHORT = "BASE_TYPE_TOO_SHORT",
   USERNAME_TAKEN = "USERNAME_TAKEN",
   EMAIL_IN_USE = "EMAIL_IN_USE",
   EMAIL_INVALID = "EMAIL_INVALID",
   PASSWORD_INCORRECT = "PASSWORD_INCORRECT",
   INVALID_USER_ID = "INVALID_USER_ID",
   INVALID_CHANNEL_ID = "INVALID_CHANNEL_ID",
}

export const Field = {
   required(): [string, string] {
      return ["This field is required", FieldCode.REQUIRED];
   },
   invalidLogin(): [string, string] {
      return ["Login or password is invalid", FieldCode.INVALID_LOGIN];
   },
   wrongLength(min?: number, max?: number): [string, string] {
      let text = "";
      if (max && min) text = `This should be between ${min}-${max} characters`;
      else if (min) text = text = `This must be atleast ${min} characters long`;
      else if (max) text = `This must be at most ${max} characters long`;
      else text = "This is invalid";
      return [text, FieldCode.TOO_SHORT];
   },
   emailInvalid(): [string, string] {
      return ["Email is invalid", FieldCode.EMAIL_INVALID];
   },
   emailInUse(): [string, string] {
      return ["Email is already registered", FieldCode.EMAIL_IN_USE];
   },
   usernameTaken(): [string, string] {
      return ["Username is already taken", FieldCode.USERNAME_TAKEN];
   },
   passwordIncorrect(): [string, string] {
      return ["Password is incorrect", FieldCode.PASSWORD_INCORRECT];
   },
   invalidUserId(): [string, string] {
      return ["User id is invalid", FieldCode.INVALID_USER_ID];
   },
   invalidChannelId(): [string, string] {
      return ["Channel id is invalid", FieldCode.INVALID_CHANNEL_ID];
   },
};

export const Error = {
   unauthorized(): [string, JsonCode] {
      return ["Unauthorized", JsonCode.NONE];
   },
   serverError(): [string, JsonCode] {
      return ["Server Error", JsonCode.NONE];
   },
   fileNotFound(): [string, JsonCode] {
      return ["File Not Found", JsonCode.NONE];
   },
   malformedBody(): [string, JsonCode] {
      return ["Malformed Body", JsonCode.NONE];
   },
   websocketFail(): [string, JsonCode] {
      return ["Websocket Upgrade Failed", JsonCode.NONE];
   },
   invalidFormBody(): [string, JsonCode] {
      return ["Invalid Form Body", JsonCode.INVALID_FORM_BODY];
   },
   unknownUser(): [string, JsonCode] {
      return ["Unknown User", JsonCode.UNKNOWN_USER];
   },
   unknownChannel(): [string, JsonCode] {
      return ["Unknown Channel", JsonCode.UNKNOWN_CHANNEL];
   },
   unknownMessage(): [string, JsonCode] {
      return ["Unknown Message", JsonCode.UNKNOWN_MESSAGE];
   },
   unknownRelationship(): [string, JsonCode] {
      return ["Unknown Relationship", JsonCode.UNKNOWN_RELATIONSHIP];
   },
   noUserWithUsername(): [string, JsonCode] {
      return ["No user with specified username was found", JsonCode.USERNAME_NOT_FOUND];
   },
   relationshipSelfRequest(): [string, JsonCode] {
      return ["Cannot send friend request to self", JsonCode.RELATION_SELF_REQUEST];
   },
   relationshipExists(): [string, JsonCode] {
      return ["You are already friends with this user", JsonCode.RELATION_EXISTS];
   },
};
