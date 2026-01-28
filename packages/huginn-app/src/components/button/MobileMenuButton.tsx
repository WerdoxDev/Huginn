import { useMobileMenuStore } from "@stores/mobileMenuStore";
import type { MouseEvent } from "react";
import TopBarButton from "./TopBarButton";

export default function MobileMenuButton() {
   const { openLeft, closeRight } = useMobileMenuStore();

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
