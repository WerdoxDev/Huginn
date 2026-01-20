import { omit } from "@huginn/shared";
import clsx from "clsx";
import type { HuginnButtonProps, HuginnLoadingButtonProps } from "@/types";
import HuginnButton from "./HuginnButton";

export default function LoadingButton(props: HuginnLoadingButtonProps) {
   return (
      <HuginnButton innerClassName="flex items-center justify-center" disabled={props.loading || props.disabled} {...omit(props, ["disabled"])}>
         {props.loading ? (
            <IconMingcuteLoading3Fill className={clsx("text-text size-7 animate-spin", props.iconClassName)} />
         ) : (
            <div>{props.children}</div>
         )}
      </HuginnButton>
   );
}
