import { startServer } from "./server";
import "./setup";

const { router, server } = await startServer({ serve: false, defineOptions: false, logRoutes: true });

export { router, server };
