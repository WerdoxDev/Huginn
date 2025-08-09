import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export function useStartCamera() {
   const client = useClient();

   const mutation = useMutation({
      mutationKey: ["start-camera"],
      async mutationFn(data: { deviceId: string }) {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: data.deviceId, frameRate: 30 },
         });
         const track = stream.getVideoTracks()[0];
         await client?.voice.startCamera(track);
      },
   });

   return mutation;
}
