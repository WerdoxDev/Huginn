import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import ImageSelector from "@components/ImageSelector";
import HuginnInput from "@components/input/HuginnInput";
import { usePatchDMChannel } from "@hooks/mutations/usePatchDMChannel";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { listenEvent } from "@lib/event-handler";
import { getChannelIconOptions } from "@lib/queries";
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
      <HuginnDialogPanel className="max-w-lg">
         <form onSubmit={handleSubmit(edit)}>
            <DialogBody>
               <HuginnDialogTitle title="Edit Group" />
               <div className="flex gap-x-5">
                  <ImageSelector data={iconData} onSelected={onSelected} onDelete={onDelete} />
                  <HuginnInput {...register("name")} className="mt-2 w-full" placeholder={modal.channel?.name}>
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
