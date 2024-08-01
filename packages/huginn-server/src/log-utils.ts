import { HuginnErrorData } from "@huginn/shared";
import { BasePayload, GatewayOperations } from "@huginn/shared";

export const hconsole = {
   log: console.log,
   info: console.log,
   start: console.log,
   error: console.error,
   box: console.log,
   success: console.log,
   green: (s: string) => s,
   bold: (s: string) => s,
   red: (s: string) => s,
   magenta: (s: string) => s,
   gray: (s: string) => s,
   cyan: (s: string) => s,
   yellow: (s: string) => s,
   underline: (s: string) => s,
   blue: (s: string) => s,
};

const divider = hconsole.gray(">");
const startText = hconsole.bold(hconsole.gray("START"));
const endText = hconsole.bold(hconsole.gray("END"));
const requestDataText = hconsole.bold(hconsole.gray("REQUEST DATA"));
const responseDataText = hconsole.bold(hconsole.gray("RESPONSE DATA"));
const gatewayOpen = hconsole.bold(hconsole.cyan("GATEWAY OPEN"));
const gatewayClose = hconsole.bold(hconsole.red("GATEWAY CLOSE"));
const gatewayRecieve = hconsole.bold(hconsole.gray("GATEWAY RECIEVE"));
const gatewaySend = hconsole.bold(hconsole.gray("GATEWAY SEND"));

export function logServerError(path: string, e: unknown) {
   hconsole.box(`${hconsole.bold(hconsole.red("Server Error:"))} ${hconsole.green(path)}\n`, e);
}

export function logReject(path: string, method: string, error?: HuginnErrorData | string, status?: number) {
   const rejectText = hconsole.bold(hconsole.red("Rejected"));
   const methodText = hconsole.bold(hconsole.red(method));
   const pathText = hconsole.green(path);
   const statusText = status ? hconsole.bold(hconsole.red(` ${status} `)) : " ";
   let errorText: string = hconsole.red("Unknown Error");

   if (typeof error === "string") {
      errorText = hconsole.red(error);
   } else if (typeof error === "object") {
      errorText = hconsole.red(`${error.message} (${hconsole.bold(error.code.toString())})`);
   }

   hconsole.info(`${endText} ${divider} ${rejectText} (${methodText}) ${divider} ${pathText} ${divider}${statusText}${errorText}\n`);
}

export function logResponse(path: string, status: number, data?: unknown) {
   logData(path, responseDataText, data);

   const responseText = hconsole.bold(hconsole.magenta("Response"));
   const statusText = hconsole.bold(hconsole.magenta(status.toString()));
   const pathText = hconsole.green(path);

   hconsole.info(`${endText} ${divider} ${responseText} (${statusText}) ${divider} ${pathText}\n`);
}

export function logRequest(path: string, method: string, data?: unknown) {
   const pathText = hconsole.green(path);
   const methodText = hconsole.bold(hconsole.cyan(method));
   const requestText = hconsole.bold(hconsole.cyan("Request"));

   hconsole.info(`${startText} ${divider} ${requestText} (${methodText}) ${divider} ${pathText}`);
   logData(path, requestDataText, data);
}

export function logData(path: string, text: string, data?: unknown) {
   const dataString = JSON.stringify(data);

   if (!dataString) {
      return;
   }

   const pathText = hconsole.green(path);
   let dataText = hconsole.gray(dataString);

   // Check if it's a message
   if (data !== null && typeof data === "object" && "content" in data) {
      const content = (data.content as string).replaceAll("\n", " \\n ");
      dataText = hconsole.gray(`${hconsole.underline("Formatted")} > ${content}`);
   }
   // Normal data
   else if (dataString.length > 100) {
      dataText = hconsole.gray("Data Too Long");
   }

   hconsole.info(`${text} ${divider} ${pathText} ${divider} ${dataText}`);
}

export function logGatewayOpen() {
   hconsole.info(`${gatewayOpen}\n`);
}

export function logGatewayClose(code: number, reason: string) {
   const codeText = hconsole.red(code.toString());
   const reasonText = hconsole.gray(reason === "" ? "No reason" : reason);

   hconsole.info(`${gatewayClose} (${codeText}) ${divider} ${reasonText}\n`);
}

export function logGatewayRecieve(data: BasePayload, logHeartbeat: boolean) {
   if (data.op === GatewayOperations.HEARTBEAT && !logHeartbeat) {
      return;
   }

   const opcodeText = hconsole.yellow(opcodeToText(data.op));
   const opcodeNumberText = hconsole.yellow(data.op.toString());

   let dataText = hconsole.gray(JSON.stringify(data.d));

   if (dataText.length > 100) {
      dataText = hconsole.gray("Data Too Long");
   }

   hconsole.info(`${gatewayRecieve} ${divider} ${opcodeText} (${opcodeNumberText}) ${divider} ${dataText}`);
}

export function logGatewaySend(data: BasePayload, logHeartbeat: boolean) {
   if (data.op === GatewayOperations.HEARTBEAT_ACK && !logHeartbeat) {
      return;
   }

   const opcodeText = hconsole.blue(data.t ? `${data.t} ${divider} ${opcodeToText(data.op)}` : opcodeToText(data.op));
   const opcodeNumberText = hconsole.blue(data.op.toString());

   let dataText = hconsole.gray(JSON.stringify(data.d) || "null");

   if (dataText.length > 100) {
      dataText = hconsole.gray("Data Too Long");
   }

   hconsole.info(`${gatewaySend} ${divider} ${opcodeText} (${opcodeNumberText}) ${divider} ${dataText}\n`);
}

function opcodeToText(opcode: GatewayOperations) {
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
      case GatewayOperations.RESUME:
         return "Resume";

      default:
         return "Unknown";
   }
}
