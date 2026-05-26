import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import ImagePicker from "@components/ImagePicker";
import HuginnInput from "@components/input/HuginnInput";
import { usePatchDMChannel } from "@hooks/mutations/usePatchDMChannel";
import { useFileDialog } from "@hooks/useFileDialog";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { ChannelType } from "@huginn/shared";
import { getChannelIconOptions } from "@lib/queries";
import { getChannelComputedName, getGroupChannelName } from "@lib/query-utils";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";

type Input = {
   name?: string;
};

export default function EditGroupModal() {
   const client = useClient();
   const { editGroup: modal, updateModals } = useModals();

   const { openFileDialog } = useFileDialog("image/*");

   const { setValue, handleErrors, register, handleSubmit } = useHuginnForm<Input>();

   const { data: originalIcon } = useQuery(
      getChannelIconOptions(modal.channel?.id, modal.channel?.type === ChannelType.GROUP_DM ? modal.channel?.icon : undefined, client),
   );

   const placeholder = modal.channel && getGroupChannelName(modal.channel);

   const mutation = usePatchDMChannel(handleErrors);

   const [iconData, setIconData] = useState<string | null | undefined>();

   useEffect(() => {
      if (!modal.channel?.name) {
         return;
      }

      setValue("name", modal.channel.originalName ?? "");
      setIconData(originalIcon);
   }, [modal.channel?.name, originalIcon, setValue]);

   async function handleEditIcon() {
      const result = await openFileDialog();
      if (!result) return;

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            cropType: "avatar",
            callback: (data) => {
               setIconData(data);
               updateModals({ imageCrop: { isOpen: false } });
            },
         },
      });
   }

   function handleDeleteIcon() {
      if (iconData) {
         setIconData(null);
      }
   }

   async function edit(data: Input) {
      if (!modal.channel) return;

      console.log("Submitting edit with data:", data, modal.channel.name);
      await mutation.mutateAsync({
         channelId: modal.channel.id,
         name: data?.name === modal.channel.name ? undefined : !data.name ? null : data.name,
         icon: originalIcon && !iconData ? null : originalIcon === iconData ? undefined : iconData,
      });
      updateModals({ editGroup: { isOpen: false, channel: undefined } });
   }

   function close() {
      updateModals({ editGroup: { channel: undefined, isOpen: false } });
   }

   return (
      <HuginnDialogPanel className="max-w-lg">
         <form onSubmit={handleSubmit(edit)}>
            <DialogBody>
               <HuginnDialogTitle title="Edit Group" />
               <div className="flex gap-x-5">
                  <ImagePicker data={iconData} editButtonColor="surface-alt" onDelete={handleDeleteIcon} onEdit={handleEditIcon} />
                  <HuginnInput {...register("name")} className="mt-2 w-full" placeholder={placeholder}>
                     <HuginnInput.Label>Group Name</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                     </HuginnInput.Wrapper>
                  </HuginnInput>
               </div>
            </DialogBody>
            <DialogActions>
               <HuginnButton className="h-10 w-full" color="surface" onClick={close} type="button">
                  Cancel
               </HuginnButton>
               <LoadingButton isLoading={mutation.isPending} className="h-10 w-full" color="primary" type="submit">
                  Save
               </LoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
