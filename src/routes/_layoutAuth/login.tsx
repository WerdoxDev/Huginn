import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAuth/login")({
   component: Login,
});

function Login() {}
