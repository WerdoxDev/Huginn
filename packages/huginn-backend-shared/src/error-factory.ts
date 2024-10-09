import type { HuginnErrorData, HuginnErrorGroupWrapper, JsonCode } from "@huginn/shared";

export class ErrorFactory {
	public message: string;
	public code: JsonCode;
	public errors: Record<string, HuginnErrorGroupWrapper> = {};

	public constructor(message: string, code: JsonCode) {
		this.message = message;
		this.code = code;
	}

	public errorRaw(name: string, message: string, code: string): this {
		if (!this.errors[name]) {
			this.errors[name] = { _errors: [] };
		}
		this.errors[name]._errors.push({ code, message });
		return this;
	}

	public addError(name: string, field: [string, string]): this {
		return this.errorRaw(name, field[0], field[1]);
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
