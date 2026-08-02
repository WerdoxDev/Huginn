import type {
   InfiniteData,
   MutationFunction,
   QueryFunction,
   QueryFunctionContext,
   UseInfiniteQueryOptions,
   UseMutationOptions,
   UseQueryOptions,
} from "@tanstack/react-query";

import { HuginnAPIError } from "@huginnjs/shared";

import { queryClient } from "./queries";

const CHANNEL_NAME = "huginn-query-bridge";
const REQUEST_TIMEOUT_MS = 15_000;

const isMainWindow = !window.opener;

const channel = new BroadcastChannel(CHANNEL_NAME);

type QueryRegistryEntry = {
   kind: "query" | "infinite";
   fetch: (ctx: { queryKey: readonly unknown[]; pageParam?: unknown }) => Promise<unknown>;
};

const queryRegistry = new Map<string, QueryRegistryEntry>();
const mutationRegistry = new Map<string, (variables: unknown) => Promise<unknown>>();

type Pending = { resolve: (data: unknown) => void; reject: (err: Error) => void };
const pending = new Map<string, Pending>();

const requestSource = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
let requestSequence = 0;

function requestId(name: string) {
   return `${name}:${requestSource}:${requestSequence++}`;
}

type BridgeError =
   | { kind: "error"; message: string }
   | {
        kind: "huginn-api-error";
        rawError: HuginnAPIError["rawError"];
        code: HuginnAPIError["code"];
        status: number;
        method: string;
        url: string;
        requestBody: HuginnAPIError["requestBody"];
     };

function serializeError(error: unknown): BridgeError {
   if (error instanceof HuginnAPIError) {
      return {
         kind: "huginn-api-error",
         rawError: error.rawError,
         code: error.code,
         status: error.status,
         method: error.method,
         url: error.url,
         requestBody: error.requestBody,
      };
   }

   return { kind: "error", message: error instanceof Error ? error.message : String(error) };
}

function deserializeError(error: BridgeError | undefined, fallbackMessage?: string): Error {
   if (error?.kind === "huginn-api-error") {
      return new HuginnAPIError(error.rawError, error.code, error.status, error.method, error.url, {
         body: error.requestBody.json,
         files: error.requestBody.files,
      });
   }

   return new Error(error?.message ?? fallbackMessage ?? "Unknown query bridge error");
}

function postError(id: string, error: unknown) {
   const serialized = serializeError(error);
   channel.postMessage({
      type: "bridge:error",
      id,
      error: serialized,
      // Keep message for compatibility with windows running an older bridge.
      message: serialized.kind === "error" ? serialized.message : error instanceof Error ? error.message : String(error),
   });
}

channel.addEventListener("message", async (event: MessageEvent) => {
   const msg = event.data;
   if (!msg || typeof msg !== "object") return;

   // Only the main window ever answers requests.
   if (msg.type === "bridge:request" && isMainWindow) {
      const { id, name, queryKey, pageParam } = msg;
      const entry = queryRegistry.get(name);

      if (!entry) {
         channel.postMessage({ type: "bridge:error", id, message: `No fetcher registered for "${name}"` });
         return;
      }

      try {
         const data = await queryClient.fetchQuery({ queryKey, queryFn: () => entry.fetch({ queryKey, pageParam }) });
         channel.postMessage({ type: "bridge:result", id, data });
      } catch (err) {
         postError(id, err);
      }

      return;
   }

   if (msg.type === "bridge:mutation-request" && isMainWindow) {
      const { id, name, variables } = msg;
      const mutate = mutationRegistry.get(name);

      if (!mutate) {
         channel.postMessage({ type: "bridge:error", id, message: `No mutation registered for "${name}"` });
         return;
      }

      try {
         const data = await mutate(variables);
         channel.postMessage({ type: "bridge:result", id, data });
      } catch (err) {
         postError(id, err);
      }

      return;
   }

   if (msg.type === "bridge:result" && pending.has(msg.id)) {
      pending.get(msg.id)!.resolve(msg.data);
      pending.delete(msg.id);
      return;
   }

   if (msg.type === "bridge:error" && pending.has(msg.id)) {
      pending.get(msg.id)!.reject(deserializeError(msg.error as BridgeError | undefined, msg.message));
      pending.delete(msg.id);
   }
});

function requestFromMainWindow(name: string, queryKey: readonly unknown[], pageParam: unknown, signal?: AbortSignal): Promise<unknown> {
   const id = requestId(name);

   return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
         pending.delete(id);
         reject(new Error(`Main window did not respond to query "${name}" in time`));
      }, REQUEST_TIMEOUT_MS);

      pending.set(id, {
         resolve: (data) => {
            clearTimeout(timeout);
            resolve(data);
         },
         reject: (err) => {
            clearTimeout(timeout);
            reject(err);
         },
      });

      signal?.addEventListener("abort", () => {
         clearTimeout(timeout);
         pending.delete(id);
         reject(new Error("aborted"));
      });

      channel.postMessage({ type: "bridge:request", id, name, queryKey, pageParam });
   });
}

function requestMutationFromMainWindow(name: string, variables: unknown): Promise<unknown> {
   const id = requestId(name);

   return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
         pending.delete(id);
         reject(new Error(`Main window did not respond to mutation "${name}" in time`));
      }, REQUEST_TIMEOUT_MS);

      pending.set(id, {
         resolve: (data) => {
            clearTimeout(timeout);
            resolve(data);
         },
         reject: (err) => {
            clearTimeout(timeout);
            reject(err);
         },
      });

      channel.postMessage({ type: "bridge:mutation-request", id, name, variables });
   });
}

type Extras<Data, Args extends unknown[], TData = Data> =
   | Omit<UseQueryOptions<Data, Error, TData>, "queryKey" | "queryFn">
   | ((...args: Args) => Omit<UseQueryOptions<Data, Error, TData>, "queryKey" | "queryFn">);

function resolveExtras<T extends object, Args extends unknown[]>(
   extras: T | ((...args: Args) => T) | undefined,
   args: Args,
): T | Record<string, never> {
   if (!extras) return {};
   return typeof extras === "function" ? (extras as (...args: Args) => T)(...args) : extras;
}

export function defineQuery<Args extends unknown[], Data, TData = Data>(
   name: string,
   keyFn: (...args: Args) => readonly unknown[],
   fetcher: (...args: Args) => Promise<Data>,
   extras?: Extras<Data, Args, TData>,
) {
   if (!queryRegistry.has(name)) {
      queryRegistry.set(name, {
         kind: "query",
         fetch: (ctx) => fetcher(...(ctx.queryKey.slice(1) as Args)),
      });
   }

   return (...args: Args): UseQueryOptions<Data, Error, TData> & { queryFn: QueryFunction<Data> } => {
      const queryKey = [name, ...keyFn(...args)] as const;
      return {
         queryKey: queryKey as unknown as UseQueryOptions<Data, Error, TData>["queryKey"],
         queryFn: async (ctx: QueryFunctionContext): Promise<Data> => {
            if (isMainWindow) return fetcher(...args);
            return requestFromMainWindow(name, queryKey, undefined, ctx.signal) as Promise<Data>;
         },
         ...resolveExtras(extras, args),
      };
   };
}

type MutationExtras<Data, Variables, Context> = Omit<UseMutationOptions<Data, Error, Variables, Context>, "mutationKey" | "mutationFn">;

export function defineMutation<Data, Variables = void, Context = unknown>(
   name: string,
   mutationFn: (variables: Variables) => Promise<Data>,
   extras?: MutationExtras<Data, Variables, Context>,
): UseMutationOptions<Data, Error, Variables, Context> & { mutationFn: MutationFunction<Data, Variables> } {
   if (!mutationRegistry.has(name)) {
      mutationRegistry.set(name, (variables) => mutationFn(variables as Variables));
   }

   return {
      mutationKey: [name],
      mutationFn: async (variables) => {
         if (isMainWindow) return mutationFn(variables);
         return requestMutationFromMainWindow(name, variables) as Promise<Data>;
      },
      ...extras,
   };
}

type InfiniteExtras<Data, Args extends unknown[], PageParam> =
   | Omit<
        UseInfiniteQueryOptions<Data, Error, InfiniteData<Data, PageParam>, readonly unknown[], PageParam>,
        "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
     >
   | ((
        ...args: Args
     ) => Omit<
        UseInfiniteQueryOptions<Data, Error, InfiniteData<Data, PageParam>, readonly unknown[], PageParam>,
        "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
     >);

export function defineInfiniteQuery<Args extends unknown[], Data, PageParam>(
   name: string,
   keyFn: (...args: Args) => readonly unknown[],
   fetcher: (pageParam: PageParam, ...args: Args) => Promise<Data>,
   pageParamOptions: {
      initialPageParam: PageParam;
      getNextPageParam: (lastPage: Data, allPages: Data[], lastPageParam: PageParam, allPageParams: PageParam[]) => PageParam | undefined | null;
      getPreviousPageParam?: (
         firstPage: Data,
         allPages: Data[],
         firstPageParam: PageParam,
         allPageParams: PageParam[],
      ) => PageParam | undefined | null;
   },
   extras?: InfiniteExtras<Data, Args, PageParam>,
) {
   if (!queryRegistry.has(name)) {
      queryRegistry.set(name, {
         kind: "infinite",
         fetch: (ctx) => fetcher(ctx.pageParam as PageParam, ...(ctx.queryKey.slice(1) as Args)),
      });
   }

   return (...args: Args): UseInfiniteQueryOptions<Data, Error, InfiniteData<Data, PageParam>, readonly unknown[], PageParam> => {
      const queryKey = [name, ...keyFn(...args)] as const;
      return {
         queryKey: queryKey as unknown as readonly unknown[],
         queryFn: async (ctx: QueryFunctionContext): Promise<Data> => {
            const pageParam = ctx.pageParam as PageParam;
            if (isMainWindow) return fetcher(pageParam, ...args);
            return requestFromMainWindow(name, queryKey, pageParam, ctx.signal) as Promise<Data>;
         },
         initialPageParam: pageParamOptions.initialPageParam,
         getNextPageParam: pageParamOptions.getNextPageParam,
         getPreviousPageParam: pageParamOptions.getPreviousPageParam,
         ...resolveExtras(extras, args),
      };
   };
}
