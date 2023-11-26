import { APIPostLoginJSONBody, APIPostRegisterJSONBody } from "./api-types";
import { RESTOptions } from "./rest-types";

export interface ClientOptions {
   // TODO: Actually implement intents
   intents: unknown;
   rest?: RESTOptions;
}

export type LoginCredentials = APIPostLoginJSONBody;
export type RegisterUser = APIPostRegisterJSONBody;
