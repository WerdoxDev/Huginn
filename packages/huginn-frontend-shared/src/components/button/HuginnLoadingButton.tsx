import clsx from "clsx";

import HuginnLoadingIcon from "../HuginnLoadingIcon";
import HuginnButton, { type HuginnButtonProps } from "./HuginnButton";

export type HuginnLoadingButtonProps = HuginnButtonProps & {
   isLoading: boolean;
   iconClassName?: string;
   loadingLabel?: string;
};

export default function HuginnLoadingButton({ children, className, disabled, iconClassName, isLoading, loadingLabel, ...props }: HuginnLoadingButtonProps) {
   return (
      <HuginnButton {...props} className={clsx("flex items-center justify-center", className)} disabled={isLoading || disabled} aria-busy={isLoading}>
         {isLoading ? (
            <>
               <HuginnLoadingIcon className={clsx("size-7", iconClassName)} />
               {loadingLabel ? <span>{loadingLabel}</span> : null}
            </>
         ) : (
            children
         )}
      </HuginnButton>
   );
}
