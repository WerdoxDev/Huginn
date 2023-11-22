import { DefaultResponseInit } from "../constants";

// Temporary
export function createResult(json: unknown, status: number) {
   return new Response(JSON.stringify(json), { ...DefaultResponseInit, status });
}
