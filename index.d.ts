import { Elysia, type Context, type DecoratorBase } from "elysia";

export type InferContext<T extends Elysia, Body = unknown, Params extends string = "", Query = unknown> = T extends Elysia<
   infer Path,
   infer Decorators,
   infer _Definitions,
   infer _ParentSchema,
   infer Routes
>
   ? Context<
        Routes & { body: Body; query: Query; params: ParameterToRecord<FilterUrlPath<SplitUrlPath<Params>>> },
        DecoratorBase,
        Path
     > &
        Partial<Decorators["request"]>
   : never;

type SplitUrlPath<T> = T extends `${infer A}/${infer B}` ? [A, ...SplitUrlPath<B>] : T extends `${infer A}` ? [A] : [T];

type FilterUrlPath<T extends unknown[]> = T extends [infer Item, ...infer Rest]
   ? Item extends `:${infer Parameter}`
      ? [Parameter, ...FilterUrlPath<Rest>]
      : FilterUrlPath<Rest>
   : [];

type ParameterToRecord<T extends string[]> = Record<T[number], string>;
