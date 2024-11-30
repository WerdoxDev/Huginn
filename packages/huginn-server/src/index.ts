import { startServer } from "./server";
import "./setup";

await startServer({ serve: true, defineOptions: true, logRoutes: true });
