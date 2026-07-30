import type { APIPostOAuthConfirmJSONBody, OAuthTokenPayload } from "@huginnjs/shared";

import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ImagePicker from "@components/ImagePicker";
import HuginnInput from "@components/input/HuginnInput";
import StartWrapper from "@components/StartWrapper";
import { useFileDialog } from "@hooks/useFileDialog";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInitializeClient } from "@hooks/useInitializeClient";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import { listenEvent } from "@lib/event-handler";
import { getUserAvatarOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import * as jose from "jose";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

type Inputs = {
   username: string;
   displayName?: string;
};

const searchSchema = z.object({
   oauth_token: z.optional(z.string()),
   access_token: z.optional(z.string()),
   refresh_token: z.optional(z.string()),
});

export const Route = createFileRoute("/_app/_start/oauth-redirect")({
   component: OAuthRedirectComponent,
   validateSearch: searchSchema,
});

function OAuthRedirectComponent() {
   const client = useClient();
   const search = useSearch({ from: "/_app/_start/oauth-redirect" });
   const navigate = useNavigate();
   const { updateModals } = useModals();
   const initializeClient = useInitializeClient();
   const { openFileDialog } = useFileDialog("image");
   const posthog = usePostHog();
   const router = useRouter();

   const decodedToken = useMemo(() => (search.oauth_token ? (jose.decodeJwt(search.oauth_token) as OAuthTokenPayload) : undefined), [search]);

   const { register, handleErrors, handleSubmit, formState, control } = useHuginnForm<Inputs>();

   const [shouldRender, setShouldRender] = useState(false);
   const { data: originalAvatar } = useQuery(getUserAvatarOptions(decodedToken?.providerUserId, decodedToken?.avatarHash, 128, client));
   const [avatarData, setAvatarData] = useState<string | null>(null);
   const { validate } = useUniqueUsernameMessage(control);

   const mutation = useHuginnMutation(
      {
         async mutationFn(body: APIPostOAuthConfirmJSONBody) {
            if (search.oauth_token) {
               return await client?.oauth.confirmOAuth(body, search.oauth_token ?? "");
            }
         },
         async onSuccess(data) {
            await initializeClient({
               token: data?.token,
               refreshToken: data?.refreshToken,
               navigatePath: "/channels/@me",
            });
         },
      },
      handleErrors,
   );

   useEffect(() => {
      async function tryAuthorize() {
         if (!search.access_token && !search.refresh_token && !search.oauth_token) {
            await navigate({ to: "/" });
            return;
         }

         if (search.access_token && search.refresh_token) {
            localStorage.setItem("access-token", search.access_token);
            localStorage.setItem("refresh-token", search.refresh_token);

            await navigate({ to: "/" });
         } else {
            setShouldRender(true);
         }
      }

      tryAuthorize();
   }, []);

   useEffect(() => {
      if (originalAvatar !== undefined) {
         setAvatarData(originalAvatar);
      }
   }, [originalAvatar]);

   function handleDeleteAvatar() {
      if (avatarData) {
         setAvatarData(null);
      }
   }

   async function handleEditAvatar() {
      const result = await openFileDialog();
      if (!result) return;

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            cropType: "avatar",
            callback: (data) => {
               setAvatarData(data);
               updateModals({ imageCrop: { isOpen: false } });
            },
         },
      });
   }

   async function abort() {
      posthog.capture("oauth:abort_button_click");
      if (router.history.canGoBack()) {
         router.history.back();
      } else {
         await navigate({ to: "/", viewTransition: true });
      }
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
            {search.oauth_token && (
               <>
                  <div className="flex w-full flex-col items-center select-none">
                     <div className="text-text mb-1 text-2xl font-medium">Almost there!</div>
                     <div className="text-text text-center opacity-70">Finish creating your account and enjoy Huginn!</div>
                  </div>
                  <div className="absolute inset-y-0 -left-40 flex items-center">
                     <div className="bg-surface h-max rounded-lg p-5 group-hover/wrapper:shadow-2xl">
                        <ImagePicker data={avatarData} editButtonColor="surface-alt" onDelete={handleDeleteAvatar} onEdit={handleEditAvatar} />
                     </div>
                     {/* <ImageSelector
                        data={avatarData}
                        onDelete={onDelete}
                        onSelected={onSelected}
                        size="7.5rem"
                        className="bg-surface! shadow-xl transition-shadow group-hover/wrapper:shadow-2xl"
                        editButtonClassName="bg-surface-alt"
                     /> */}
                  </div>
                  <div className="mt-5 flex w-full flex-col">
                     <HuginnInput {...register("username", { required: true, validate })} className="mb-5">
                        <HuginnInput.Label>Username</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input lowercase />
                        </HuginnInput.Wrapper>
                     </HuginnInput>

                     <HuginnInput placeholder={decodedToken?.username} {...register("displayName")}>
                        <HuginnInput.Label>Display Name</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                        </HuginnInput.Wrapper>
                     </HuginnInput>
                  </div>
                  <div className="mt-5 flex w-full gap-x-2">
                     <HuginnButton className="w-full" color="surface-alt" onClick={abort} type="button">
                        Abort
                     </HuginnButton>
                     <LoadingButton isLoading={formState.isSubmitting} className="h-10 w-full" color="primary" type="submit">
                        Confirm
                     </LoadingButton>
                  </div>
               </>
            )}
         </StartWrapper>
      )
   );
}
