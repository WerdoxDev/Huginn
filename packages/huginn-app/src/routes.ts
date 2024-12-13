import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

const routes: RouteConfig = [
  index("routes/home.tsx"),
  layout("routes/app/app-layout.tsx", [
    layout("routes/app/auth/auth-layout.tsx", [
      route("login", "routes/app/auth/login.tsx"),
      route("register", "routes/app/auth/register.tsx"),
    ]),
  ]),
];

export default routes;
