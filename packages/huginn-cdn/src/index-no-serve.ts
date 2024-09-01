import { startCdn } from "./cdn";
import "./setup";

const { router } = await startCdn({ serve: false });

export { router };
