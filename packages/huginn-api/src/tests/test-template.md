## Default test

```ts
import { expect } from "@std/expect";
import { describe, it} from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("category-name", () => {
   it(t-description", async () => {
      const client = await getLoggedClient();
   });
});
```

## Http result test

```ts
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { getLoggedClient } from "../test-utils.ts";

describe("category-name", () => {
   it("test-description", async () => {
      const client = await getLoggedClient();

      expect(() => test).toThrow("expected");
   });
});
```
