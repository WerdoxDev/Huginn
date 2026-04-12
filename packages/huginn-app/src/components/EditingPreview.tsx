import { Transition } from "@headlessui/react";

export default function EditingPreview(props: { onCancel: () => void; show: boolean }) {
   return (
      <Transition show={props.show}>
         <div className="border-surface flex items-center gap-x-2 border-b py-2 pr-2 pl-4 text-sm duration-150 data-closed:h-0 data-closed:py-0 data-closed:opacity-0">
            <IconMingcuteEdit2Fill className="text-positive-100 size-4 shrink-0" />
            <span className="text-white/80">Editing message</span>
            <span className="text-xs text-white/30 italic">escape to cancel</span>
            <button
               className="hover:bg-surface ml-auto cursor-pointer rounded-md p-1 text-white/70 transition-colors hover:text-white"
               onClick={props.onCancel}
               type="button"
            >
               <IconMingcuteCloseFill className="size-3.5" />
            </button>
         </div>
      </Transition>
   );
}
