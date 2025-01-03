import type { HuginnError, HuginnErrorData, HuginnErrorFieldInformation, HuginnErrorGroupWrapper, JsonCode } from "@huginn/shared";

export class ErrorFactory {
	public message: string;
	public code: JsonCode;
	public errors: HuginnError = {};

	public constructor(message: string, code: JsonCode) {
		this.message = message;
		this.code = code;
	}

	public addError(path: string, field: [string, string]): this {
		this.setValueByPath(this.errors, path, { code: field[1], message: field[0] });
		return this;
	}

	getValueByPath(obj: HuginnError, path: string): HuginnError | undefined {
		const paths = path.split(".");
		let current = obj;

		for (let i = 0; i < paths.length; ++i) {
			if (current[paths[i]] === undefined) {
				return undefined;
			}
			current = current[paths[i]] as HuginnError;
		}

		return current;
	}

	setValueByPath(obj: HuginnError, path: string, value: HuginnErrorFieldInformation): HuginnError {
		const [current, ...rest] = path.split(".");

		if (rest.length > 0) {
			if (!obj[current]) {
				obj[current] = {};
			}
			if (typeof obj[current] !== "object") {
				obj[current] = this.setValueByPath({}, rest.join("."), value);
			} else {
				obj[current] = this.setValueByPath(obj[current] as HuginnError, rest.join("."), value);
			}
		} else {
			if (!obj[current]?._errors) {
				obj[current] = { _errors: [] };
			}

			(obj[current]._errors as HuginnErrorFieldInformation[]).push(value);
		}

		return obj;
	}

	public toObject(): HuginnErrorData {
		return {
			message: this.message,
			code: this.code,
			errors: this.hasErrors() ? this.errors : undefined,
		};
	}

	public hasErrors(): boolean {
		return Object.keys(this.errors).length !== 0;
	}
}

export function createErrorRaw(message: string, code: JsonCode): ErrorFactory {
	const factory = new ErrorFactory(message, code);
	return factory;
}

export function createErrorFactory(error: [string, JsonCode]): ErrorFactory {
	return createErrorRaw(error[0], error[1]);
}

/**
 *    "code": 123,
 *    "message": "asdasd",
 *    "errors": {
 *       "login":{
 *          "_errors":[
 *             {
 *                "code: "AN",
 *                "message": "an is not correct"
 *             }
 *          ]
 *       }
 *    }
 */
