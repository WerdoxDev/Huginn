import LoadingButton from "@components/button/LoadingButton";
import clsx from "clsx";
import type { HuginnButtonProps, HuginnInputProps, HuginnLoadingButtonProps } from "@/types";
import HuginnInput from "./HuginnInput";

export default function AddFriendInput(props: {
   className?: string;
   onClick?: () => void;
   disabled?: boolean;
   buttonProps?: HuginnButtonProps;
   inputProps: HuginnInputProps;
   loading: boolean;
}) {
   return (
      <HuginnInput {...props.inputProps} className={clsx(props.inputProps.className, "w-full", props.className)} placeholder="e.g: Werdox">
         <HuginnInput.Wrapper className="gap-x-5 rounded-lg! px-3 pl-5">
            <HuginnInput.Input className="px-0 py-5" />
            <LoadingButton
               {...props.buttonProps}
               iconClassName="size-6!"
               loading={props.loading}
               className="h-10 w-44 shrink-0 rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap"
               color="primary"
               disabled={props.disabled}
               onClick={() => props.onClick?.()}
            >
               Send Friend Request
            </LoadingButton>
         </HuginnInput.Wrapper>
      </HuginnInput>
   );
}
