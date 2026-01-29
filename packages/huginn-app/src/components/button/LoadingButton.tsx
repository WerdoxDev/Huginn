import { omit } from "@huginn/shared";
import clsx from "clsx";
import type { HuginnLoadingButtonProps } from "@/types";
import HuginnButton from "./HuginnButton";

export default function LoadingButton(props: HuginnLoadingButtonProps) {
   return (
      <HuginnButton
         className={clsx("flex items-center justify-center", props.className)}
         disabled={props.loading || props.disabled}
         {...omit(props, ["disabled", "className"])}
      >
         {props.loading ? (
            <IconMingcuteLoading3Fill className={clsx("text-text size-7 animate-spin", props.iconClassName)} />
         ) : (
            <div>{props.children}</div>
         )}
      </HuginnButton>
   );
}
