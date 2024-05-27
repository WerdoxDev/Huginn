import { HuginnAPIError } from "@api/index";
import { APIPostRegisterJSONBody } from "@shared/api-types";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useContext, useEffect, useState } from "react";
import AnimatedMessage from "../../../components/AnimatedMessage";
import AuthWrapper from "../../../components/AuthWrapper";
import LinkButton from "../../../components/button/LinkButton";
import LoadingButton from "../../../components/button/LoadingButton";
import HuginnInput from "../../../components/input/HuginnInput";
import PasswordInput from "../../../components/input/PasswordInput";
import { AuthBackgroundContext } from "../../../contexts/authBackgroundContext";
import { useInputs } from "../../../hooks/useInputs";
import useUniqueUsernameMessage from "../../../hooks/useUniqueUsernameMessage";
import { client } from "../../../lib/api";
import { requireNotAuth } from "../../../lib/middlewares";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/register")({
   beforeLoad() {
      requireNotAuth();
   },
   component: Register,
});

function Register() {
   const { inputsProps, values, resetStatuses, handleErrors, validateValues } = useInputs([
      { name: "email", required: true },
      { name: "displayName", required: false },
      { name: "username", required: true },
      { name: "password", required: true },
   ]);

   const [hidden, setHidden] = useState(false);
   const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
   const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, "username");
   const navigate = useNavigate({ from: "/register" });

   const mutation = useMutation({
      async mutationFn(user: APIPostRegisterJSONBody) {
         await client.register({
            email: user.email,
            displayName: user.displayName,
            username: user.username,
            password: user.password,
         });

         client.gateway.connect();
      },
      onError(error) {
         if (error instanceof HuginnAPIError) {
            if (error.rawError.errors === undefined) return;
            handleErrors(error.rawError.errors);
         } else {
            // handleServerError(error);
         }
      },
      async onSuccess() {
         setAuthBackgroundState(1);
         setHidden(true);

         await navigate({ to: "/channels/@me" });
      },
   });

   useEffect(() => {
      setAuthBackgroundState(0);
   }, []);

   async function register() {
      if (!validateValues()) {
         return;
      }

      await mutation.mutateAsync({
         email: values.email.value,
         displayName: values.displayName.value,
         username: values.username.value,
         password: values.password.value,
      });

      resetStatuses();
   }

   return (
      <AuthWrapper hidden={hidden} onSubmit={register}>
         <div className="flex w-full select-none flex-col items-center">
            <h1 className="mb-2 text-2xl font-medium text-text">Welcome to Huginn!</h1>
            <div className="text-text opacity-70">We are very happy to have you here!</div>
         </div>
         <div className="mt-5 w-full">
            <HuginnInput className="mb-5" {...inputsProps.email}>
               <HuginnInput.Label>Email</HuginnInput.Label>
            </HuginnInput>

            <HuginnInput className="mb-5" {...inputsProps.displayName}>
               <HuginnInput.Label>Display Name</HuginnInput.Label>
            </HuginnInput>

            <HuginnInput className="mb-5 [&_input]:lowercase" onFocus={(focused) => onFocusChanged(focused)} {...inputsProps.username}>
               <HuginnInput.Label>Username</HuginnInput.Label>
               <HuginnInput.After>
                  <AnimatedMessage className="mt-1" {...usernameMessageDetail} />
               </HuginnInput.After>
            </HuginnInput>

            <PasswordInput className="mb-5" {...inputsProps.password}>
               <HuginnInput.Label>Password</HuginnInput.Label>
            </PasswordInput>

            <LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-11 w-full bg-primary" type="submit">
               Register
            </LoadingButton>

            <div className="mt-3 flex select-none items-center">
               <span className="text-sm text-text opacity-70"> Already have an account? </span>
               <LinkButton to="/login" className="ml-1" preload={false}>
                  Login
               </LinkButton>
            </div>
         </div>
      </AuthWrapper>
   );
}
