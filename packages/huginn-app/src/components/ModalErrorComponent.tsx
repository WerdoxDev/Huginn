import { useErrorHandler } from "@hooks/useErrorHandler";
import { useModals } from "@stores/modalsStore";
import { useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

export default function ModalErrorComponent(props: { error: unknown }) {
   const { resetBoundary } = useErrorBoundary();
   const { updateModals } = useModals();
   const handleError = useErrorHandler({
      cancel: {
         callback: () => {
            updateModals({
               info: { isOpen: false },
               addRecipient: { isOpen: false },
               settings: { isOpen: false },
               createDM: { isOpen: false },
               editGroup: { isOpen: false },
               imageCrop: { isOpen: false },
               userProfile: { isOpen: false },
               changeDisplayName: { isOpen: false },
               changeEmail: { isOpen: false },
               changePassword: { isOpen: false },
               changeUsername: { isOpen: false },
               magnifiedImage: { isOpen: false },
               news: { isOpen: false },
               screenShare: { isOpen: false },
               streamAudio: { isOpen: false },
            });
            console.log("Error modal closed");
            resetBoundary();
         },
      },
   });

   useEffect(() => {
      handleError(props.error);
   }, []);

   return null;
}
