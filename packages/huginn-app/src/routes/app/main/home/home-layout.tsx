import GuildsBar from "@components/GuildsBar";
import HomeSidebar from "@components/HomeSidebar";
import UserInfo from "@components/UserInfo";
import { useMobileMenuStore } from "@stores/mobileMenuStore";
import { getChannelsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet } from "react-router";
import { ChannelType } from "@huginn/shared";
import RecipientsSidebar from "@components/channels/RecipientsSidebar";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useIsMobile } from "@hooks/useIsMobile";

export default function HomeLayout() {
   const client = useClient();
   const { data } = useSuspenseQuery(getChannelsOptions(client!, "@me"));
   const channel = useCurrentChannel();
   // const channel = data?.find((x: { id: string }) => x.id === channelId);

   const { user } = useThisUser();
   const { currentPanel, setCurrentPanel, leftOffset, rightOffset, setLeftOffset, setRightOffset, leftMenuWidth, rightMenuWidth, resetToCenter } =
      useMobileMenuStore();

   const isMobile = useIsMobile();
   const [isDragging, setIsDragging] = useState(false);
   const [startX, setStartX] = useState(0);
   const [startY, setStartY] = useState(0);
   const hasRightPanel = useMemo(() => channel?.type === ChannelType.GROUP_DM && channel?.ownerId, [channel]);

   const containerRef = useRef<HTMLDivElement | null>(null);
   const threshold = 50;

   useEffect(() => {
      if (currentPanel === "right" && !hasRightPanel) {
         setRightOffset(0);
         setCurrentPanel("center");
      }
   }, [hasRightPanel]);

   function handleTouchStart(e: TouchEvent) {
      if (!isMobile) return;
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
   }

   function handleTouchMove(e: TouchEvent) {
      if (!isDragging || !isMobile) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      if (Math.abs(diffY) > Math.abs(diffX) && (currentPanel === "left" || leftOffset === 0) && (currentPanel === "right" || rightOffset === 0)) {
         setIsDragging(false);
         return;
      }

      if (currentPanel === "center") {
         if (diffX > 0) {
            setLeftOffset(Math.min(diffX, leftMenuWidth));
            setRightOffset(0);
         } else if (diffX < 0) {
            if (hasRightPanel) setRightOffset(Math.min(Math.abs(diffX), rightMenuWidth));
            setLeftOffset(0);
         }
      } else if (currentPanel === "left") {
         const newOffset = leftMenuWidth + diffX;
         setLeftOffset(Math.max(0, Math.min(newOffset, leftMenuWidth)));
      } else if (currentPanel === "right" && hasRightPanel) {
         const newOffset = rightMenuWidth - diffX;
         setRightOffset(Math.max(0, Math.min(newOffset, rightMenuWidth)));
      }
   }

   function handleTouchEnd() {
      if (!isMobile) return;
      setIsDragging(false);

      if (currentPanel === "center") {
         if (leftOffset > threshold) {
            setLeftOffset(leftMenuWidth);
            setCurrentPanel("left");
         } else if (rightOffset > threshold && hasRightPanel) {
            setRightOffset(rightMenuWidth);
            setCurrentPanel("right");
         } else {
            setLeftOffset(0);
            setRightOffset(0);
         }
      } else if (currentPanel === "left") {
         if (leftOffset < leftMenuWidth - threshold) {
            setLeftOffset(0);
            setCurrentPanel("center");
         } else {
            setLeftOffset(leftMenuWidth);
         }
      } else if (currentPanel === "right" && hasRightPanel) {
         if (rightOffset < rightMenuWidth - threshold) {
            setRightOffset(0);
            setCurrentPanel("center");
         } else {
            setRightOffset(rightMenuWidth);
         }
      }
   }

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
               "absolute inset-0 z-10 bg-black/50 transition-all lg:pointer-events-none lg:z-auto lg:opacity-0",
               currentPanel !== "center" ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={resetToCenter}
         />

         <div
            className={clsx(
               "fixed top-6 bottom-0 z-20 flex lg:relative lg:top-0 lg:bottom-0 lg:z-auto lg:h-full",
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
            className={clsx("bg-surface-deep relative w-full overflow-hidden", !isDragging && "transition-transform")}
            style={{ transform: isMobile ? `translateX(${leftOffset - rightOffset}px)` : "none" }}
         >
            <Outlet />
         </div>
         {hasRightPanel && (
            <div
               className={clsx(
                  "border-surface fixed top-6 right-0 bottom-0 z-20 shrink-0 border-l-2 bg-white lg:relative lg:top-0 lg:bottom-0 lg:h-full",
                  isMobile && !isDragging && "transition-transform",
                  !isMobile && "transition-[width]",
                  // isRightOpen ? "translate-x-0 lg:w-56" : "translate-x-full lg:w-0",
               )}
               style={{
                  width: isMobile ? rightMenuWidth : currentPanel === "right" ? rightMenuWidth : 0,
                  // transition: "width 5s",
                  transform: isMobile ? `translateX(${rightMenuWidth - rightOffset}px)` : "none",
               }}
            >
               <div className="absolute inset-0" style={{ width: rightMenuWidth }}>
                  <RecipientsSidebar channelId={channel!.id} recipientIds={channel!.recipientIds} ownerId={channel!.ownerId!} />
               </div>
            </div>
         )}
      </div>
   );
}
