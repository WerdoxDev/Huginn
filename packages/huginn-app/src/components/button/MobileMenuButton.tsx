import { useMobileMenuStore } from "@stores/mobileMenuStore";
import clsx from "clsx";

export default function MobileMenuButton(props: { className?: string }) {
   const { openLeft } = useMobileMenuStore();

   return (
      <button className={clsx("cursor-pointer lg:hidden", props.className)} onClick={openLeft}>
         <IconMingcuteMenuFill className="size-7 text-white" />
      </button>
   );
}
