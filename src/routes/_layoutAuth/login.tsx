import { HuginnAPIError } from "@api/index";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useContext, useEffect, useState } from "react";
import AuthWrapper from "../../components/AuthWrapper";
import LinkButton from "../../components/button/LinkButton";
import LoadingButton from "../../components/button/LoadingButton";
import HuginnInput from "../../components/input/HuginnInput";
import PasswordInput from "../../components/input/PasswordInput";
import { AuthBackgroundContext } from "../../contexts/authBackgroundContext";
import { useInputs } from "../../hooks/useInputs";
import { client } from "../../lib/api";
import { requireNotAuth } from "../../lib/middlewares";

export const Route = createFileRoute("/_layoutAuth/login")({
   async beforeLoad() {
      await requireNotAuth();
   },
   component: Login,
});

function Login() {
   const { inputsProps, values, resetStatuses, handleErrors } = useInputs([
      { name: "login", required: true, default: "test" },
      { name: "password", required: true, default: "test" },
   ]);

   const [loading, setLoading] = useState(false);
   const [hidden, setHidden] = useState(false);
   const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
   const navigate = useNavigate({ from: "/login" });

   useEffect(() => {
      setAuthBackgroundState(0);
   }, []);

   async function login() {
      setLoading(true);
      resetStatuses();

      try {
         await client.login({
            username: values.login.value,
            email: values.login.value,
            password: values.password.value,
         });

         client.gateway.connect();

         localStorage.setItem("access-token", client.tokenHandler.token!);
         localStorage.setItem("refresh-token", client.tokenHandler.refreshToken!);

         setAuthBackgroundState(1);
         setHidden(true);

         navigate({ to: "/channels/@me" });
      } catch (error) {
         if (error instanceof HuginnAPIError) {
            if (error.rawError.errors === undefined) return;
            handleErrors(error.rawError.errors);
         } else {
            // handleServerError(error);
         }
      } finally {
         setLoading(false);
      }
   }

   return (
      <AuthWrapper hidden={hidden} onSubmit={() => login()}>
         <div className="flex w-full select-none flex-col items-center">
            <h1 className="mb-2 text-2xl font-medium text-text">Welcome back!</h1>
            <div className="text-text/70">It's very good to see you again!</div>
         </div>
         <div className="mt-5 w-full">
            <HuginnInput className="mb-5 [&_input]:lowercase" {...inputsProps.login}>
               <HuginnInput.Label>Email or Username</HuginnInput.Label>
            </HuginnInput>

            <PasswordInput {...inputsProps.password}>
               <HuginnInput.Label>Password</HuginnInput.Label>
            </PasswordInput>

            <LinkButton className="mb-5 mt-1">Forgot your password?</LinkButton>

            <LoadingButton loading={loading} className="h-11 w-full bg-primary" type="submit">
               Log In
            </LoadingButton>

            <div className="mt-3 flex select-none items-center">
               <span className="text-sm text-text opacity-70"> Don't have an account? </span>
               <LinkButton to="/register" className="ml-1">
                  Register
               </LinkButton>
            </div>
         </div>
      </AuthWrapper>
   );
}
