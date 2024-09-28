import { startCdn } from "./cdn";
import "./setup";
import { AWS_BUCKET, AWS_KEY_ID, AWS_REGION, AWS_SECRET_KEY } from "./setup";

const { router } = await startCdn({ serve: false, storage: AWS_SECRET_KEY && AWS_KEY_ID && AWS_BUCKET && AWS_REGION ? "aws" : "local" });

export { router };
