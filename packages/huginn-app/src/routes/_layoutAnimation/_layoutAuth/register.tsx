import AnimatedMessage from "@components/AnimatedMessage";
import AuthWrapper from "@components/AuthWrapper";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import RouteErrorComponent from "@components/RouteErrorComponent";
import { useClient } from "@contexts/apiContext";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext";
import { useUser } from "@contexts/userContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInputs } from "@hooks/useInputs";
import useUniqueUsernameMessage from "@hooks/useUniqueUsernameMessage";
import { APIPostRegisterJSONBody } from "@huginn/shared";
import { requireNotAuth } from "@lib/middlewares";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useContext, useEffect, useState } from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/register")({
   beforeLoad({ context: { client } }) {
      requireNotAuth(client);
   },
   component: Register,
   errorComponent: RouteErrorComponent,
});

function Register() {
   const client = useClient();
   const posthog = usePostHog();
   const { inputsProps, values, resetStatuses, handleErrors, validateValues } = useInputs([
      { name: "email", required: true },
      { name: "displayName", required: false },
      { name: "username", required: true },
      { name: "password", required: true },
   ]);

   const { setUser } = useUser();

   const [hidden, setHidden] = useState(false);
   const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
   const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, "username");
   const navigate = useNavigate({ from: "/register" });

   const mutation = useHuginnMutation(
      {
         async mutationFn(user: APIPostRegisterJSONBody) {
            await client.register({
               email: user.email,
               displayName: user.displayName,
               username: user.username,
               password: user.password,
            });

            client.gateway.connect();

            setUser(client.user);

            posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName });
            posthog.capture("registered");
         },
         async onSuccess() {
            setAuthBackgroundState(1);
            setHidden(true);

            await navigate({ to: "/channels/@me" });
         },
      },
      handleErrors,
   );

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
            <h1 className="text-text mb-2 text-2xl font-medium">Welcome to Huginn!</h1>
            <div className="text-text opacity-70">We are very happy to have you here!</div>
         </div>
         <div className="mt-5 w-full">
            <HuginnInput className="mb-5" {...inputsProps.email}>
               <HuginnInput.Label text="Email" className="mb-2" />
               <HuginnInput.Wrapper border="left">
                  <HuginnInput.Input />
               </HuginnInput.Wrapper>
            </HuginnInput>

            <HuginnInput className="mb-5" {...inputsProps.displayName}>
               <HuginnInput.Label text="Display Name" className="mb-2" />
               <HuginnInput.Wrapper border="left">
                  <HuginnInput.Input className="lowercase" />
               </HuginnInput.Wrapper>
            </HuginnInput>

            <HuginnInput className="mb-5 [&_input]:lowercase" onFocusChanged={onFocusChanged} {...inputsProps.username}>
               <HuginnInput.Label text="Username" className="mb-2" />
               <HuginnInput.Wrapper border="left">
                  <HuginnInput.Input />
               </HuginnInput.Wrapper>
               <AnimatedMessage className="mt-1" {...usernameMessageDetail} />
            </HuginnInput>

            <PasswordInput className="mb-5" {...inputsProps.password}>
               <HuginnInput.Label text="Password" className="mb-2" />
               <HuginnInput.Wrapper border="left">
                  <HuginnInput.Input />
                  <PasswordInput.ToggleButton />
               </HuginnInput.Wrapper>
            </PasswordInput>

            <LoadingButton loading={!mutation.isIdle && mutation.isPending} className="bg-primary h-11 w-full" type="submit">
               Register
            </LoadingButton>

            <div className="mt-3 flex select-none items-center">
               <span className="text-text text-sm opacity-70"> Already have an account? </span>
               <LinkButton to="/login" className="ml-1 text-sm" preload={false}>
                  Login
               </LinkButton>
            </div>
         </div>
      </AuthWrapper>
   );
}
