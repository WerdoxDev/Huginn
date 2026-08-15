import HuginnButton from "@components/button/HuginnButton";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useState } from "react";

import type { MediaSource } from "@/types";

export default function AndroidCameraFlipButton(props: { cameraSource?: MediaSource }) {
   const { voiceState } = useVoiceStore();
   const [isFlippingCamera, setIsFlippingCamera] = useState(false);
   const { flipCamera } = useVoiceUtils();
   const { user } = useThisUser();

   async function handleFlipCamera() {
      if (!user || !voiceState.isCameraOn || isFlippingCamera) return;

      setIsFlippingCamera(true);
      try {
         await flipCamera(props.cameraSource?.trackSettings?.facingMode);
      } finally {
         setIsFlippingCamera(false);
      }
   }

   return (
      <HuginnButton
         type="button"
         color="surface-alt"
         aria-label="Flip camera"
         className="flex size-10 items-center justify-center rounded-full! text-white/70 shadow-lg transition-colors active:text-white disabled:opacity-50"
         disabled={isFlippingCamera}
         onClick={() => void handleFlipCamera()}
      >
         <IconMingcuteCameraRotateFill className="size-6" />
      </HuginnButton>
   );
}
