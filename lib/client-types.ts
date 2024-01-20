import { APIDMChannel, APIGroupDMChannel, APIPostLoginJSONBody, APIPostRegisterJSONBody } from "./api-types";
import { GatewayOptions } from "./gateway-types";
import { RESTOptions } from "./rest-types";

export type ClientOptions = {
   // TODO: Actually implement intents
   intents: number;
   rest?: Partial<RESTOptions>;
   gateway?: Partial<GatewayOptions>;
};

export type LoginCredentials = APIPostLoginJSONBody;
export type RegisterUser = APIPostRegisterJSONBody;
export type DirectChannel = APIDMChannel | APIGroupDMChannel;
