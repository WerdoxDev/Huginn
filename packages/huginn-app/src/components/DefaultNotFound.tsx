import { useRouter } from "@tanstack/react-router";

export default function DefaultNotFound() {
   const router = useRouter();

   return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-1 bg-secondary text-xl text-error">
         Oooops, Page not Found (404)
         <span>{router.state.location.pathname}</span>
      </div>
   );
}
