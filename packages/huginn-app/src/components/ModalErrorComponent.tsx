import { Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerErrorHandler } from "@hooks/useServerErrorHandler";

export default function ModalErrorComponent(props: { error: unknown }) {
   const handleServerError = useServerErrorHandler();
   const router = useRouter();

   useEffect(() => {
      handleServerError(props.error);
      router.history.go(-1);
   }, []);

   return <Outlet />;
}
