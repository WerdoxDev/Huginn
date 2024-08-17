import { useModalsDispatch } from "@contexts/modalContext";
import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

export default function ModalErrorComponent(props: { error: unknown }) {
   const { resetBoundary } = useErrorBoundary();
   const dispatch = useModalsDispatch();
   const handleError = useErrorHandler({
      cancel: {
         callback: () => {
            dispatch({ settings: { isOpen: false }, info: { isOpen: false } });
            resetBoundary();
         },
      },
   });

   const router = useRouter();

   useEffect(() => {
      handleError(props.error);
      router.history.go(-1);
   }, []);

   return null;
}
