import { encodeGifFrame, type GifFrameTask } from "./gif-encoder";

self.onmessage = ({ data: frame }: MessageEvent<GifFrameTask>) => {
   const result = encodeGifFrame(frame);
   self.postMessage(result, frame.canTransfer ? [result.data[0].buffer] : []);
};
