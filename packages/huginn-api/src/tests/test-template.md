## Default test

```ts
import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("category-name", () => {
   test("test-description", async () => {
      const client = await getLoggedClient();
   });
});
```

## Http result test

```ts
import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("category-name", () => {
   test("test-description", async () => {
      const client = await getLoggedClient();

      expect(() => test).toThrow("expected");
   });
});
```
