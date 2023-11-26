export interface HuginnErrorFieldInformation {
   code: string;
   message: string;
}

export interface HuginnErrorGroupWrapper {
   _errors: HuginnErrorFieldInformation[];
}

export type HuginnError = { [k: string]: HuginnErrorGroupWrapper };

export interface HuginnErrorData {
   code: number;
   errors?: HuginnError;
   message: string;
}

export interface RequestBody {
   //files: RawFile[] | undefined;
   json: unknown | undefined;
}

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
   UNKNOWN_ACCOUNT = 10001,
   UNKNOWN_MESSAGE = 10002,
   UNKNOWN_MEMBER = 10003,
   INVALID_FORM_BODY = 20001,
}

export enum FieldCode {
   INVALID_LOGIN = "INVALID_LOGIN",
   TOO_SHORT = "BASE_TYPE_TOO_SHORT",
   USERNAME_TAKEN = "USERNAME_TAKEN",
   EMAIL_IN_USE = "EMAIL_IN_USE",
   EMAIL_INVALID = "EMAIL_INVALID",
}

export const Field = {
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
};

export const Error = {
   invalidFormBody(): [string, JsonCode] {
      return ["Invalid Form Body", JsonCode.INVALID_FORM_BODY];
   },
};
