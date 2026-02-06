import HuginnButton from "@components/button/HuginnButton";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@stores/startBackgroundStore";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInitializeClient } from "@hooks/useInitializeClient";
import { useOAuth } from "@hooks/useOAuth";
import type { APIPostLoginJSONBody, OAuthType } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useNavigate } from "react-router";
// import { usePostHog } from "posthog-js/react";

type Inputs = {
   login: string;
   password: string;
};

export default function Login() {
   const posthog = usePostHog();
   const client = useClient();
   const initializeClient = useInitializeClient();
   const startBackground = useStartBackground();
   const startOAuth = useOAuth();
   const navigate = useNavigate();

   const { register, handleSubmit, handleErrors, formState } = useHuginnForm<Inputs>();

   const mutation = useHuginnMutation(
      {
         async mutationFn(credentials: APIPostLoginJSONBody) {
            await client?.login({
               username: credentials.username,
               email: credentials.email,
               password: credentials.password,
            });
         },
         async onSuccess() {
            await initializeClient({
               navigatePath: {
                  pathname: "/channels/@me",
               },
            });
         },
      },
      handleErrors,
   );

   useEffect(() => {
      startBackground.setState(0);
   }, []);

   async function login(data: Inputs) {
      posthog.capture("login:login_button_click");

      await mutation.mutateAsync({
         username: data.login,
         email: data.login,
         password: data.password,
      });
   }

   async function handleOAuth(type: OAuthType) {
      const result = await startOAuth(type);
      let search: URLSearchParams;

      if (result?.access_token && result.refresh_token) {
         search = new URLSearchParams({ access_token: result.access_token, refresh_token: result.refresh_token });
      } else if (result?.oauth_token) {
         search = new URLSearchParams({ oauth_token: result.oauth_token });
      }

      // console.log(search, result);

      await navigate(`/oauth-redirect?${search!.toString()}`, { viewTransition: true });
   }

   return (
      <StartWrapper onSubmit={handleSubmit(login)} transitionName="start-login">
         <div className="flex w-full flex-col items-center select-none">
            <div className="text-text mb-1 text-2xl font-medium">Welcome back!</div>
            <div className="text-text/70">It's very good to see you again!</div>
         </div>
         <div className="mt-5 flex w-full gap-x-2">
            <HuginnButton
               onClick={() => handleOAuth("google")}
               type="button"
               className="border-primary-700 text-text flex w-full items-center justify-center gap-x-2 rounded-lg border-2 py-2 transition-all hover:shadow-lg"
               color="surface-alt"
            >
               <IconLogosGoogleIcon className="size-5" />
               <span>Google</span>
            </HuginnButton>
            <HuginnButton
               type="button"
               className="border-primary-700 text-text flex w-full items-center justify-center gap-x-2 rounded-lg border-2 py-2 transition-all hover:shadow-lg"
               color="surface-alt"
            >
               <IconLogosGithubIcon className="size-5 text-white [&>path]:fill-white" />
               <span>GitHub</span>
            </HuginnButton>
         </div>
         <div className="border-t-text/25 text-text/70 my-7 flex h-0 w-full items-center justify-center border-t text-center text-xs font-semibold select-none">
            <span className="bg-surface px-2">or</span>
         </div>
         <div className="w-full">
            <HuginnInput className="mb-5" {...register("login", { required: true })}>
               <HuginnInput.Label>Email or Username</HuginnInput.Label>
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

            {/* <LinkButton className="mt-1 mb-5 text-sm">Forgot your password?</LinkButton> */}

            <LoadingButton isLoading={formState.isSubmitting} className="mt-5 h-10 w-full" color="primary" type="submit">
               Login
            </LoadingButton>

            <div className="mt-3 flex items-center select-none">
               <span className="text-text text-sm opacity-70"> Don't have an account? </span>
               <LinkButton to="/register" className="ml-1 text-sm" viewTransition>
                  Register
               </LinkButton>
            </div>
         </div>
      </StartWrapper>
   );
}
