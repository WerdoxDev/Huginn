import HuginnButton from "@components/button/HuginnButton";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import StartWrapper from "@components/StartWrapper";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInitializeClient } from "@hooks/useInitializeClient";
import { useOAuth } from "@hooks/useOAuth";
import type { APIPostRegisterJSONBody, OAuthType } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import { usePostHog } from "posthog-js/react";

type Inputs = {
   email: string;
   displayName?: string;
   username: string;
   password: string;
};

export const Route = createFileRoute("/_app/_start/register")({ component: RegisterComponent });

function RegisterComponent() {
   const client = useClient();
   const posthog = usePostHog();
   const initializeClient = useInitializeClient();
   const startOAuth = useOAuth();
   const navigate = useNavigate();

   const { register, handleErrors, handleSubmit, formState, control } = useHuginnForm<Inputs>();
   const { validate } = useUniqueUsernameMessage(control);

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
      // Component initialization
   }, []);

   async function onSubmit(data: Inputs) {
      posthog.capture("register:register_button_click");

      await mutation.mutateAsync({
         email: data.email,
         displayName: data.displayName ?? null,
         username: data.username,
         password: data.password,
      });
   }

   async function handleOAuth(type: OAuthType) {
      const result = await startOAuth(type);
      let search: URLSearchParams | undefined;

      if (result?.access_token && result.refresh_token) {
         search = new URLSearchParams({ access_token: result.access_token, refresh_token: result.refresh_token });
      } else if (result?.oauth_token) {
         search = new URLSearchParams({ oauth_token: result.oauth_token });
      }

      if (result && search) {
         await navigate({ to: `/oauth-redirect?${search!.toString()}` });
      }
   }

   return (
      <StartWrapper onSubmit={handleSubmit(onSubmit)} transitionName="start-register">
         <div className="flex w-full flex-col items-center select-none">
            <div className="text-text mb-1 text-2xl font-medium">Welcome to Huginn!</div>
            <div className="text-text opacity-70">We are very happy to have you here!</div>
         </div>
         <div className="mt-5 flex w-full gap-x-2">
            <HuginnButton
               onClick={() => handleOAuth("google")}
               type="button"
               className="border-primary-700 bg-surface-alt text-text flex w-full items-center justify-center gap-x-2 rounded-lg border-2 py-2 transition-all hover:shadow-lg"
            >
               <IconLogosGoogleIcon className="size-5" />
               <span>Google</span>
            </HuginnButton>
            <HuginnButton
               type="button"
               className="border-primary-700 bg-surface-alt text-text flex w-full items-center justify-center gap-x-2 rounded-lg border-2 py-2 transition-all hover:shadow-lg"
            >
               <IconLogosGithubIcon className="size-5 text-white [&>path]:fill-white" />
               <span>GitHub</span>
            </HuginnButton>
         </div>
         <div className="border-t-text/25 text-text/70 my-7 flex h-0 w-full items-center justify-center border-t text-center text-xs font-semibold select-none">
            <span className="bg-surface px-2">or</span>
         </div>
         <div className="w-full">
            <div className="mb-5 flex flex-col gap-y-5">
               <div className="flex gap-x-5">
                  <HuginnInput
                     {...register("username", {
                        required: true,
                        validate,
                     })}
                  >
                     <HuginnInput.Label>Username</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input lowercase />
                     </HuginnInput.Wrapper>
                  </HuginnInput>

                  <HuginnInput {...register("displayName")}>
                     <HuginnInput.Label>Display Name</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                     </HuginnInput.Wrapper>
                  </HuginnInput>
               </div>

               <HuginnInput {...register("email", { required: true })}>
                  <HuginnInput.Label>Email</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>

               <PasswordInput {...register("password", { required: true })}>
                  <HuginnInput.Label>Password</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                     <PasswordInput.ToggleButton />
                  </HuginnInput.Wrapper>
               </PasswordInput>
            </div>

            <LoadingButton isLoading={formState.isSubmitting} className="h-10 w-full" color="primary" type="submit">
               Register
            </LoadingButton>

            <div className="mt-3 flex items-center select-none">
               <span className="text-text text-sm opacity-70">Already have an account? </span>
               <LinkButton viewTransition to="/login" className="ml-1 text-sm">
                  Login
               </LinkButton>
            </div>
         </div>
      </StartWrapper>
   );
}
