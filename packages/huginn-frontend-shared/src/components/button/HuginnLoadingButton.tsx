import clsx from "clsx";

import HuginnLoadingIcon from "../HuginnLoadingIcon";
import HuginnButton, { type HuginnButtonProps } from "./HuginnButton";

export type HuginnLoadingButtonProps = HuginnButtonProps & {
   isLoading: boolean;
   iconClassName?: string;
};

export default function HuginnLoadingButton({ children, className, disabled, iconClassName, isLoading, ...props }: HuginnLoadingButtonProps) {
   return (
      <HuginnButton {...props} className={clsx("flex items-center justify-center", className)} disabled={isLoading || disabled} aria-busy={isLoading}>
         {isLoading ? (
            <>
               <HuginnLoadingIcon className={clsx("size-7", iconClassName)} />
            </>
         ) : (
            children
         )}
      </HuginnButton>
   );
}
