import type { GatewayOperations } from "./gateway-types";

export function pick<Data extends object, Keys extends keyof Data>(data: Data, keys: Keys[]): Pick<Data, Keys> {
	const result = {} as Pick<Data, Keys>;

	for (const key of keys) {
		result[key] = data[key];
	}

	return result;
}

export function omit<Data extends object, Keys extends keyof Data>(data: Data, keys: Keys[]): Omit<Data, Keys> {
	const result = { ...data };

	for (const key of keys) {
		delete result[key];
	}

	return result as Omit<Data, Keys>;
}

export function omitArray<Data extends object, Keys extends keyof Data>(data: Data[], keys: Keys[]): Omit<Data, (typeof keys)[number]>[] {
	const result = [];

	for (const obj of [...data]) {
		const modifiedObj = { ...obj };
		for (const key of keys) {
			delete modifiedObj[key];
		}

		result.push(modifiedObj);
	}

	return result;
}

// export function merge<A extends object[]>(...a: [...A]) {
//    return Object.assign({}, ...a) as Spread<A>;
// }

type DeepMerge<T, U> = {
	[K in keyof T | keyof U]: K extends keyof U
		? U[K] extends object
			? K extends keyof T
				? T[K] extends object
					? DeepMerge<T[K], U[K]>
					: U[K]
				: U[K]
			: U[K]
		: K extends keyof T
			? T[K]
			: never;
};

function isObject(item: unknown): item is Record<string, unknown> {
	return item !== null && typeof item === "object" && !Array.isArray(item);
}

function deepMerge<T extends object, U extends object>(target: T, source: U): DeepMerge<T, U> {
	const output = { ...target } as DeepMerge<T, U>;

	if (isObject(target) && isObject(source)) {
		for (const key of Object.keys(source)) {
			const sourceKey = key as keyof U;
			const targetKey = key as keyof T;

			if (isObject(source[sourceKey])) {
				if (!(key in target)) {
					(output as Record<string, unknown>)[key] = source[sourceKey];
				} else {
					(output as Record<string, unknown>)[key] = deepMerge(target[targetKey] as unknown as object, source[sourceKey] as unknown as object);
				}
			} else {
				(output as Record<string, unknown>)[key] = source[sourceKey];
			}
		}
		// Object.keys(source).forEach((key) => {
		// });
	}

	return output;
}

export function merge<T extends object[]>(...objects: T): DeepMerge<T[0], T[1]> {
	return objects.reduce((acc, obj) => deepMerge(acc, obj), {}) as DeepMerge<T[0], T[1]>;
}

type BigIntToString<T> = T extends bigint
	? string
	: T extends Date
		? Date
		: T extends (infer U)[]
			? BigIntToString<U>[]
			: T extends object
				? { [K in keyof T]: BigIntToString<T[K]> }
				: T;

export function idFix<T>(obj: T): BigIntToString<T> {
	if (Array.isArray(obj)) {
		return obj.map((item) => idFix(item)) as BigIntToString<T>;
	}
	if (obj instanceof Date) {
		return obj as unknown as BigIntToString<T>; // Do not convert Date objects
	}
	if (typeof obj === "object" && obj !== null) {
		const newObj: Record<string, unknown> = {};
		for (const key in obj) {
			if (typeof obj[key] === "bigint") {
				newObj[key] = (obj[key] as unknown as string).toString();
			} else if (typeof obj[key] === "object") {
				newObj[key] = idFix(obj[key]);
			} else {
				newObj[key] = obj[key];
			}
		}
		return newObj as BigIntToString<T>;
	}
	return obj as BigIntToString<T>;
}

export function isOpcode<D>(data: unknown, opcode: GatewayOperations): data is D {
	if (data && typeof data === "object") {
		return "op" in data && data.op === opcode;
	}

	return false;
}

export function hasFlag<T extends number>(flags: T, flag: T): boolean {
	return (flags & flag) === flag;
}

export function generateRandomString(n: number): string {
	const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < n; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}
	return result;
}

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Merge<A, B> = {
	// For shared properties with the same name but potentially different types, we take the union of their types.
	[K in keyof A & keyof B]: A[K] | B[K];
} & {
	// Unique properties in A (nullable or undefined)
	[K in Exclude<keyof A, keyof B>]?: A[K] | null;
} & {
	// Unique properties in B (nullable or undefined)
	[K in Exclude<keyof B, keyof A>]?: B[K] | null;
};
