import { createFileRoute } from "@tanstack/react-router";
import { useInputs } from "../../hooks/useInputs";
import HuginnInput from "../../components/HuginnInput";

export const Route = createFileRoute("/_layoutAuth/login")({
   component: Login,
});

function Login() {
   const { inputProps } = useInputs([
      { name: "login", required: true, default: "test" },
      { name: "password", required: true, default: "test" },
   ]);

   return (
      <HuginnInput {...inputProps.login}>
         <HuginnInput.Label>Login</HuginnInput.Label>
      </HuginnInput>
   );
}
