import { useEffect } from "react";
import { useServerErrorHandler } from "../hooks/useServerErrorHandler";

export default function ModalErrorComponent(props: { error: unknown }) {
   const handleServerError = useServerErrorHandler();

   useEffect(() => {
      handleServerError(props.error);
   }, []);
}
