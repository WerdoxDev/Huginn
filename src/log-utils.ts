import { HuginnErrorData } from "@shared/errors";
import { consola } from "consola";
import { colors } from "consola/utils";

const divider = colors.gray(">");
const startText = colors.bold(colors.gray("START"));
const endText = colors.bold(colors.gray("END"));
const requestDataText = colors.bold(colors.gray("REQUEST DATA"));
const responseDataText = colors.bold(colors.gray("RESPONSE DATA"));

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
   const dataText = dataString.length > 100 ? colors.gray("Data Too Long") : dataString;

   consola.info(`${text} ${divider} ${pathText} ${divider} ${dataText}`);
}
