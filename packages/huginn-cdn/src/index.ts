import { startCdn } from "./cdn";
import "./setup";

await startCdn({ serve: true });
