import { AppVersionInfo } from "@/index";
import { handleRequest } from "@/src/route-utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/check-update/:target/:arch/:currentVersion", c =>
   handleRequest(c, async () => {
      const target = c.req.param("target");
      const arch = c.req.param("arch");
      const currentVersion = c.req.param("currentVersion");

      const result: AppVersionInfo = { version: "0.2.0" };
      return c.json();
   }),
);
