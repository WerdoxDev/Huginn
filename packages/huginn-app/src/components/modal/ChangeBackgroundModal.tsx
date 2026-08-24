import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ColorPicker from "@components/ColorPicker";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnAccordion from "@components/HuginnAccordion";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import HuginnLabel from "@components/HuginnLabel";
import HuginnTab from "@components/HuginnTab";
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
import { type ReactNode, useEffect, useMemo, useState } from "react";

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

type PreviewOrientation = "landscape" | "portrait";

function createBackgroundDraft(background?: BackgroundStyle | null): BackgroundStyle {
   const imageDisplay = background?.image ? (background.imageDisplay ?? "cover") : undefined;
   const portraitImageDisplay = background?.portraitImage ? (background.portraitImageDisplay ?? "cover") : undefined;
   const needsColor = !background?.image || imageDisplay === "contain" || portraitImageDisplay === "contain";

   return {
      color: needsColor ? (background?.color ?? DEFAULT_COLOR) : undefined,
      image: background?.image,
      imageDisplay,
      blur: background?.image ? (background.blur ?? 0) : undefined,
      dimming: background?.image ? (background.dimming ?? 0) : undefined,
      portraitImage: background?.portraitImage,
      portraitImageDisplay,
      portraitBlur: background?.portraitImage ? (background.portraitBlur ?? 0) : undefined,
      portraitDimming: background?.portraitImage ? (background.portraitDimming ?? 0) : undefined,
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
   const [previewOrientation, setPreviewOrientation] = useState<PreviewOrientation>("landscape");
   const backgroundScope = isGlobal ? "global" : (channelId ?? "global");
   const landscapeBackgroundUrl = useBackgroundImageUrl(background.image, backgroundScope);
   const portraitBackgroundUrl = useBackgroundImageUrl(background.portraitImage, backgroundScope);
   const hasLandscapeImage = !!background.image;
   const hasPortraitImage = !!background.portraitImage;
   const isUsingPortraitImage = previewOrientation === "portrait" && hasPortraitImage;
   const previewBackgroundUrl = previewOrientation === "portrait" ? (portraitBackgroundUrl ?? landscapeBackgroundUrl) : landscapeBackgroundUrl;
   const previewImageDisplay = isUsingPortraitImage ? background.portraitImageDisplay : background.imageDisplay;
   const previewBlur = isUsingPortraitImage ? background.portraitBlur : background.blur;
   const previewDimming = isUsingPortraitImage ? background.portraitDimming : background.dimming;
   const isColorEnabled =
      !hasLandscapeImage || background.imageDisplay === "contain" || (hasPortraitImage && background.portraitImageDisplay === "contain");
   const recipientId = channel?.recipientIds.find((id) => id !== user?.id);
   const previewChannelId = channelId ?? "0";
   const mockMessages = useMemo(() => createMockMessages(previewChannelId, user?.id, recipientId), [previewChannelId, recipientId, user?.id]);

   function close() {
      updateModals({ changeBackground: { isOpen: false } });
   }

   function updateBackground(patch: Partial<BackgroundStyle>) {
      setBackground((current) => createBackgroundDraft({ ...current, ...patch }));
   }

   async function chooseImage(orientation: PreviewOrientation) {
      const result = await openFileDialog();
      if (!result) return;

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            cropType: "chat-background",
            callback: (image) => {
               updateBackground(orientation === "landscape" ? { image } : { portraitImage: image });
               setPreviewOrientation(orientation);
            },
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
      setPreviewOrientation("landscape");
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
                  <div className="mb-2 flex items-center justify-between gap-3">
                     <HuginnLabel className="mb-0!">Preview</HuginnLabel>
                     <HuginnTab value={previewOrientation} onChange={(value) => setPreviewOrientation(value as PreviewOrientation)}>
                        <HuginnTab.TabList tabClassName="w-full py-1 px-2">
                           <HuginnTab.Tab value="landscape">
                              <IconMingcuteMonitorFill className="size-5" />
                              Landscape
                           </HuginnTab.Tab>
                           <HuginnTab.Tab value="portrait">
                              <IconMingcuteCellphoneFill className="size-5" />
                              Portrait
                           </HuginnTab.Tab>
                        </HuginnTab.TabList>
                     </HuginnTab>
                  </div>
                  <div className="flex h-96 min-h-64 w-full justify-center">
                     <div
                        className={clsx(
                           "bg-surface-deep relative h-full max-w-full overflow-hidden rounded-lg transition-[width]",
                           previewOrientation === "landscape" ? "w-full" : "aspect-9/16 w-auto",
                        )}
                        style={{ backgroundColor: background.color }}
                     >
                        {previewBackgroundUrl && (
                           <div
                              className="pointer-events-none absolute bg-center bg-no-repeat"
                              style={{
                                 backgroundImage: `url(${previewBackgroundUrl})`,
                                 backgroundSize: previewImageDisplay ?? "cover",
                                 filter: previewBlur ? `blur(${previewBlur}px)` : undefined,
                                 inset: previewBlur ? -previewBlur * 2 : 0,
                              }}
                           />
                        )}
                        {previewBackgroundUrl && (
                           <div
                              className="pointer-events-none absolute inset-0 bg-black"
                              style={{ opacity: previewDimming ? previewDimming / 100 : 0 }}
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

                  <div className="flex flex-col gap-2">
                     <div>
                        <HuginnLabel className="mb-0.5!">Custom Images</HuginnLabel>
                        <p className="text-text/60 text-xs">Add an optional portrait image for phones. Each image has its own display settings.</p>
                     </div>
                     <HuginnAccordion multiple className="flex flex-col gap-2">
                        <BackgroundImageSlot
                           value="landscape"
                           icon={<IconMingcuteMonitorFill className="size-5" />}
                           title="Landscape"
                           description="16:9 recommended"
                           hasImage={hasLandscapeImage}
                           onChoose={() => chooseImage("landscape")}
                           onRemove={() => updateBackground({ image: undefined })}
                        >
                           <BackgroundImageOptions
                              imageDisplay={background.imageDisplay}
                              blur={background.blur}
                              dimming={background.dimming}
                              onImageDisplayChange={(imageDisplay) => updateBackground({ imageDisplay })}
                              onBlurChange={(blur) => updateBackground({ blur })}
                              onDimmingChange={(dimming) => updateBackground({ dimming })}
                           />
                        </BackgroundImageSlot>
                        <BackgroundImageSlot
                           optional
                           value="portrait"
                           icon={<IconMingcuteCellphoneFill className="size-5" />}
                           title="Portrait"
                           description="9:16 recommended"
                           hasImage={hasPortraitImage}
                           onChoose={() => chooseImage("portrait")}
                           onRemove={() => updateBackground({ portraitImage: undefined })}
                        >
                           <BackgroundImageOptions
                              imageDisplay={background.portraitImageDisplay}
                              blur={background.portraitBlur}
                              dimming={background.portraitDimming}
                              onImageDisplayChange={(portraitImageDisplay) => updateBackground({ portraitImageDisplay })}
                              onBlurChange={(portraitBlur) => updateBackground({ portraitBlur })}
                              onDimmingChange={(portraitDimming) => updateBackground({ portraitDimming })}
                           />
                        </BackgroundImageSlot>
                     </HuginnAccordion>
                  </div>
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

function BackgroundImageSlot(props: {
   value: PreviewOrientation;
   icon: ReactNode;
   title: string;
   description: string;
   hasImage: boolean;
   onChoose: () => void;
   onRemove: () => void;
   optional?: boolean;
   children: ReactNode;
}) {
   return (
      <HuginnAccordion.Item value={props.value} className="bg-surface-alt rounded-lg p-2.5">
         <HuginnAccordion.Header className="mb-2">
            <HuginnAccordion.Trigger
               disabled={!props.hasImage}
               className="group flex w-full min-w-0 cursor-pointer items-center gap-2.5 text-left disabled:cursor-default"
            >
               <div className="bg-surface text-text/70 flex size-9 shrink-0 items-center justify-center rounded-md">{props.icon}</div>
               <div className="w-full min-w-0">
                  <div className="flex w-full items-center gap-2">
                     <div className="text-sm font-medium text-white">{props.title}</div>
                     <div className="ml-auto flex items-center gap-1.5">
                        {props.optional && <div className="text-text/80 text-xs">Optional</div>}
                        {props.hasImage && (
                           <IconMingcuteDownFill className="text-text/70 size-4 transition-transform group-data-panel-open:rotate-180" />
                        )}
                     </div>
                  </div>
                  <div className="text-text/60 truncate text-xs">{props.description}</div>
               </div>
            </HuginnAccordion.Trigger>
         </HuginnAccordion.Header>
         <div className="flex gap-2">
            <HuginnButton
               color="primary"
               className="flex h-8 flex-1 items-center justify-center gap-1.5 px-2 text-sm"
               onClick={props.onChoose}
               type="button"
            >
               <IconMingcuteFolderOpenFill className="size-4" />
               {props.hasImage ? "Replace" : "Choose"}
            </HuginnButton>
            {props.hasImage && (
               <HuginnButton color="surface" className="h-8 p-2" onClick={props.onRemove} type="button">
                  <IconMingcuteDelete3Fill className="text-negative-500 size-4" />
                  <span className="sr-only">Remove {props.title.toLowerCase()} image</span>
               </HuginnButton>
            )}
         </div>
         {props.hasImage && (
            <HuginnAccordion.Panel>
               <div className="border-surface mt-3 flex flex-col gap-4 border-t pt-3">{props.children}</div>
            </HuginnAccordion.Panel>
         )}
      </HuginnAccordion.Item>
   );
}

function BackgroundImageOptions(props: {
   imageDisplay?: BackgroundStyle["imageDisplay"];
   blur?: number;
   dimming?: number;
   onImageDisplayChange: (imageDisplay: NonNullable<BackgroundStyle["imageDisplay"]>) => void;
   onBlurChange: (blur: number) => void;
   onDimmingChange: (dimming: number) => void;
}) {
   const selectedImageDisplay = imageDisplayOptions.find((option) => option.value === props.imageDisplay) ?? imageDisplayOptions[0];

   return (
      <>
         <HuginnSelect onChange={(option) => props.onImageDisplayChange(option.value)} selected={selectedImageDisplay}>
            <HuginnLabel>Image Display</HuginnLabel>
            <HuginnSelect.List className="bg-surface! w-full!">
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
            value={props.blur ?? 0}
            onChange={props.onBlurChange}
            getTooltipText={(value) => `${value}px`}
         >
            <HuginnSlider.Label>Blur: {props.blur ?? 0}px</HuginnSlider.Label>
            <HuginnSlider.Input backgroundClassName="bg-surface!" />
         </HuginnSlider>
         <HuginnSlider
            minValue={0}
            maxValue={100}
            step={1}
            value={props.dimming ?? 0}
            onChange={props.onDimmingChange}
            getTooltipText={(value) => `${value}%`}
         >
            <HuginnSlider.Label>Dimming: {props.dimming ?? 0}%</HuginnSlider.Label>
            <HuginnSlider.Input backgroundClassName="bg-surface!" />
         </HuginnSlider>
      </>
   );
}
