## Simple Route

```ts
import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object();

const app = new Hono();

app.get("/route", verifyJwt(), hValidator("json", schema), c => handleRequest(c, async () => {}));

export default app;
```

## Route Without Schema

```ts
import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/route", verifyJwt(), c => handleRequest(c, async () => {}));

export default app;
```

## Route With Error Handling

```ts
import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object();

const app = new Hono();

app.get("/route", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {},
      e => {},
   ),
);

export default app;
```

## Get jwt payload

```ts
const payload = getJwt(c);
```
