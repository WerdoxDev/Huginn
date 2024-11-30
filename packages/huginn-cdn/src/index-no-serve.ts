import { startCdn } from "./cdn";
import "./setup";
import { AWS_AVAILABLE } from "./setup";

const { router } = await startCdn({ serve: false, defineOptions: false, storage: AWS_AVAILABLE ? "aws" : "local" });

export { router };
