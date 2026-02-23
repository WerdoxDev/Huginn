import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import { listenEvent } from "@lib/event-handler";
import { getUserAvatarOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { SettingsTabProps } from "@/types";
import HuginnLabel from "@components/HuginnLabel";
import { useHuginnForm } from "@hooks/useHuginnForm";
import HuginnInput from "@components/input/HuginnInput";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { omit, type OAuthType } from "@huginn/shared";
import { useOAuth } from "@hooks/useOAuth";

type Inputs = {
   username: string;
   displayName?: string;
   email: string;
};

type EditingField = "username" | "displayName" | "email" | null;

export default function SettingsProfileTab(_props: SettingsTabProps) {
   const client = useClient();
   const { user, setUser, tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const [editingField, setEditingField] = useState<EditingField>(null);

   const { register, values, setValue, handleErrors, reset } = useHuginnForm<Inputs>({
      defaultValues: { username: user?.username, displayName: user?.originalDisplayName ?? undefined, email: user?.email },
   });

   const startOAuth = useOAuth();

   const { data: originalAvatar } = useQuery(getUserAvatarOptions(user?.id, user?.avatar, client));
   const [avatarData, setAvatarData] = useState<string | null | undefined>(() => originalAvatar);

   // const { validate } = useUniqueUsernameMessage(user?.username);

   const mutation = usePatchUser((result) => {
      if (!client) {
         return;
      }

      setEditingField(null);
   }, handleErrors);

   const [isAvatarModified, setIsAvatarModified] = useState(false);

   useEffect(() => {
      if (originalAvatar) {
         setAvatarData(originalAvatar);
      }
   }, [originalAvatar]);

   useEffect(() => {
      const unlisten = client?.gateway.listen("user_update", (_e) => {
         console.log("CHANGED");
         // setIsModified(false);
         setIsAvatarModified(false);
      });

      const unlisten2 = listenEvent("image_cropper_done", (e) => {
         setAvatarData(e.croppedImageData);
         setIsAvatarModified(true);
      });

      return () => {
         unlisten?.();
         unlisten2();
      };
   }, []);

   function onDelete() {
      if (avatarData) {
         setAvatarData(null);
         setIsAvatarModified(true);
      }
   }

   function onSelected(data: string, mimeType: string) {
      updateModals({ imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType } });
   }

   async function handleEditField(field: EditingField) {
      if (field === "username") updateModals({ changeUsername: { isOpen: true } });
      else if (field === "displayName") updateModals({ changeDisplayName: { isOpen: true } });
      else if (field === "email") updateModals({ changeEmail: { isOpen: true } });
   }

   function handleCancelEdit() {
      revert();
      reset();
   }

   async function handleSave() {
      if (!editingField) return;

      await mutation.mutateAsync({ [editingField]: values[editingField] });
   }

   function revert() {
      if (!user) return;

      // setAvatarData(originalAvatar);
      setEditingField(null);
      setValue("username", user.username!);
      setValue("displayName", user.originalDisplayName!);
      if (tokenPayload?.authType === "password") {
         setValue("email", user.email!);
      }

      setIsAvatarModified(false);
   }

   return (
      <div className="flex items-start gap-x-5">
         {/* <ImageSelector data={avatarData} onDelete={onDelete} onSelected={onSelected} className="p-4" buttonsClassName="mt-4">
               <div className="text-text mb-4 font-semibold">Profile Picture</div>
            </ImageSelector> */}
         <div className="w-full max-w-md">
            <div className="text-text mb-2 text-lg font-semibold">Details</div>
            <div className="bg-surface-alt rounded-lg p-4">
               <div className="flex flex-col">
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Username</HuginnLabel>
                        {/* <div className="text-text/90 text-xs font-medium uppercase select-none">Username</div> */}
                        <div className="text-white">{user?.username}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("username")} />
                  </div>
                  <div className="bg-surface my-4 h-px w-full"></div>
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Display Name</HuginnLabel>
                        <div className="text-white">{user?.displayName}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("displayName")} />
                  </div>
                  <div className="bg-surface my-4 h-px w-full"></div>
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Email</HuginnLabel>
                        <div className="text-white">{user?.email}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("email")} />
                  </div>
                  {/* <HuginnInput {...inputsProps.username} onFocusChanged={onFocusChanged}>
                        <HuginnInput.Label text="Username" className="mb-2" />
                        <HuginnInput.Wrapper className="bg-surface!" border="left">
                           <HuginnInput.Input />
                        </HuginnInput.Wrapper>
                        <AnimatedMessage className="mt-1" {...usernameMessageDetail} />
                     </HuginnInput>

                     <HuginnInput placeholder={user?.username} {...inputsProps.displayName}>
                        <HuginnInput.Label text="Display Name" className="mb-2" />
                        <HuginnInput.Wrapper className="bg-surface!" border="left">
                           <HuginnInput.Input />
                        </HuginnInput.Wrapper>
                     </HuginnInput> */}
               </div>
            </div>
         </div>
         {/* {!tokenPayload?.isOAuth && (
               <div className="flex w-full max-w-xs flex-col gap-y-2">
                  <div className="bg-surface-alt rounded-lg p-4">
                     <div className="text-text mb-4 font-semibold">Security</div>
                     <div className="flex flex-col gap-y-5">
                        <PasswordInput {...inputsProps.password} type="password">
                           <HuginnInput.Label text="Current Password" className="mb-2" />
                           <HuginnInput.Wrapper className="bg-surface!" border="left">
                              <HuginnInput.Input />
                              <PasswordInput.ToggleButton className="border-l-surface-alt" />
                           </HuginnInput.Wrapper>
                        </PasswordInput>
                        <PasswordInput {...inputsProps.newPassword} type="password">
                           <HuginnInput.Label text="New Password" className="mb-2" />
                           <HuginnInput.Wrapper className="bg-surface!" border="left">
                              <HuginnInput.Input />
                              <PasswordInput.ToggleButton className="border-l-surface-alt" />
                           </HuginnInput.Wrapper>
                        </PasswordInput>
                     </div>
                  </div>
               </div>
            )} */}
      </div>
   );
}

function ChangeButton(props: { onClick?: () => void }) {
   return (
      <HuginnButton className="px-3 py-1.5" color="surface" onClick={props.onClick}>
         Change
      </HuginnButton>
   );
}

function EditActions(props: { onSave?: () => void; onCancel?: () => void; isLoading: boolean; saveText?: string }) {
   return (
      <div className="flex h-10 items-center gap-x-2">
         <LoadingButton isLoading={props.isLoading} iconClassName="size-6!" color="primary" className="h-9 w-16" onClick={props.onSave}>
            {props.saveText ?? "Save"}
         </LoadingButton>
         <HuginnButton color="surface" className="h-9 w-20" onClick={props.onCancel}>
            Cancel
         </HuginnButton>
      </div>
   );
}
