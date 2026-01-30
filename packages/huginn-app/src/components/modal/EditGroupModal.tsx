import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import ImageSelector from "@components/ImageSelector";
import HuginnInput from "@components/input/HuginnInput";
import { Description, DialogTitle } from "@headlessui/react";
import { usePatchDMChannel } from "@hooks/mutations/usePatchDMChannel";
import { listenEvent } from "@lib/event-handler";
import { getChannelIconOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import BaseDialogPanel from "./BaseDialogPanel";
import { useHuginnForm } from "@hooks/useHuginnForm";

type Input = {
   name?: string;
};

export default function EditGroupModal() {
   const client = useClient();
   const { editGroup: modal, updateModals } = useModals();

   const { setValue, handleErrors, register, handleSubmit } = useHuginnForm<Input>();

   const { data: originalIcon } = useQuery(getChannelIconOptions(modal.channel?.id, modal.channel?.icon, client));
   const mutation = usePatchDMChannel(handleErrors);

   const [iconData, setIconData] = useState<string | null | undefined>();

   useEffect(() => {
      if (!modal.channel?.name) {
         return;
      }

      setValue("name", modal.channel.name);
      setIconData(originalIcon);
   }, [modal]);

   useEffect(() => {
      const unlisten = listenEvent("image_cropper_done", (e) => {
         setIconData(e.croppedImageData);
      });

      return () => {
         unlisten();
      };
   }, []);

   function onSelected(data: string, mimeType: string) {
      updateModals({ imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType } });
   }

   function onDelete() {
      if (iconData) {
         setIconData(null);
      }
   }

   async function edit(data: Input) {
      if (!modal.channel) return;

      await mutation.mutateAsync({
         channelId: modal.channel.id,
         name: modal.channel.name === data?.name ? undefined : data.name,
         icon: originalIcon && !iconData ? null : originalIcon === iconData ? undefined : iconData,
      });
      updateModals({ editGroup: { isOpen: false, channel: undefined } });
   }

   function close() {
      updateModals({ editGroup: { channel: undefined, isOpen: false } });
   }

   return (
      <BaseDialogPanel className="max-w-lg">
         <form onSubmit={handleSubmit(edit)}>
            <DialogTitle className="mt-5 flex items-center justify-center gap-x-1.5">
               <div className="text-text text-2xl font-medium">Edit Group</div>
            </DialogTitle>
            <Description className="text-text/70 mx-5 mt-1 text-center">Modify this group to exactly fit your needs!</Description>
            <div className="flex gap-x-5 p-5">
               <ImageSelector data={iconData} onSelected={onSelected} onDelete={onDelete} />
               <HuginnInput {...register("name")} className="mt-2 w-full" placeholder={modal.channel?.name}>
                  <HuginnInput.Label>Group Name</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            </div>
            <div className="bg-surface-alt flex w-full items-center justify-end gap-x-2 p-5">
               <HuginnButton className="h-10 w-20 decoration-white hover:underline" onClick={close} type="button">
                  Cancel
               </HuginnButton>
               <LoadingButton loading={mutation.isPending} className="h-10 w-36" color="primary" type="submit">
                  Save
               </LoadingButton>
            </div>
            <ModalCloseButton onClick={close} />
         </form>
      </BaseDialogPanel>
   );
}
