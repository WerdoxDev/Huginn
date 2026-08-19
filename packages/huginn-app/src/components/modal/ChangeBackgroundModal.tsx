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
import { useBackgroundImageUrl, useChannelBackgrounds, useGlobalChannelBackground } from "@hooks/useChannelBackgrounds";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { useFileDialog } from "@hooks/useFileDialog";
import { MessageType, type BackgroundStyle, type Snowflake } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import type { ProcessedMessage, SelectItem } from "@/types";

import * as palette from "@/assets/palettes.json";

import HuginnDialogPanel from "./HuginnDialogPanel";

const COLOR_PRESETS = Object.values(palette.primary).map((color) => color["primary-800"]);
const DEFAULT_COLOR = COLOR_PRESETS[0];
const MOCK_MESSAGE_CONTENT = ["Ding dong!", "Whose there?", "It's me!", "Huh?"];

const imageDisplayOptions: SelectItem<NonNullable<BackgroundStyle["imageDisplay"]>>[] = [
   { text: "Fill", value: "cover" },
   { text: "Fit", value: "contain" },
];

function createBackgroundDraft(background?: BackgroundStyle | null): BackgroundStyle {
   const image = background?.image;
   const imageDisplay = image ? (background.imageDisplay ?? "cover") : undefined;

   return {
      color: !image || imageDisplay === "contain" ? (background?.color ?? DEFAULT_COLOR) : undefined,
      image,
      imageDisplay,
      blur: image ? (background?.blur ?? 0) : undefined,
      dimming: image ? (background?.dimming ?? 0) : undefined,
   };
}

function createMockMessages(channelId: Snowflake, currentUserId?: Snowflake, recipientId?: Snowflake): ProcessedMessage[] {
   const timestamp = new Date().toISOString();

   if (!currentUserId) return [];

   return MOCK_MESSAGE_CONTENT.map((content, index) => ({
      authorId: index % 2 === 0 ? currentUserId : (recipientId ?? currentUserId),
      content,
      id: String(index + 1),
      timestamp,
      source: "fetch",
      type: MessageType.DEFAULT,
      hasNewMinute: false,
      hasNewDate: index === 1,
      hasNewAuthor: true,
      isActionType: false,
      isReplyType: false,
      isUnread: index === 3,
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
   const { changeBackground: modal, updateModals } = useModals();
   const { user } = useThisUser();
   const { openFileDialog } = useFileDialog("image");
   const { setRef } = useDynamicRefs<HTMLLIElement>();
   const isGlobal = modal.channelId === null;
   const channelId = modal.channelId ?? undefined;
   const channel = useChannel(channelId);
   const {
      channelBackground,
      isLoading: isChannelBackgroundLoading,
      saveChannelBackground,
      resetChannelBackground,
   } = useChannelBackgrounds(channelId ?? "");
   const {
      background: globalChannelBackground,
      isLoading: isGlobalBackgroundLoading,
      saveGlobalChannelBackground,
      resetGlobalChannelBackground,
   } = useGlobalChannelBackground();
   const savedBackground = isGlobal ? globalChannelBackground : channelBackground;
   const isLoading = isGlobal ? isGlobalBackgroundLoading : isChannelBackgroundLoading;
   const [background, setBackground] = useState<BackgroundStyle>(() => createBackgroundDraft());
   const previewBackgroundUrl = useBackgroundImageUrl(background.image, isGlobal ? "global" : (channelId ?? "global"));
   const selectedImageDisplay = imageDisplayOptions.find((option) => option.value === background.imageDisplay) ?? imageDisplayOptions[0];
   const hasImage = !!background.image;
   const isColorEnabled = selectedImageDisplay.value === "contain" || !hasImage;
   const recipientId = channel?.recipientIds.find((id) => id !== user?.id);
   const previewChannelId = channelId ?? "0";
   const mockMessages = useMemo(() => createMockMessages(previewChannelId, user?.id, recipientId), [previewChannelId, recipientId, user?.id]);

   function close() {
      updateModals({ changeBackground: { isOpen: false } });
   }

   function updateBackground(patch: Partial<BackgroundStyle>) {
      setBackground((current) => createBackgroundDraft({ ...current, ...patch }));
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
            callback: (image) => updateBackground({ image }),
         },
      });
   }

   async function save() {
      if (isGlobal) await saveGlobalChannelBackground(background);
      else if (channelId) await saveChannelBackground(background);
      close();
   }

   async function reset() {
      if (isGlobal) await resetGlobalChannelBackground();
      else if (channelId) await resetChannelBackground();
      close();
   }

   useEffect(() => {
      if (!modal.isOpen) return;
      setBackground(createBackgroundDraft(savedBackground));
   }, [modal.isOpen, savedBackground]);

   return (
      <HuginnDialogPanel className="flex max-h-full w-full flex-col lg:w-4xl">
         <DialogBody className="scroll-thin min-h-0 overflow-y-scroll pr-2.5!">
            <HuginnDialogTitle
               title={isGlobal ? "Change Default Background" : "Change Background"}
               description={
                  isGlobal
                     ? "Set the background used in channels that do not have their own background"
                     : "Set a custom color or image as this chat's background"
               }
            />
            <div className="flex flex-col gap-5 lg:flex-row">
               <div className="flex min-w-0 flex-1 flex-col">
                  <HuginnLabel>Preview</HuginnLabel>
                  <div
                     className="bg-surface-deep relative h-96 min-h-64 w-full overflow-hidden rounded-lg"
                     style={{ backgroundColor: background.color }}
                  >
                     {previewBackgroundUrl && (
                        <div
                           className="pointer-events-none absolute bg-center bg-no-repeat"
                           style={{
                              backgroundImage: `url(${previewBackgroundUrl})`,
                              backgroundSize: background.imageDisplay ?? "cover",
                              filter: background.blur ? `blur(${background.blur}px)` : undefined,
                              inset: background.blur ? -background.blur * 2 : 0,
                           }}
                        />
                     )}
                     {previewBackgroundUrl && (
                        <div
                           className="pointer-events-none absolute inset-0 bg-black"
                           style={{ opacity: background.dimming ? background.dimming / 100 : 0 }}
                        />
                     )}
                     <div className="relative flex h-full w-full flex-col overflow-y-scroll py-5">
                        {mockMessages.map((message, index) => (
                           <MessageProvider
                              key={message.id}
                              channelId={previewChannelId}
                              message={message}
                              lastMessage={mockMessages[index - 1]}
                              nextMessage={mockMessages[index + 1]}
                              ref={setRef(message.id)}
                              options={{ disableContextMenu: true, hideActions: true, disableReactions: true }}
                           />
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-5 lg:w-72">
                  <div className="flex flex-col">
                     <div className="mb-2 flex items-center gap-x-1">
                        <HuginnLabel className={clsx("mb-0!", !isColorEnabled && "opacity-50!")}>Color</HuginnLabel>
                        {!isColorEnabled && (
                           <Tooltip>
                              <Tooltip.Trigger>
                                 <IconMingcuteInformationFill className="text-caution-100 size-3.5" />
                              </Tooltip.Trigger>
                              <Tooltip.Content>Remove the image or set its display to Fit to use a background color</Tooltip.Content>
                           </Tooltip>
                        )}
                     </div>
                     <div className={clsx("flex flex-wrap items-center gap-2", !isColorEnabled && "opacity-50")}>
                        {COLOR_PRESETS.map((color) => (
                           <button
                              key={color}
                              type="button"
                              disabled={!isColorEnabled}
                              aria-label={`Use ${color} as the background color`}
                              aria-pressed={background.color === color}
                              className={clsx(
                                 "size-8 rounded-full transition-transform enabled:cursor-pointer enabled:hover:scale-110",
                                 background.color === color && "ring-2 ring-white",
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => updateBackground({ color })}
                           />
                        ))}
                        <ColorPicker
                           color={background.color ?? null}
                           label="Custom background color"
                           onChange={(color) => updateBackground({ color: color ?? undefined })}
                           disabled={!isColorEnabled}
                           className={clsx(
                              "size-10!",
                              background.color && isColorEnabled && !COLOR_PRESETS.includes(background.color) && "ring-2 ring-white",
                           )}
                        />
                     </div>
                  </div>

                  <div className="flex flex-col">
                     <HuginnLabel>Custom Image</HuginnLabel>
                     <div className="flex gap-2">
                        <HuginnButton
                           color="primary"
                           className="flex h-10 flex-1 items-center justify-center gap-2 px-3"
                           onClick={chooseImage}
                           type="button"
                        >
                           <IconMingcuteFolderOpenFill className="size-5" />
                           {hasImage ? "Replace" : "Choose Image"}
                        </HuginnButton>
                        {hasImage && (
                           <HuginnButton
                              color="surface-alt"
                              className="h-10 p-2.5"
                              onClick={() => updateBackground({ image: undefined })}
                              type="button"
                           >
                              <IconMingcuteDelete3Fill className="text-negative-500 size-5" />
                           </HuginnButton>
                        )}
                     </div>
                  </div>

                  {hasImage && (
                     <>
                        <HuginnSelect onChange={(option) => updateBackground({ imageDisplay: option.value })} selected={selectedImageDisplay}>
                           <HuginnLabel>Image Display</HuginnLabel>
                           <HuginnSelect.List className="w-full!">
                              <HuginnSelect.ItemsWrapper>
                                 {imageDisplayOptions.map((option) => (
                                    <HuginnSelect.Item key={option.value} item={option} />
                                 ))}
                              </HuginnSelect.ItemsWrapper>
                           </HuginnSelect.List>
                        </HuginnSelect>
                        <HuginnSlider
                           minValue={0}
                           maxValue={20}
                           step={1}
                           value={background.blur ?? 0}
                           onChange={(blur) => updateBackground({ blur })}
                           getTooltipText={(value) => `${value}px`}
                        >
                           <HuginnSlider.Label>Blur: {background.blur ?? 0}px</HuginnSlider.Label>
                           <HuginnSlider.Input />
                        </HuginnSlider>
                        <HuginnSlider
                           minValue={0}
                           maxValue={100}
                           step={1}
                           value={background.dimming ?? 0}
                           onChange={(dimming) => updateBackground({ dimming })}
                           getTooltipText={(value) => `${value}%`}
                        >
                           <HuginnSlider.Label>Dimming: {background.dimming ?? 0}%</HuginnSlider.Label>
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
            {savedBackground && (
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
