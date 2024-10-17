import { startServer } from "./server.ts";
import "./setup.ts";

const { router } = await startServer({ serve: false });

export { router };
