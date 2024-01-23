import { HuginnErrorData } from "@shared/errors";
import { BasePayload, GatewayOperations } from "@shared/gateway-types";
import { consola } from "consola";
import { colors } from "consola/utils";

const divider = colors.gray(">");
const startText = colors.bold(colors.gray("START"));
const endText = colors.bold(colors.gray("END"));
const requestDataText = colors.bold(colors.gray("REQUEST DATA"));
const responseDataText = colors.bold(colors.gray("RESPONSE DATA"));
const gatewayOpen = colors.bold(colors.cyan("GATEWAY OPEN"));
const gatewayClose = colors.bold(colors.red("GATEWAY CLOSE"));
const gatewayRecieve = colors.bold(colors.gray("GATEWAY RECIEVE"));
const gatewaySend = colors.bold(colors.gray("GATEWAY SEND"));

export function logServerError(path: string, e: unknown) {
   consola.box(`${colors.bold(colors.red("Server Error:"))} ${colors.green(path)}\n`, e);
}

export function logReject(path: string, method: string, error?: string | HuginnErrorData, status?: number) {
   const rejectText = colors.bold(colors.red("Rejected"));
   const methodText = colors.bold(colors.red(method));
   const pathText = colors.green(path);
   const statusText = status ? colors.bold(colors.red(` ${status} `)) : " ";
   let errorText: string = colors.red("Unknown Error");

   if (typeof error === "string") {
      errorText = colors.red(error);
   } else if (typeof error === "object") {
      errorText = colors.red(`${error.message} (${colors.bold(error.code)})`);
   }

   consola.info(`${endText} ${divider} ${rejectText} (${methodText}) ${divider} ${pathText} ${divider}${statusText}${errorText}\n`);
}

export function logResponse(path: string, status: number, data?: unknown) {
   logData(path, responseDataText, data);

   const responseText = colors.bold(colors.magenta("Response"));
   const statusText = colors.bold(colors.magenta(status));
   const pathText = colors.green(path);

   consola.info(`${endText} ${divider} ${responseText} (${statusText}) ${divider} ${pathText}\n`);
}

export function logRequest(path: string, method: string, data?: unknown) {
   const pathText = colors.green(path);
   const methodText = colors.bold(colors.cyan(method));
   const requestText = colors.bold(colors.cyan("Request"));

   consola.info(`${startText} ${divider} ${requestText} (${methodText}) ${divider} ${pathText}`);
   logData(path, requestDataText, data);
}

export function logData(path: string, text: string, data?: unknown) {
   const dataString = JSON.stringify(data);

   if (!dataString) {
      return;
   }

   const pathText = colors.green(path);
   let dataText = colors.gray(dataString);

   // Check if it's a message
   if (data !== null && typeof data === "object" && "content" in data) {
      const content = (data.content as string).replaceAll("\n", " \\n ");
      dataText = colors.gray(`${colors.underline("Formatted")} > ${content}`);
   }
   // Normal data
   else if (dataString.length > 100) {
      dataText = colors.gray("Data Too Long");
   }

   consola.info(`${text} ${divider} ${pathText} ${divider} ${dataText}`);
}

export function logGatewayOpen() {
   consola.info(`${gatewayOpen}\n`);
}

export function logGatewayClose(code: number, reason: string) {
   const codeText = colors.red(code);
   const reasonText = colors.gray(reason === "" ? "No reason" : reason);

   consola.info(`${gatewayClose} (${codeText}) ${divider} ${reasonText}\n`);
}

export function logGatewayRecieve(data: BasePayload, logHeartbeat: boolean) {
   if (data.op === GatewayOperations.HEARTBEAT && !logHeartbeat) {
      return;
   }

   const opcodeText = colors.yellow(opcodeToText(data.op));
   const opcodeNumberText = colors.yellow(data.op);

   let dataText = colors.gray(JSON.stringify(data.d));

   if (dataText.length > 100) {
      dataText = colors.gray("Data Too Long");
   }

   consola.info(`${gatewayRecieve} ${divider} ${opcodeText} (${opcodeNumberText}) ${divider} ${dataText}`);
}

export function logGatewaySend(data: BasePayload, logHeartbeat: boolean) {
   if (data.op === GatewayOperations.HEARTBEAT_ACK && !logHeartbeat) {
      return;
   }

   const opcodeText = colors.blue(data.t ? `${data.t} ${divider} ${opcodeToText(data.op)}` : opcodeToText(data.op));
   const opcodeNumberText = colors.blue(data.op);

   let dataText = colors.gray(JSON.stringify(data.d) || "null");

   if (dataText.length > 100) {
      dataText = colors.gray("Data Too Long");
   }

   consola.info(`${gatewaySend} ${divider} ${opcodeText} (${opcodeNumberText}) ${divider} ${dataText}\n`);
}

function opcodeToText(opcode: number) {
   switch (opcode) {
      case GatewayOperations.DISPATCH:
         return "Dispatch";
      case GatewayOperations.HEARTBEAT:
         return "Heartbeat";
      case GatewayOperations.HEARTBEAT_ACK:
         return "HeartbeatAck";
      case GatewayOperations.HELLO:
         return "Hello";
      case GatewayOperations.IDENTIFY:
         return "Identify";

      default:
         return "Unknown";
   }
}
