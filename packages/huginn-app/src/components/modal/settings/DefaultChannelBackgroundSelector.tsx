import HuginnButton from "@components/button/HuginnButton";
import HuginnLabel from "@components/HuginnLabel";
import { useBackgroundImageUrl, useGlobalChannelBackground } from "@hooks/useChannelBackgrounds";
import { useModals } from "@stores/modalsStore";

export default function DefaultChannelBackgroundSelector() {
   const { background } = useGlobalChannelBackground();
   const backgroundImageUrl = useBackgroundImageUrl(background?.image, "global");
   const { updateModals } = useModals();

   return (
      <div className="flex w-full flex-col">
         <HuginnLabel className="mb-1!">Default Channel Background</HuginnLabel>
         <p className="text-text/60 mb-3 text-sm">Used in every channel that does not have its own background.</p>
         <div className="border-surface-alt bg-surface-deep/40 flex items-center gap-3 rounded-xl border p-3">
            <div
               aria-label="Default channel background preview"
               className="bg-surface-deep relative h-14 w-24 shrink-0 overflow-hidden rounded-md"
               style={{ backgroundColor: background?.color }}
            >
               {backgroundImageUrl && (
                  <div
                     className="pointer-events-none absolute bg-center bg-no-repeat"
                     style={{
                        backgroundImage: `url(${backgroundImageUrl})`,
                        backgroundSize: background?.imageDisplay ?? "cover",
                        filter: background?.blur ? `blur(${background.blur}px)` : undefined,
                        inset: background?.blur ? -background.blur * 2 : 0,
                     }}
                  />
               )}
               {backgroundImageUrl && (
                  <div
                     className="pointer-events-none absolute inset-0 bg-black"
                     style={{ opacity: background?.dimming ? background.dimming / 100 : 0 }}
                  />
               )}
            </div>
            <HuginnButton
               className="ml-auto h-10 px-4"
               color="primary"
               onClick={() => updateModals({ changeBackground: { isOpen: true, channelId: null } })}
               type="button"
            >
               Change Background
            </HuginnButton>
         </div>
      </div>
   );
}
