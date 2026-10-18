import type { MouseEvent } from "react";

import { useSidebarStore } from "@stores/sidebarStore";

import TopBarButton from "./TopBarButton";

export default function MobileMenuButton() {
   const { openLeft, closeRight } = useSidebarStore();

   function handleClick(e: MouseEvent) {
      e.stopPropagation();
      openLeft();
      closeRight();
   }

   return (
      <TopBarButton className="mr-3" onClick={handleClick}>
         <IconMingcuteMenuFill className="size-topbar-icon" />
      </TopBarButton>
   );
}
