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

export function omitArray<Data extends object, Keys extends keyof Data>(
   data: Data[],
   keys: Keys[]
): Omit<Data, (typeof keys)[number]>[] {
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

export function merge<A extends object[]>(...a: [...A]) {
   return Object.assign({}, ...a) as Spread<A>;
}

type OptionalPropertyNames<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never }[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> = { [P in K]: L[P] | Exclude<R[P], undefined> };

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type SpreadTwo<L, R> = Id<
   Pick<L, Exclude<keyof L, keyof R>> &
      Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
      Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
      SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

type Spread<A extends readonly [...any]> = A extends [infer L, ...infer R] ? SpreadTwo<L, Spread<R>> : unknown;
