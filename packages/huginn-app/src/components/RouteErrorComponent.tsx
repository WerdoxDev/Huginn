import HuginnIcon from "@components/HuginnIcon";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import HuginnButton from "./button/HuginnButton";

export default function RouteErrorComponent(props: { error: unknown }) {
   const router = useRouter();
   const queryErrorResetBoundary = useQueryErrorResetBoundary();

   useEffect(() => {
      queryErrorResetBoundary.reset();
   }, [queryErrorResetBoundary]);

   useEffect(() => {
      console.log(props.error);
   }, [props.error]);

   function retry() {
      router.invalidate();
   }

   function getErrorMessage(error: unknown): string {
      if (error instanceof Error) return error.message + (error.cause ? `: ${error.cause}` : "");
      if (typeof error === "string") return error;
      return "Something went wrong and we don't know what...";
   }

   return (
      <div className="flex h-full flex-col items-center justify-center gap-y-4">
         <HuginnIcon className="duration size-10 animate-[spin_2s_linear_infinite]" outlined />
         <div className="text-text text-center">
            <div className="mb-1 text-sm font-semibold">Oops... :(</div>
            <div className="text-text/70 text-xs">{getErrorMessage(props.error)}</div>
            <HuginnButton color="surface" className="mt-2 px-2 py-1" onClick={retry}>
               retry
            </HuginnButton>
         </div>
      </div>
   );
}
