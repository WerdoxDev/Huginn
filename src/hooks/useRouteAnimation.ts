import { routeHistory } from "@contexts/historyContext";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function useRouteAnimation(...updateFor: string[]) {
   const router = useRouter();
   const [id, setId] = useState<string>();

   useEffect(() => {
      setId(routeHistory.lastPathname!);
   }, []);

   // useEffect(() => {
   //    const pathname = router.state.location.pathname;
   //    // console.log(`CHANGE ${pathname}`);
   //    console.log(router.state.location.pathname);
   //    setId(updateFor.some((x) => routeHistory.lastPathname?.includes(x)) ? id ?? "" : router.state.location.pathname ?? "");
   // }, [routeHistory.lastPathname]);

   useEffect(() => {
      setId(
         router.state.matches.find((x) => x.id === "/_layoutAnimation/_layoutAuth" || x.id === "/_layoutAnimation/_layoutMain")?.id ??
            "",
      );
   }, [router.state.matches]);

   return { id, updateFor };
}
