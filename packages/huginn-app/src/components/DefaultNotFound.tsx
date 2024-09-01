import { useRouter } from "@tanstack/react-router";

export default function DefaultNotFound() {
   const router = useRouter();

   return (
      <div className="bg-secondary text-error flex h-full w-full flex-col items-center justify-center gap-y-1 text-xl">
         Oooops, Page not Found (404)
         <span>{router.state.location.pathname}</span>
      </div>
   );
}
