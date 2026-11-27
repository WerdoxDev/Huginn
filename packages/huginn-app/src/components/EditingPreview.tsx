import MessageBoxPreviewBar, { type MessageBoxPreviewBarProps } from "./MessageBoxPreviewBar";

export default function EditingPreview(props: MessageBoxPreviewBarProps & { onCancel: () => void }) {
   return (
      <MessageBoxPreviewBar {...props}>
         <IconMingcuteEdit2Fill className="text-positive-300 size-4 shrink-0" />
         <span className="text-white/80">Editing message</span>
         <span className="text-xs text-white/30 italic">escape to cancel</span>
         <button
            className="hover:bg-surface ml-auto cursor-pointer rounded-md p-1 text-white/70 transition-colors hover:text-white"
            onClick={props.onCancel}
            type="button"
            data-keyboard-no-close
         >
            <IconMingcuteCloseFill className="size-3.5" />
         </button>
      </MessageBoxPreviewBar>
   );
}
