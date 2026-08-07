import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ColorPicker from "@components/ColorPicker";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import HuginnLabel from "@components/HuginnLabel";
import HuginnSlider from "@components/input/HuginnSlider";
import Tooltip from "@components/tooltip/Tooltip";
import { MessageProvider } from "@contexts/MessageProvider";
import { useChannel } from "@hooks/api-hooks/channelHooks";
import { useChannelBackgrounds } from "@hooks/useChannelBackgrounds";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { useFileDialog } from "@hooks/useFileDialog";
import { MessageType, type ChannelBackground, type Snowflake } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import type { ProcessedMessage, SelectItem } from "@/types";

import * as palette from "@/assets/palettes.json";

import HuginnDialogPanel from "./HuginnDialogPanel";

const COLOR_PRESETS = Object.values(palette.primary).map((x) => x["primary-800"]);
const DEFAULT_COLOR = COLOR_PRESETS[0];
const DEFAULT_BLUR = 0;
const DEFAULT_DIMMING = 0;
const imageDisplayOptions: SelectItem[] = [
   { text: "Fill", value: "cover" },
   { text: "Fit", value: "contain" },
];

const MOCK_MESSAGE_CONTENT = ["Ding dong!", "Whose there?", "It's me!", "Huh?"];

function createMockMessages(channelId: Snowflake, currentUserId: Snowflake, recipientId: Snowflake): ProcessedMessage[] {
   const timestamp = new Date().toISOString();

   return MOCK_MESSAGE_CONTENT.map((content, index) => ({
      authorId: index % 2 === 0 ? currentUserId : recipientId,
      content,
      id: String(index + 1),
      timestamp,
      source: "fetch",
      type: MessageType.DEFAULT,
      hasNewMinute: false,
      hasNewDate: index === 1 ? true : false,
      hasNewAuthor: true,
      isActionType: false,
      isReplyType: false,
      isUnread: index === 3 ? true : false,
      isEditing: false,
      isReplying: false,
      isJumpHighlighted: false,
      isMentioned: false,
      channelId,
      isPreview: false,
      attachments: [],
      editedTimestamp: null,
      embeds: [],
      mentionEveryone: false,
      mentionOwner: false,
      mentions: [],
      pinned: false,
      reactions: index % 2 === 1 ? [{ me: index === 1, count: 1, emoji: { name: "💀", id: null } }] : undefined,
   }));
}

export default function ChangeBackgroundModal() {
   const client = useClient();
   const { changeBackground: modal, updateModals } = useModals();
   const channel = useChannel(modal.channelId);
   const { user } = useThisUser();
   const { background, isLoading, saveChannelBackground, resetChannelBackground } = useChannelBackgrounds(modal.channelId);
   const { openFileDialog } = useFileDialog("image");

   const [color, setColor] = useState<string | null>(DEFAULT_COLOR);

   const [image, setImage] = useState<string | null>(null);
   const previewBackgroundUrl = image?.startsWith("data:")
      ? image
      : image && user?.id
        ? client?.cdn.channelBackground(modal.channelId, user.id, image)
        : undefined;
   const hasImage = image !== null;

   const [selectedImageDisplay, setSelectedImageDisplay] = useState<SelectItem>(imageDisplayOptions[0]);
   const [blur, setBlur] = useState(DEFAULT_BLUR);
   const [dimming, setDimming] = useState(DEFAULT_DIMMING);
   const { setRef } = useDynamicRefs<HTMLLIElement>();
   const currentUserId = user?.id;
   const recipientId = channel?.recipientIds.find((id) => id !== currentUserId);
   const mockMessages = useMemo(
      () => (currentUserId && recipientId ? createMockMessages(modal.channelId, currentUserId, recipientId) : []),
      [currentUserId, modal.channelId, recipientId],
   );

   const isColorEnabled = selectedImageDisplay.value === "contain" || !hasImage;

   function close() {
      updateModals({ changeBackground: { isOpen: false } });
   }

   async function chooseImage() {
      const result = await openFileDialog();
      if (!result) return;

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            cropType: "chat-background",
            callback: setImage,
         },
      });
   }

   function removeImage() {
      setImage(null);
   }

   async function save() {
      await saveChannelBackground({
         channelId: modal.channelId,
         imageDisplay: hasImage ? (selectedImageDisplay.value as ChannelBackground["imageDisplay"]) : undefined,
         color: color ?? undefined,
         image: image ?? undefined,
         blur: hasImage ? blur : undefined,
         dimming: hasImage ? dimming : undefined,
      });
      close();
   }

   async function reset() {
      await resetChannelBackground(modal.channelId);
      close();
   }

   useEffect(() => {
      if (!modal.isOpen) return;

      setColor(background?.color ?? DEFAULT_COLOR);
      setImage(background?.image ?? null);
      setSelectedImageDisplay(imageDisplayOptions.find((option) => option.value === background?.imageDisplay) ?? imageDisplayOptions[0]);
      setBlur(background?.blur ?? DEFAULT_BLUR);
      setDimming(background?.dimming ?? DEFAULT_DIMMING);
   }, [background, modal.isOpen]);

   useEffect(() => {
      setColor((currentColor) => (isColorEnabled ? (currentColor ?? DEFAULT_COLOR) : null));
   }, [isColorEnabled]);

   return (
      <HuginnDialogPanel className="flex max-h-full w-full flex-col lg:w-4xl">
         <DialogBody className="scroll-thin min-h-0 overflow-y-scroll pr-2.5!">
            <HuginnDialogTitle title="Change Background" description="Set a custom color or image as this chat's background" />
            <div className="flex flex-col gap-5 lg:flex-row">
               <div className="flex min-w-0 flex-1 flex-col">
                  <HuginnLabel>Preview</HuginnLabel>
                  <div
                     className="bg-surface-deep relative h-96 min-h-64 w-full overflow-hidden rounded-lg"
                     style={{ backgroundColor: color ?? undefined }}
                  >
                     {previewBackgroundUrl && (
                        <div
                           className="pointer-events-none absolute bg-center bg-no-repeat"
                           style={{
                              backgroundImage: `url(${previewBackgroundUrl})`,
                              backgroundSize: selectedImageDisplay.value,
                              filter: blur ? `blur(${blur}px)` : undefined,
                              inset: -blur * 2,
                           }}
                        />
                     )}
                     {previewBackgroundUrl && <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: dimming / 100 }} />}
                     <div className="relative flex h-full w-full flex-col overflow-y-scroll py-5">
                        {mockMessages.map((message, i) => (
                           <MessageProvider
                              key={message.id}
                              channelId={modal.channelId}
                              message={message}
                              lastMessage={mockMessages[i - 1]}
                              nextMessage={mockMessages[i + 1]}
                              ref={setRef(message.id)}
                              options={{ disableContextMenu: true, hideActions: true, disableReactions: true }}
                           />
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-5">
                  <div className="flex flex-col">
                     <div className="mb-2 flex items-center gap-x-1">
                        <HuginnLabel className={clsx("mb-0!", !isColorEnabled && "opacity-50!")}>Color</HuginnLabel>
                        {!isColorEnabled && (
                           <Tooltip>
                              <Tooltip.Trigger>
                                 <IconMingcuteInformationFill className="text-caution-100 size-3.5" />
                              </Tooltip.Trigger>
                              <Tooltip.Content>Remove custom image or set image display to fit in order to enable color</Tooltip.Content>
                           </Tooltip>
                        )}
                     </div>
                     <div className={clsx("flex flex-wrap items-center gap-2", !isColorEnabled && "opacity-50")}>
                        {COLOR_PRESETS.map((presetColor) => (
                           <button
                              key={presetColor}
                              type="button"
                              disabled={!isColorEnabled}
                              className={clsx(
                                 "size-8 rounded-full transition-transform enabled:cursor-pointer enabled:hover:scale-110",
                                 color === presetColor && "ring-2 ring-white",
                              )}
                              style={{ backgroundColor: presetColor }}
                              onClick={() => setColor(presetColor)}
                           />
                        ))}
                        <ColorPicker
                           color={color}
                           label={"Test"}
                           onChange={setColor}
                           disabled={!isColorEnabled}
                           className={clsx("size-10!", color && isColorEnabled && !COLOR_PRESETS.includes(color) && "ring-2 ring-white")}
                        />
                     </div>
                  </div>

                  <div className="flex flex-col">
                     <HuginnLabel>Custom Image</HuginnLabel>
                     <div className="flex gap-2">
                        <HuginnButton color="primary" className="flex h-10 flex-1 items-center justify-center gap-2 px-3" onClick={chooseImage}>
                           <IconMingcuteFolderOpenFill className="size-5" />
                           {image ? "Replace" : "Choose Image"}
                        </HuginnButton>
                        {hasImage && (
                           <HuginnButton color="surface-alt" className="h-10 p-2.5" onClick={removeImage}>
                              <IconMingcuteDelete3Fill className="text-negative-500 size-5" />
                           </HuginnButton>
                        )}
                     </div>
                  </div>
                  {hasImage && (
                     <>
                        <HuginnSelect onChange={setSelectedImageDisplay} selected={selectedImageDisplay}>
                           <HuginnLabel>Image Display</HuginnLabel>
                           <HuginnSelect.List className="w-full!">
                              <HuginnSelect.ItemsWrapper>
                                 {imageDisplayOptions.map((option) => (
                                    <HuginnSelect.Item key={option.value} item={option} />
                                 ))}
                              </HuginnSelect.ItemsWrapper>
                           </HuginnSelect.List>
                        </HuginnSelect>
                        <HuginnSlider minValue={0} maxValue={20} step={1} value={blur} onChange={setBlur} getTooltipText={(value) => `${value}px`}>
                           <HuginnSlider.Label>Blur: {blur}px</HuginnSlider.Label>
                           <HuginnSlider.Input />
                        </HuginnSlider>
                        <HuginnSlider
                           minValue={0}
                           maxValue={100}
                           step={1}
                           value={dimming}
                           onChange={setDimming}
                           getTooltipText={(value) => `${value}%`}
                        >
                           <HuginnSlider.Label>Dimming: {dimming}%</HuginnSlider.Label>
                           <HuginnSlider.Input />
                        </HuginnSlider>
                     </>
                  )}
               </div>
            </div>
         </DialogBody>
         <DialogActions>
            <HuginnButton className="h-10 flex-1" color="surface" onClick={close} type="button">
               Cancel
            </HuginnButton>
            {background && (
               <HuginnButton className="h-10 flex-1" color="negative" disabled={isLoading} onClick={reset} type="button">
                  Reset
               </HuginnButton>
            )}
            <LoadingButton isLoading={isLoading} className="h-10 flex-1" color="primary" onClick={save} type="button">
               Save
            </LoadingButton>
         </DialogActions>
      </HuginnDialogPanel>
   );
}
