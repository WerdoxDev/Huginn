import { HuginnButtonProps, HuginnInputProps } from "@/types";
import HuginnButton from "@components/button/HuginnButton";

export default function AddFriendInput(
   props: HuginnInputProps & { onClick?: () => void; disabled?: boolean; buttonProps?: HuginnButtonProps },
) {
   return (
      <>
         <div
            className={`bg-secondary flex w-full gap-x-2.5 overflow-hidden rounded-lg py-2.5 pl-4 pr-2.5 ring-1 ${props.className} ${props.status.code === "error" ? "ring-error" : props.status.code === "success" ? "ring-success" : "has-[:focus]:ring-primary ring-transparent"}`}
         >
            <input
               className="bg-secondary text-text placeholder-text/50 w-full outline-none"
               placeholder="e.g: Werdox"
               onChange={e => props.onChange && props.onChange(e.target)}
            />
            <HuginnButton
               className="bg-primary whitespace-nowrap rounded-md px-5 py-1.5 text-sm font-medium"
               disabled={props.disabled}
               onClick={() => props.onClick && props.onClick()}
            >
               Send Friend Request
            </HuginnButton>
         </div>
         {props.status.text && (
            <div className={`mt-2 text-sm ${props.status.code === "error" ? "text-error" : "text-success"}`}>{props.status.text}</div>
         )}
      </>
   );
}
