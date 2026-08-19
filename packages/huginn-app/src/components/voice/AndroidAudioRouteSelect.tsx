import HuginnSelect from "@components/dropdown/HuginnSelect";
import { useCapacitorListener } from "@hooks/useCapacitorListener";
import { NativeMediaDevices, type AndroidAudioRouteState } from "@lib/capacitor/media-devices-plugin";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useMemo, useState } from "react";

import type { SelectItem } from "@/types";

const defaultAndroidRouteState: AndroidAudioRouteState = {
   routes: [],
   activeRouteId: null,
   selectedRouteId: null,
   communicationStarted: false,
   supportsIndividualRoutes: false,
};

export default function AndroidAudioRouteSelect(props: { compact?: boolean; className?: string }) {
   const { environment } = useHuginnWindow();
   const [routeState, setRouteState] = useState(defaultAndroidRouteState);
   const routeOptions = useMemo<SelectItem[]>(() => routeState.routes.map((route) => ({ text: route.name, value: route.id })), [routeState.routes]);
   const selectedRoute = routeOptions.find((route) => route.value === routeState.selectedRouteId);

   useEffect(() => {
      if (environment !== "android") return;

      let cancelled = false;
      void NativeMediaDevices.getAudioRoutes()
         .then((state) => {
            if (!cancelled) setRouteState(state);
         })
         .catch((error: unknown) => {
            if (!cancelled) console.error(error);
         });

      return () => {
         cancelled = true;
      };
   }, [environment]);

   useCapacitorListener(() => NativeMediaDevices.addListener("audioRoutesChanged", setRouteState), []);
   useCapacitorListener(() => NativeMediaDevices.addListener("audioRouteChanged", setRouteState), []);

   useEffect(() => {
      if (environment !== "android" || !routeState.selectedRouteId || routeState.activeRouteId === routeState.selectedRouteId) return;

      let cancelled = false;
      void NativeMediaDevices.setAudioRoute({ routeId: routeState.selectedRouteId })
         .then((state) => {
            if (!cancelled) setRouteState(state);
         })
         .catch((error: unknown) => {
            if (!cancelled) console.error(error);
         });

      return () => {
         cancelled = true;
      };
   }, [environment, routeState.activeRouteId, routeState.selectedRouteId]);

   function handleRouteChange(route: SelectItem) {
      void NativeMediaDevices.setAudioRoute({ routeId: route.value }).then(setRouteState).catch(console.error);
   }

   if (environment !== "android") return null;

   return (
      <HuginnSelect
         className={props.compact ? `size-10 ${props.className ?? ""}` : `w-full ${props.className ?? ""}`}
         onChange={handleRouteChange}
         selected={selectedRoute}
      >
         {!props.compact && <HuginnSelect.Label>Audio Route</HuginnSelect.Label>}
         <HuginnSelect.List
            ariaLabel={props.compact ? "Select audio route" : undefined}
            className={props.compact ? "size-10! rounded-full! shadow-lg" : "w-full!"}
            hideArrow={props.compact}
            hideValue={props.compact}
            placeholder="Loading audio routes..."
            startIcon={props.compact ? <IconMingcuteSpeakerFill className="size-6" /> : undefined}
            triggerClassName={props.compact ? "h-full justify-center p-0! text-white/70 active:text-white" : undefined}
         >
            <HuginnSelect.ItemsWrapper>
               {routeOptions.map((route) => (
                  <HuginnSelect.Item key={route.value} item={route} />
               ))}
            </HuginnSelect.ItemsWrapper>
         </HuginnSelect.List>
      </HuginnSelect>
   );
}
