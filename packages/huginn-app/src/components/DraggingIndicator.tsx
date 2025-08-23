import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";

export default function DraggingIndicator(props: { isDragging: boolean }) {
   const channel = useCurrentChannel();

   if (!channel) {
      return;
   }

   return (
      props.isDragging && (
         <div className="bg-surface-deep/60 fixed inset-0 top-6 z-10 flex items-center justify-center">
            <div className="bg-primary-700 relative flex rounded-2xl p-2.5">
               <div className="border-primary-500 rounded-xl border-2 border-dashed p-5">
                  <div className="absolute inset-x-0 -top-8 flex items-center justify-center">
                     <div className="bg-surface absolute bottom-4 h-5 w-5" />
                     <IconMingcuteFileUploadFill className="text-text z-10 size-16" />
                  </div>
                  <div className="text-text text-lg">
                     Upload to <span className="font-bold">{channel.name}</span>
                  </div>
               </div>
            </div>
         </div>
      )
   );
}
