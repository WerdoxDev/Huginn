import AuthWrapper from "@components/AuthWrapper";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import { useClient } from "@contexts/apiContext";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext";
import { routeHistory } from "@contexts/historyContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInputs } from "@hooks/useInputs";
import { useServerErrorHandler } from "@hooks/useServerErrorHandler";
import { requireNotAuth } from "@lib/middlewares";
import { APIPostLoginJSONBody } from "@shared/api-types";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useContext, useEffect, useState } from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/login")({
   beforeLoad({ context: { client } }) {
      requireNotAuth(client);
   },
   component: Login,
});

function Login() {
   const client = useClient();
   const { inputsProps, values, resetStatuses, handleErrors } = useInputs([
      { name: "login", required: true, default: "test" },
      { name: "password", required: true, default: "test" },
   ]);

   const [hidden, setHidden] = useState(true);
   const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
   const navigate = useNavigate({ from: "/login" });

   const handleServerError = useServerErrorHandler();

   const mutation = useHuginnMutation(
      {
         async mutationFn(credentials: APIPostLoginJSONBody) {
            await client.login({
               username: credentials.username,
               email: credentials.email,
               password: credentials.password,
            });

            client.gateway.connect();
         },
         async onSuccess() {
            setAuthBackgroundState(1);
            setHidden(true);

            await navigate({ to: "/channels/@me" });

            localStorage.setItem("access-token", client.tokenHandler.token!);
            localStorage.setItem("refresh-token", client.tokenHandler.refreshToken!);
         },
      },
      handleErrors,
   );

   useEffect(() => {
      async function tryLogin() {
         const refreshToken = localStorage.getItem("refresh-token");
         try {
            if (refreshToken && routeHistory.lastPathname !== "/register") {
               setAuthBackgroundState(1);
               setHidden(true);

               await client.initializeWithToken({ refreshToken });
               client.gateway.connect();

               await navigate({ to: routeHistory.initialPathname });
            } else {
               unhide();
            }
         } catch (e) {
            localStorage.removeItem("refresh-token");
            await navigate({ to: "/login" });
            handleServerError(e);
            unhide();
         }
      }

      function unhide() {
         setHidden(false);
         setAuthBackgroundState(0);
      }

      tryLogin();
   }, []);

   async function login() {
      await mutation.mutateAsync({ username: values.login.value, email: values.login.value, password: values.password.value });

      resetStatuses();
   }

   return (
      <AuthWrapper hidden={hidden} onSubmit={login}>
         <div className="flex w-full select-none flex-col items-center">
            <h1 className="mb-2 text-2xl font-medium text-text">Welcome back!</h1>
            <div className=" text-text/70">It's very good to see you again!</div>
         </div>
         <div className="mt-5 w-full">
            <HuginnInput className="mb-5 [&_input]:lowercase" {...inputsProps.login}>
               <HuginnInput.Label>Email or Username</HuginnInput.Label>
            </HuginnInput>

            <PasswordInput {...inputsProps.password}>
               <HuginnInput.Label>Password</HuginnInput.Label>
            </PasswordInput>

            <LinkButton className="mb-5 mt-1 text-sm">Forgot your password?</LinkButton>

            <LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-11 w-full bg-primary " type="submit">
               Log In
            </LoadingButton>

            <div className="mt-3 flex select-none items-center">
               <span className="text-sm text-text opacity-70"> Don't have an account? </span>
               <LinkButton to="/register" className="ml-1 text-sm" preload={false}>
                  Register
               </LinkButton>
            </div>
         </div>
      </AuthWrapper>
   );
}
