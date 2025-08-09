import AnimatedMessage from "@components/AnimatedMessage";
import HuginnButton from "@components/button/HuginnButton";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInitializeClient } from "@hooks/useInitializeClient";
import { useInputs } from "@hooks/useInputs";
import { useOAuth } from "@hooks/useOAuth";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import type { APIPostRegisterJSONBody } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
// import { usePostHog } from "posthog-js/react";

export default function Register() {
   const client = useClient();
   const posthog = usePostHog();
   const startBackground = useStartBackground();
   const initializeClient = useInitializeClient();
   const startOAuth = useOAuth();

   const { inputsProps, values, resetStatuses, handleErrors, validateValues, resetInput } = useInputs([
      { name: "email", required: true },
      { name: "displayName", required: false },
      { name: "username", required: true, lowercase: true },
      { name: "password", required: true },
   ]);

   const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, resetInput, "username");

   const mutation = useHuginnMutation(
      {
         async mutationFn(user: APIPostRegisterJSONBody) {
            await client?.register({
               email: user.email,
               displayName: user.displayName,
               username: user.username,
               password: user.password,
            });
         },
         async onSuccess() {
            await initializeClient({ navigatePath: "/channels/@me" });
            // posthog.capture("registered");
         },
      },
      handleErrors,
   );

   useEffect(() => {
      startBackground.setState(0);
   }, []);

   async function register() {
      posthog.capture("register:register_button_click");

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
      <StartWrapper onSubmit={register} transitionName="start-register">
         <div className="flex w-full select-none flex-col items-center">
            <div className="text-text mb-1 text-2xl font-medium">Welcome to Huginn!</div>
            <div className="text-text opacity-70">We are very happy to have you here!</div>
         </div>
         <div className="mt-5 flex w-full gap-x-2">
            <HuginnButton
               onClick={() => startOAuth("google")}
               type="button"
               innerClassName="flex items-center justify-center gap-x-2"
               className="border-primary-700 bg-surface-alt text-text w-full rounded-lg border-2 py-2 transition-all hover:shadow-lg"
            >
               <IconLogosGoogleIcon className="size-5" />
               <span>Google</span>
            </HuginnButton>
            <HuginnButton
               type="button"
               innerClassName="flex items-center justify-center gap-x-2"
               className="border-primary-700 bg-surface-alt text-text w-full rounded-lg border-2 py-2 transition-all hover:shadow-lg"
            >
               <IconLogosGithubIcon className="size-5 text-white [&>path]:fill-white" />
               <span>GitHub</span>
            </HuginnButton>
         </div>
         <div className="border-t-text/25 text-text/70 my-7 flex h-0 w-full select-none items-center justify-center border-t text-center text-xs font-semibold">
            <span className="bg-surface px-2">or</span>
         </div>
         <div className="w-full">
            <div className="flex items-end justify-center gap-x-2">
               <HuginnInput onFocusChanged={onFocusChanged} {...inputsProps.username} className="w-1/2">
                  <HuginnInput.Label text="Username" className="mb-2" />
                  <HuginnInput.Wrapper border="left">
                     <HuginnInput.Input className="lowercase" />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               <HuginnInput {...inputsProps.displayName} className="w-1/2">
                  <HuginnInput.Label text="Display Name" className="mb-2" />
                  <HuginnInput.Wrapper border="left">
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            </div>
            <AnimatedMessage className="mt-1" {...usernameMessageDetail} />

            <HuginnInput className="mb-5 mt-5" {...inputsProps.email}>
               <HuginnInput.Label text="Email" className="mb-2" />
               <HuginnInput.Wrapper border="left">
                  <HuginnInput.Input />
               </HuginnInput.Wrapper>
            </HuginnInput>

            <PasswordInput className="mb-5" {...inputsProps.password}>
               <HuginnInput.Label text="Password" className="mb-2" />
               <HuginnInput.Wrapper border="left">
                  <HuginnInput.Input />
                  <PasswordInput.ToggleButton />
               </HuginnInput.Wrapper>
            </PasswordInput>

            <LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-10 w-full" color="primary" type="submit">
               Register
            </LoadingButton>

            <div className="mt-3 flex select-none items-center">
               <span className="text-text text-sm opacity-70">Already have an account? </span>
               <LinkButton viewTransition to="/login" className="ml-1 text-sm">
                  Login
               </LinkButton>
            </div>
         </div>
      </StartWrapper>
   );
}
