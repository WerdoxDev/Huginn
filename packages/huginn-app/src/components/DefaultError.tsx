import { ErrorComponentProps, useRouter } from "@tanstack/react-router";

export default function DefaultError(props: ErrorComponentProps) {
   const router = useRouter();

   return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-1 bg-secondary text-xl text-error">
         Ooops, There was a problem rendering this page!
         <span>{router.state.location.pathname}</span>
         <span>{props.info?.componentStack}</span>
      </div>
   );
}
