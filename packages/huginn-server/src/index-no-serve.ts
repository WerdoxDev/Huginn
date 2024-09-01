import { startServer } from "./server";
import "./setup";

const { router } = await startServer({ serve: false });

export { router };
