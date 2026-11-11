import type { ReactNode } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ImageCropModal from "./ImageCropModal";

const mocks = vi.hoisted(() => ({
   modal: { isOpen: true, originalImageData: "blob:sticker", mimeType: "image/png", cropType: "sticker", callback: vi.fn() },
   props: {} as Record<string, unknown>,
   updateModals: vi.fn(),
   revokeObjectURL: vi.fn(),
   getCroppedCanvas: vi.fn(),
   toDataURL: vi.fn(),
   cropGif: vi.fn(),
}));

vi.mock("@stores/modalsStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/modalsStore")>()),
   useModals: () => ({ imageCrop: mocks.modal, updateModals: mocks.updateModals }),
}));
vi.mock("@huginn/frontend-shared", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@huginn/frontend-shared")>()),
   HuginnDialogPanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@components/profile/UserProfilePreview", () => ({ default: () => null }));
vi.mock("@components/voice/VoiceElement", () => ({ default: () => null }));
vi.mock("./UserProfileModal", () => ({ UserProfileCropPreview: () => null }));
vi.mock("super-image-cropper", () => ({
   SuperImageCropper: class {
      crop = mocks.cropGif;
   },
}));
vi.mock("react-cropper", async () => {
   const { forwardRef, useImperativeHandle } = await import("react");
   return {
      default: forwardRef((props: Record<string, unknown>, ref) => {
         mocks.props = props;
         useImperativeHandle(ref, () => ({ cropper: { getCroppedCanvas: mocks.getCroppedCanvas } }));
         return <div data-testid="cropper" />;
      }),
   };
});

beforeEach(() => {
   vi.clearAllMocks();
   mocks.modal.mimeType = "image/png";
   mocks.modal.cropType = "sticker";
   mocks.toDataURL.mockReturnValue("data:image/png;base64,AQID");
   mocks.getCroppedCanvas.mockReturnValue({ toDataURL: mocks.toDataURL });
   mocks.cropGif.mockResolvedValue("data:image/gif;base64,R0lGODlh");
   vi.stubGlobal(
      "Image",
      class {
         naturalWidth = 800;
         naturalHeight = 400;
         onload: (() => void) | null = null;
         set src(_value: string) {
            queueMicrotask(() => this.onload?.());
         }
      },
   );
   vi.stubGlobal(
      "URL",
      class extends URL {
         static revokeObjectURL = mocks.revokeObjectURL;
      },
   );
});
afterEach(() => vi.unstubAllGlobals());

describe("ImageCropModal sticker cropping", () => {
   it("allows a movable crop area and exports static stickers without forcing a square", async () => {
      render(<ImageCropModal />);
      await screen.findByTestId("cropper");
      expect(mocks.props).toMatchObject({ initialAspectRatio: 2, cropBoxResizable: true, cropBoxMovable: true });
      expect(mocks.props.aspectRatio).toBeNaN();
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      await waitFor(() => expect(mocks.modal.callback).toHaveBeenCalledWith("data:image/png;base64,AQID"));
      expect(mocks.getCroppedCanvas).toHaveBeenCalledWith(expect.objectContaining({ maxWidth: 512, maxHeight: 512 }));
      expect(mocks.toDataURL).toHaveBeenCalledWith("image/png");
      expect(mocks.revokeObjectURL).toHaveBeenCalledWith("blob:sticker");
   });

   it("uses the animated cropper for GIF stickers", async () => {
      mocks.modal.mimeType = "image/gif";
      render(<ImageCropModal />);
      await screen.findByTestId("cropper");
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      await waitFor(() => expect(mocks.modal.callback).toHaveBeenCalledWith("data:image/gif;base64,R0lGODlh"));
      expect(mocks.cropGif).toHaveBeenCalledWith(expect.objectContaining({ outputType: "base64", src: "blob:sticker" }));
      expect(mocks.getCroppedCanvas).not.toHaveBeenCalled();
   });

   it("cancels without uploading and releases the selected image", async () => {
      render(<ImageCropModal />);
      await screen.findByTestId("cropper");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(mocks.modal.callback).not.toHaveBeenCalled();
      expect(mocks.revokeObjectURL).toHaveBeenCalledWith("blob:sticker");
      expect(mocks.updateModals).toHaveBeenCalledWith({ imageCrop: { isOpen: false } });
   });
});
