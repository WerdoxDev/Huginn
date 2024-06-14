import { HuginnInputProps } from "@/types";
import HuginnButton from "@components/button/HuginnButton";

export default function AddFriendInput(props: HuginnInputProps & { onClick?: () => void; disabled?: boolean }) {
   return (
      <>
         <div
            className={`flex max-w-3xl gap-x-2.5 overflow-hidden rounded-lg bg-secondary py-2.5 pl-4 pr-2.5 ring-1 ${props.className} ${props.status.code === "error" ? "ring-error" : props.status.code === "success" ? "ring-success" : "ring-transparent has-[:focus]:ring-primary"}`}
         >
            <input
               className="w-full bg-secondary text-text placeholder-text/50 outline-none"
               placeholder="e.g: Werdox"
               onChange={(e) => props.onChange && props.onChange(e.target)}
            />
            <HuginnButton
               className="whitespace-nowrap rounded-md bg-primary px-5 py-1.5 text-sm font-medium"
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
