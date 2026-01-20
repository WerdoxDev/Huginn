import AnimatedMessage from "@components/StatusMessage";
import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ImageSelector from "@components/ImageSelector";
import HuginnInput from "@components/input/HuginnInput";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@stores/startBackgroundStore";
import { useHistory } from "@contexts/HistoryContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInitializeClient } from "@hooks/useInitializeClient";
import { useInputs } from "@hooks/useInputs";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import type { APIPostOAuthConfirmJSONBody, OAuthTokenPayload } from "@huginn/shared";
import { listenEvent } from "@lib/event-handler";
import { getUserAvatarOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import * as jose from "jose";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useHuginnForm } from "@hooks/useHuginnForm";

type Inputs = {
   username: string;
   displayName?: string;
};

export default function OauthRedirect() {
   const client = useClient();
   const [search] = useSearchParams();
   const navigate = useNavigate();
   const authBackground = useStartBackground();
   const { updateModals } = useModals();
   const initializeClient = useInitializeClient();
   const posthog = usePostHog();
   const history = useHistory();

   const decodedToken = useMemo(() => (search.get("token") ? (jose.decodeJwt(search.get("token") ?? "") as OAuthTokenPayload) : undefined), [search]);

   const { register, handleErrors, handleSubmit, formState } = useHuginnForm<Inputs>();
   // const { inputsProps, values, handleErrors, resetInput } = useInputs([
   //    { name: "username", required: true, default: decodedToken?.username },
   //    { name: "displayName", required: false, default: decodedToken?.fullName },
   // ]);

   const [shouldRender, setShouldRender] = useState(false);
   const { data: originalAvatar } = useQuery(getUserAvatarOptions(decodedToken?.providerUserId, decodedToken?.avatarHash, client));
   const [avatarData, setAvatarData] = useState<string | null>(null);
   const { validate } = useUniqueUsernameMessage();

   const mutation = useHuginnMutation(
      {
         async mutationFn(body: APIPostOAuthConfirmJSONBody) {
            if (search.get("token")) {
               return await client?.oauth.confirmOAuth(body, search.get("token") ?? "");
            }
         },
         async onSuccess(data) {
            await initializeClient({ token: data?.token, refreshToken: data?.refreshToken, navigatePath: "/channels/@me" });
         },
      },
      handleErrors,
   );

   useEffect(() => {
      async function tryAuthorize() {
         if (search.has("access_token") || search.has("refresh_token")) {
            localStorage.setItem("access-token", search.get("access_token") ?? "");
            localStorage.setItem("refresh-token", search.get("refresh_token") ?? "");

            console.log("YES");
            await navigate("/");
         } else {
            setShouldRender(true);
            authBackground.setState(0);
         }
      }

      const unlisten = listenEvent("image_cropper_done", (e) => {
         setAvatarData(e.croppedImageData);
      });

      updateModals({ info: { isOpen: false } });
      tryAuthorize();

      return () => {
         unlisten();
      };
   }, []);

   useEffect(() => {
      if (originalAvatar !== undefined) {
         setAvatarData(originalAvatar);
      }
   }, [originalAvatar]);

   function onDelete() {
      if (avatarData) {
         setAvatarData(null);
      }
   }

   function onSelected(data: string, mimeType: string) {
      updateModals({
         imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType },
      });
   }

   async function abort() {
      posthog.capture("oauth:abort_button_click");
      await navigate(history.lastPathname ?? "/", { viewTransition: true });
   }

   async function onSubmit(data: Inputs) {
      posthog.capture("oauth:confirm_button_click");

      await mutation.mutateAsync({
         avatar: avatarData,
         displayName: data.displayName ?? null,
         username: data.username,
      });
   }

   return (
      shouldRender && (
         <StartWrapper transitionName="start-oauth-redirect" onSubmit={handleSubmit(onSubmit)}>
            {search.has("token") && (
               <>
                  <div className="flex w-full flex-col items-center select-none">
                     <div className="text-text mb-1 text-2xl font-medium">Almost there!</div>
                     <div className="text-text text-center opacity-70">Finish creating your account and enjoy Huginn!</div>
                  </div>
                  <div className="absolute inset-y-0 -left-40 flex items-center">
                     <ImageSelector
                        data={avatarData}
                        onDelete={onDelete}
                        onSelected={onSelected}
                        size="7.5rem"
                        className="bg-surface! shadow-xl transition-shadow group-hover/wrapper:shadow-2xl"
                        editButtonClassName="bg-surface-alt"
                     />
                  </div>
                  <div className="mt-5 flex w-full flex-col">
                     <HuginnInput {...register("username", { required: true, validate })} className="mb-5">
                        <HuginnInput.Label text="Username" className="mb-2" />
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input lowercase />
                        </HuginnInput.Wrapper>
                     </HuginnInput>

                     <HuginnInput placeholder={decodedToken?.username} {...register("displayName")}>
                        <HuginnInput.Label text="Display Name" className="mb-2" />
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                        </HuginnInput.Wrapper>
                     </HuginnInput>
                  </div>
                  <div className="mt-5 flex w-full gap-x-2">
                     <HuginnButton className="w-full" color="surface-alt" onClick={abort} type="button">
                        Abort
                     </HuginnButton>
                     <LoadingButton loading={formState.isSubmitting} className="h-10 w-full" color="primary" type="submit">
                        Confirm
                     </LoadingButton>
                  </div>
               </>
            )}
         </StartWrapper>
      )
   );
}
