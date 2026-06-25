import GuildsBar from "@components/GuildsBar";
import HomeSidebar from "@components/HomeSidebar";
import UserInfo from "@components/UserInfo";
import { useInset } from "@contexts/InsetContext";
import { useBackHandler } from "@hooks/useBackHandler";
import { useIsMobile } from "@hooks/useIsMobile";
import { getChannelsOptions, queryClient } from "@lib/queries";
import { clientStore, useClient } from "@stores/clientStore";
import { useMobileMenuStore } from "@stores/mobileMenuStore";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect, useRef, useState, type TouchEvent } from "react";

export const Route = createFileRoute("/_app/_main/_home")({
   component: HomeLayoutComponent,
   loader: async () => {
      const client = clientStore.getState().client;
      if (!client) return;

      return await queryClient?.ensureQueryData(getChannelsOptions(client, "@me"));
   },
});

function HomeLayoutComponent() {
   const client = useClient();
   const { data } = useSuspenseQuery(getChannelsOptions(client!, "@me"));

   const { user } = useThisUser();
   const {
      isLeftOpen,
      isRightOpen,
      leftOffset,
      openLeft,
      setLeftOffset,
      leftMenuWidth,
      resetToCenter,
      isDragging,
      setIsDragging,
      openRight,
      closeRight,
   } = useMobileMenuStore();
   const { lastNavBarHeight } = useInset();

   const settings = useStorage("settings");

   const isMobile = useIsMobile();
   const [startX, setStartX] = useState(0);
   const [startY, setStartY] = useState(0);

   const containerRef = useRef<HTMLDivElement | null>(null);
   const threshold = 50;

   function handleTouchStart(e: TouchEvent) {
      if (!isMobile) return;
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
   }

   function handleTouchMove(e: TouchEvent) {
      if (!isDragging || !isMobile) return;

      const target = e.target as HTMLElement;
      if (target.closest("[data-ignore-swipe]")) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      if (Math.abs(diffY) > Math.abs(diffX) && (isLeftOpen || leftOffset === 0)) {
         setIsDragging(false);
         return;
      }

      if (!isLeftOpen && !isRightOpen) {
         if (diffX > 0) {
            setLeftOffset(Math.min(diffX, leftMenuWidth));
         } else if (diffX < 0) {
            setLeftOffset(0);
         }
      } else if (isLeftOpen) {
         const newOffset = leftMenuWidth + diffX;
         setLeftOffset(Math.max(0, Math.min(newOffset, leftMenuWidth)));
      }
   }

   function handleTouchEnd() {
      if (!isMobile) return;
      setIsDragging(false);

      if (!isLeftOpen && !isRightOpen) {
         if (leftOffset > threshold) {
            setLeftOffset(leftMenuWidth);
            openLeft();
         } else {
            setLeftOffset(0);
         }
      } else if (isLeftOpen) {
         if (leftOffset < leftMenuWidth - threshold) {
            setLeftOffset(0);
            resetToCenter();
         } else {
            setLeftOffset(leftMenuWidth);
         }
      }
   }

   useEffect(() => {
      if (isMobile || !settings) return;

      if (settings.isChannelSidebarOpen) {
         openRight();
      } else {
         closeRight();
      }
   }, [isMobile, settings?.isChannelSidebarOpen, openRight, closeRight]);

   useBackHandler("left-sidebar", 20, () => {
      if (!isLeftOpen) {
         openLeft();
         return true;
      }
   });

   useBackHandler("right-sidebar", 30, () => {
      if (isRightOpen) {
         closeRight();
         return true;
      }
   });

   return (
      <div
         className="bg-surface relative flex h-full w-full overflow-hidden select-none"
         ref={containerRef}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
      >
         <div
            className={clsx(
               "fixed inset-0 z-10 bg-black/50 transition-all lg:pointer-events-none lg:z-auto lg:opacity-0",
               isLeftOpen ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            style={{ bottom: lastNavBarHeight }}
            onClick={resetToCenter}
         />

         <div
            className={clsx(
               "absolute top-0 bottom-0 z-20 flex lg:relative lg:top-0 lg:bottom-0 lg:z-auto lg:h-full",
               !isDragging && "transition-transform",
            )}
            style={{
               width: leftMenuWidth,
               transform: isMobile ? `translateX(-${leftMenuWidth - leftOffset}px)` : "none",
            }}
         >
            <GuildsBar />
            <div className="bg-surface flex w-64 shrink-0 flex-col">
               <HomeSidebar channels={data} />
               {user && <UserInfo user={user} />}
            </div>
         </div>
         <div
            className={clsx("bg-surface-deep w-full overflow-hidden", !isDragging && "transition-transform")}
            style={{ transform: isMobile ? `translateX(${leftOffset}px)` : "none" }}
         >
            <Outlet />
         </div>
      </div>
   );
}
