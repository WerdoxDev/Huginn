import { startCdn } from "./cdn";
import "./setup";
import { AWS_AVAILABLE } from "./setup";

await startCdn({ serve: true, defineOptions: true, storage: AWS_AVAILABLE ? "aws" : "local" });
