import type { HuginnErrorData } from "@huginn/shared";
import { type BasePayload, GatewayOperations } from "@huginn/shared";
import { consola } from "consola";
import { colors } from "consola/utils";
import type { H3Error } from "h3";

const divider = colors.gray(">");
const startText = colors.bold(colors.gray("START"));
const endText = colors.bold(colors.gray("END"));
const requestDataText = colors.bold(colors.gray("REQUEST DATA"));
const responseDataText = colors.bold(colors.gray("RESPONSE DATA"));
const gatewayOpen = colors.bold(colors.cyan("GATEWAY OPEN"));
const gatewayClose = colors.bold(colors.red("GATEWAY CLOSE"));
const gatewayRecieve = colors.bold(colors.gray("GATEWAY RECIEVE"));
const gatewaySend = colors.bold(colors.gray("GATEWAY SEND"));
const getFile = colors.bold(colors.green("GET FILE"));
const writeFile = colors.bold(colors.magenta("WRITE FILE"));
const notFoundFile = colors.bold(colors.red("FILE NOT FOUND"));
const cdn = colors.bold(colors.gray("CDN REQUEST"));

export function logServerError(path: string, e: Error): void {
	consola.box(`${colors.bold(colors.red("Server Error:"))} ${colors.green(path)}\n`, e.cause ?? e.stack ?? e.message ?? e);
}

export function logReject(path: string, method: string, id?: string, error?: HuginnErrorData | string, status?: number): void {
	const rejectText = colors.bold(colors.red("Rejected"));
	const methodText = colors.bold(colors.red(method));
	const pathText = colors.green(path);
	const statusText = status ? colors.bold(colors.red(` ${status} `)) : " ";
	const idText = colors.yellow(id ?? "unknown");
	let errorText: string = colors.red("Unknown Error");

	if (typeof error === "string") {
		errorText = colors.red(error);
	} else if (typeof error === "object") {
		errorText = colors.red(`${error.message} (${colors.bold(error.code)})`);
	}

	consola.fail(
		`${idText} ${divider} ${endText} ${divider} ${rejectText} (${methodText}) ${divider} ${pathText} ${divider}${statusText}${errorText}\n`,
	);
}

export function logResponse(path: string, status: number, id?: string, data?: unknown): void {
	logData(path, responseDataText, id, data);

	const responseText = colors.bold(colors.magenta("Response"));
	const statusText = colors.bold(colors.magenta(status));
	const pathText = colors.green(path);
	const idText = colors.yellow(id ?? "unknown");

	consola.success(`${idText} ${divider} ${endText} ${divider} ${responseText} (${statusText}) ${divider} ${pathText}\n`);
}

export function logRequest(path: string, method: string, id?: string, data?: unknown): void {
	const pathText = colors.green(path);
	const methodText = colors.bold(colors.cyan(method));
	const requestText = colors.bold(colors.cyan("Request"));
	const idText = colors.yellow(id ?? "unknown");
	consola.info(`${idText} ${divider} ${startText} ${divider} ${requestText} (${methodText}) ${divider} ${pathText}`);
	logData(path, requestDataText, id, data);
}

export function logData(path: string, text: string, id?: string, data?: unknown): void {
	if (!data) {
		return;
	}

	const dataString = JSON.stringify(data);

	if (!dataString) {
		return;
	}

	const pathText = colors.green(path);
	const idText = colors.yellow(id ?? "unknown");
	let dataText = colors.gray(data instanceof ReadableStream ? "File Data" : dataString);

	// Check if it's a message
	if (data !== null && typeof data === "object" && "content" in data) {
		const content = (data.content as string).replaceAll("\n", " \\n ");
		dataText = colors.gray(`${colors.underline("Formatted")} > ${content}`);
	}
	// Normal data
	else if (dataString.length > 100) {
		dataText = colors.gray("Data Too Long");
	}

	consola.info(`${idText} ${divider} ${text} ${divider} ${pathText} ${divider} ${dataText}`);
}

export function logGatewayOpen(): void {
	consola.info(`${gatewayOpen}\n`);
}

export function logGatewayClose(code: number, reason: string): void {
	const codeText = colors.red(code);
	const reasonText = colors.gray(reason === "" ? "No reason" : reason);

	consola.info(`${gatewayClose} (${codeText}) ${divider} ${reasonText}\n`);
}

export function logGatewayRecieve(data: BasePayload, logHeartbeat: boolean): void {
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

export function logGatewaySend(data: BasePayload, logHeartbeat: boolean): void {
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

export function logGetFile(category: string, name: string): void {
	const categoryText = colors.blue(category);
	const nameText = colors.green(name);

	consola.info(`${getFile} ${divider} ${categoryText} ${divider} ${nameText}`);
}

export function logWriteFile(category: string, name: string): void {
	const categoryText = colors.blue(category);
	const nameText = colors.green(name);

	consola.info(`${writeFile} ${divider} ${categoryText} ${divider} ${nameText}`);
}

export function logFileNotFound(category: string, name: string): void {
	const categoryText = colors.blue(category);
	const nameText = colors.green(name);

	consola.info(`${notFoundFile} ${divider} ${categoryText} ${divider} ${nameText}`);
}

export function logCDNRequest(path: string, method: string): void {
	const pathText = colors.green(path);
	const methodText = colors.bold(colors.green(method));
	consola.info(`${cdn} ${divider} ${pathText} (${methodText})`);
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
