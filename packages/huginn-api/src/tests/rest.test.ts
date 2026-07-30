import * as shared from "@huginnjs/shared";
import { HTTPError, HuginnAPIError, type HuginnErrorData, JsonCode, parseResponse, type RequestMethod, resolveImage, resolveRequest } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, test, vi } from "vitest";

import { HuginnClient } from "../huginn-client";

type MockXMLHttpRequestConfig = {
   status?: number;
   statusText?: string;
   responseText?: string;
   response?: unknown;
   headers?: string;
   onSend?: (xhr: MockXMLHttpRequest) => void;
};

class MockXMLHttpRequest {
   public static readonly UNSENT = 0;
   public static readonly OPENED = 1;
   public static readonly HEADERS_RECEIVED = 2;
   public static readonly LOADING = 3;
   public static readonly DONE = 4;

   public static instances: MockXMLHttpRequest[] = [];
   public static nextConfig: MockXMLHttpRequestConfig = {};

   public readonly upload = {} as XMLHttpRequestUpload;
   public readonly requestHeaders: Record<string, string> = {};
   public method = "GET";
   public url = "";
   public body: BodyInit | null = null;
   public readyState = MockXMLHttpRequest.UNSENT;
   public status = 200;
   public statusText = "OK";
   public responseText = "";
   public response: unknown = "";
   public onload: null | (() => void) = null;
   public onerror: null | ((event: Event) => void) = null;

   private readonly listeners = new Map<string, Set<(event: Event) => void>>();
   private readonly config: MockXMLHttpRequestConfig;

   public constructor() {
      this.config = MockXMLHttpRequest.nextConfig;
      this.status = this.config.status ?? this.status;
      this.statusText = this.config.statusText ?? this.statusText;
      this.responseText = this.config.responseText ?? this.responseText;
      this.response = this.config.response ?? this.responseText;

      MockXMLHttpRequest.instances.push(this);
   }

   public open(method: string, url: string): void {
      this.method = method;
      this.url = url;
      this.readyState = MockXMLHttpRequest.OPENED;
   }

   public setRequestHeader(name: string, value: string): void {
      this.requestHeaders[name] = value;
   }

   public addEventListener(type: string, listener: (event: Event) => void): void {
      const listeners = this.listeners.get(type) ?? new Set();
      listeners.add(listener);
      this.listeners.set(type, listeners);
   }

   public removeEventListener(type: string, listener: (event: Event) => void): void {
      this.listeners.get(type)?.delete(listener);
   }

   public abort(): void {
      this.onerror?.(new Event("abort"));
   }

   public send(body?: XMLHttpRequestBodyInit | null): void {
      this.body = (body ?? null) as BodyInit | null;
      this.config.onSend?.(this);

      this.readyState = MockXMLHttpRequest.DONE;
      this.listeners.get("readystatechange")?.forEach((listener) => listener(new Event("readystatechange")));
      queueMicrotask(() => {
         this.onload?.();
      });
   }

   public getAllResponseHeaders(): string {
      return this.config.headers ?? "Content-Type: application/json\r\nX-Test: yes\r\n";
   }
}

const originalXMLHttpRequest = globalThis.XMLHttpRequest;

beforeEach(() => {
   MockXMLHttpRequest.instances = [];
   MockXMLHttpRequest.nextConfig = {};
});

afterEach(() => {
   vi.restoreAllMocks();

   if (originalXMLHttpRequest) {
      globalThis.XMLHttpRequest = originalXMLHttpRequest;
   } else {
      Reflect.deleteProperty(globalThis, "XMLHttpRequest");
   }
});

describe("resolveRequest()", () => {
   test.each(["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"])("should correctly resolve a %s request options", async (method) => {
      const resolvedRequest = await resolveRequest({
         fullRoute: "/test",
         auth: true,
         authPrefix: "Bearer",
         appendToFormData: false,
         headers: { test: "test" },
         body: method === "GET" || method === "HEAD" ? "should not be there" : "should be there",
         query: new URLSearchParams({ test: "123" }),
         token: "123",
         method: method as RequestMethod,
         root: "https://test.com",
      });

      expect(resolvedRequest).toStrictEqual({
         url: "https://test.com/test?test=123",
         fetchOptions: {
            body: method === "GET" || method === "HEAD" ? null : "should be there",
            headers: {
               test: "test",
               Authorization: "Bearer 123",
            },
            method: method,
         },
      });
   });

   test("should throw when auth is true but no token is passed", async () => {
      await expect(
         resolveRequest({
            fullRoute: "/test",
            method: "GET",
            auth: true,
            token: undefined,
            root: "https://test.com",
         }),
      ).rejects.toThrow();
   });

   test("should add a file to the body and correctly determine its contentType", async () => {
      const data = await resolveImage(decodeURIComponent(new URL("./pixel.png", import.meta.url).pathname.slice(1)));
      const resolvedRequest = await resolveRequest({
         fullRoute: "/test",
         method: "POST",
         root: "https://test.com",
         files: [{ data: data!, name: "test" }],
      });

      expect(resolvedRequest.fetchOptions.body).toBeInstanceOf(FormData);
      expect(Array.from((resolvedRequest.fetchOptions.body as FormData).entries())).toHaveLength(1);
      expect(Array.from((resolvedRequest.fetchOptions.body as FormData).entries())[0]?.[0]).toBe("files[0]");
   });
});

describe("parseResponse()", () => {
   test("should correctly parse response", async () => {
      const response = new Response(JSON.stringify({ test: 123 }), {
         headers: { "Content-Type": "application/json" },
      });

      const parsed = await parseResponse(response);

      expect(parsed).toStrictEqual({ test: 123 });
   });
});

describe("handleErrors()", () => {
   test("should correctly handle errors", async () => {
      const client = new HuginnClient();
      const response = new Response(
         JSON.stringify({
            code: JsonCode.INVALID_FORM_BODY,
            message: "Invalid Form Body",
         } satisfies HuginnErrorData),
         {
            status: 400,
            headers: { "Content-Type": "application/json" },
         },
      );

      await expect(
         client.rest.handleErrors(response, "POST", "https://test.com/test", {
            body: { test: 123 },
         }),
      ).rejects.toThrow("Invalid Form Body");
   });

   test("should throw a HuginnAPIError carrying the parsed error data for 4xx statuses", async () => {
      const client = new HuginnClient();
      const response = new Response(
         JSON.stringify({
            code: JsonCode.INVALID_FORM_BODY,
            message: "Invalid Form Body",
         } satisfies HuginnErrorData),
         {
            status: 400,
            headers: { "Content-Type": "application/json" },
         },
      );

      const error = await client.rest.handleErrors(response, "POST", "https://test.com/test", { body: { test: 123 } }).catch((e) => e);

      expect(error).toBeInstanceOf(HuginnAPIError);
      expect(error.code).toBe(JsonCode.INVALID_FORM_BODY);
      expect(error.status).toBe(400);
   });

   test("should throw an HTTPError for 5xx statuses", async () => {
      const client = new HuginnClient();
      const response = new Response("Internal Server Error", {
         status: 500,
         statusText: "Internal Server Error",
      });

      await expect(client.rest.handleErrors(response, "GET", "https://test.com/test", {})).rejects.toBeInstanceOf(HTTPError);
   });

   test("should clear the stored token on a 401 for an authenticated request", async () => {
      const client = new HuginnClient();
      client.tokenHandler.token = "some-token";

      const response = new Response(
         JSON.stringify({
            code: JsonCode.INVALID_FORM_BODY,
            message: "Unauthorized",
         } satisfies HuginnErrorData),
         {
            status: 401,
            headers: { "Content-Type": "application/json" },
         },
      );

      await expect(client.rest.handleErrors(response, "GET", "https://test.com/test", { auth: true })).rejects.toThrow();

      expect(client.tokenHandler.token).toBeUndefined();
   });

   test("should not clear the stored token on a 401 for a request that doesn't require auth", async () => {
      const client = new HuginnClient();
      client.tokenHandler.token = "some-token";

      const response = new Response(
         JSON.stringify({
            code: JsonCode.INVALID_FORM_BODY,
            message: "Unauthorized",
         } satisfies HuginnErrorData),
         {
            status: 401,
            headers: { "Content-Type": "application/json" },
         },
      );

      await expect(client.rest.handleErrors(response, "GET", "https://test.com/test", { auth: false })).rejects.toThrow();

      expect(client.tokenHandler.token).toBe("some-token");
   });

   test("should return the response unchanged for statuses outside the 4xx/5xx range", async () => {
      const client = new HuginnClient();
      const response = new Response(null, { status: 304 });

      const result = await client.rest.handleErrors(response, "GET", "https://test.com/test", {});

      expect(result).toBe(response);
   });
});

describe("request()", () => {
   test("should call makeRequest with the resolved url/options and parse a successful response", async () => {
      const client = new HuginnClient();
      const makeRequest = vi.fn().mockResolvedValue(
         new Response(JSON.stringify({ hello: "world" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
         }),
      );
      client.rest.options.makeRequest = makeRequest;

      const result = await client.rest.request({
         fullRoute: "/test",
         method: "GET",
         query: new URLSearchParams({ a: "1" }),
      });

      expect(makeRequest).toHaveBeenCalledOnce();

      const [calledUrl, calledFetchOptions] = makeRequest.mock.calls[0];
      expect(calledUrl).toContain("/test?a=1");
      expect(calledFetchOptions.method).toBe("GET");

      expect(result).toStrictEqual({ hello: "world" });
   });

   test("should use XMLHttpRequest when xhr is enabled in a browser", async () => {
      const client = new HuginnClient();
      const makeRequest = vi.fn();
      client.rest.options.makeRequest = makeRequest;

      vi.spyOn(shared, "isBrowser").mockReturnValue(true);
      globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
      MockXMLHttpRequest.nextConfig = {
         responseText: JSON.stringify({ hello: "xhr" }),
         response: JSON.stringify({ hello: "xhr" }),
      };

      const result = await client.rest.request({
         fullRoute: "/test",
         method: "POST",
         body: { a: 1 },
         xhr: { enabled: true },
      });

      expect(makeRequest).not.toHaveBeenCalled();
      expect(MockXMLHttpRequest.instances).toHaveLength(1);

      const xhr = MockXMLHttpRequest.instances[0];
      expect(xhr.method).toBe("POST");
      expect(xhr.url).toContain("/test");
      expect(xhr.requestHeaders["Content-Type"]).toBe("application/json");
      expect(result).toStrictEqual({ hello: "xhr" });
   });

   test("should forward upload progress events through the xhr callback", async () => {
      const client = new HuginnClient();
      vi.spyOn(shared, "isBrowser").mockReturnValue(true);
      globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;

      const progressHandler = vi.fn();
      MockXMLHttpRequest.nextConfig = {
         responseText: JSON.stringify({ ok: true }),
         response: JSON.stringify({ ok: true }),
         onSend(xhr: MockXMLHttpRequest) {
            (xhr.upload as { onprogress?: (event: ProgressEvent) => void }).onprogress?.({ loaded: 1, total: 2 } as ProgressEvent);
         },
      };

      const result = await client.rest.request({
         fullRoute: "/test",
         method: "POST",
         body: { a: 1 },
         xhr: {
            enabled: true,
            onUploadProgress: progressHandler,
         },
      });

      expect(progressHandler).toHaveBeenCalledOnce();
      expect(progressHandler).toHaveBeenCalledWith(expect.objectContaining({ loaded: 1, total: 2 }));
      expect(result).toStrictEqual({ ok: true });
   });

   test("should delegate to handleErrors and throw when the response is not ok", async () => {
      const client = new HuginnClient();
      const makeRequest = vi.fn().mockResolvedValue(
         new Response(
            JSON.stringify({
               code: JsonCode.INVALID_FORM_BODY,
               message: "Invalid Form Body",
            } satisfies HuginnErrorData),
            {
               status: 400,
               headers: { "Content-Type": "application/json" },
            },
         ),
      );
      client.rest.options.makeRequest = makeRequest;

      await expect(
         client.rest.request({
            fullRoute: "/test",
            method: "POST",
         }),
      ).rejects.toThrow("Invalid Form Body");
   });
});

describe("convenience methods", () => {
   it("get() should call request() with method GET", async () => {
      const client = new HuginnClient();
      const requestSpy = vi.spyOn(client.rest, "request").mockResolvedValue({ ok: true });

      const result = await client.rest.get("/test", { headers: { test: "test" } });

      expect(requestSpy).toHaveBeenCalledWith({
         headers: { test: "test" },
         fullRoute: "/test",
         method: "GET",
      });
      expect(result).toStrictEqual({ ok: true });
   });

   it("post() should call request() with method POST", async () => {
      const client = new HuginnClient();
      const requestSpy = vi.spyOn(client.rest, "request").mockResolvedValue({ ok: true });

      await client.rest.post("/test", { body: { a: 1 } });

      expect(requestSpy).toHaveBeenCalledWith({
         body: { a: 1 },
         fullRoute: "/test",
         method: "POST",
      });
   });

   it("put() should call request() with method PUT", async () => {
      const client = new HuginnClient();
      const requestSpy = vi.spyOn(client.rest, "request").mockResolvedValue({ ok: true });

      await client.rest.put("/test", {});

      expect(requestSpy).toHaveBeenCalledWith({ fullRoute: "/test", method: "PUT" });
   });

   it("patch() should call request() with method PATCH", async () => {
      const client = new HuginnClient();
      const requestSpy = vi.spyOn(client.rest, "request").mockResolvedValue({ ok: true });

      await client.rest.patch("/test", {});

      expect(requestSpy).toHaveBeenCalledWith({ fullRoute: "/test", method: "PATCH" });
   });

   it("delete() should call request() with method DELETE", async () => {
      const client = new HuginnClient();
      const requestSpy = vi.spyOn(client.rest, "request").mockResolvedValue({ ok: true });

      await client.rest.delete("/test", {});

      expect(requestSpy).toHaveBeenCalledWith({ fullRoute: "/test", method: "DELETE" });
   });
});
