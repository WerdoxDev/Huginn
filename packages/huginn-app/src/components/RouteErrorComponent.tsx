import { useErrorHandler } from "@hooks/useErrorHandler";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export default function RouteErrorComponent(props: { error: unknown }) {
   // const error = useRouteError();
   const handleError = useErrorHandler();
   const navigate = useNavigate();

   useEffect(() => {
      console.log(props.error);
      handleError(props.error);
      // navigate({to:".."});
   }, []);

   return <Outlet />;
}
