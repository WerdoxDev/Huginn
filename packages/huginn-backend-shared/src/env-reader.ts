// export function readEnv<Envs extends EnvReadable<string>[]>(...envs: Envs): Result<Envs> {
// 	const result: Result<Envs> = {};
// 	for (const env of envs) {
// 		if (typeof env === "string") {
// 			result[env] = process.env[env];
// 		} else {
// 			const foundEnv = process.env[env.key];
// 			if (!foundEnv && env.default) {
// 				result[env.key] = env.default;
// 			} else {
// 				result[env.key] = foundEnv;
// 			}
// 		}
// 	}

// 	return result;
// }
type EnvReadable = string | { key: string; default?: string };

// Helper type to generate the output type based on the input array
type EnvResult<T extends readonly EnvReadable[]> = {
	[K in T[number] as K extends string ? K : K extends { key: string } ? K["key"] : never]: K extends { default: string }
		? string
		: string | undefined;
};

export function readEnv<T extends readonly EnvReadable[]>(envs: T): EnvResult<T> {
	const result: Record<string, string | undefined> = {};

	for (const env of envs) {
		if (typeof env === "string") {
			result[env] = process.env[env];
		} else {
			result[env.key] = process.env[env.key] ?? env.default;
		}
	}

	return result as EnvResult<T>;
}
