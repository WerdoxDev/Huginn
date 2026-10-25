import type { HuginnSelectItem } from "@huginn/frontend-shared";
import type { MessageSearchHas } from "@huginnjs/shared";

import HuginnSelect from "@components/dropdown/HuginnSelect";
import { HuginnButton, HuginnInput } from "@huginn/frontend-shared";
import { searchFilterOptions, type SearchFilter, type SearchFilterEditorType } from "@lib/message-search";
import clsx from "clsx";
import { useState } from "react";

import type { AppUser } from "@/types";

const contentOptions: HuginnSelectItem<MessageSearchHas>[] = [
   { value: "image", text: "Image" },
   { value: "video", text: "Video" },
   { value: "file", text: "File" },
   { value: "link", text: "Link" },
   { value: "audio", text: "Audio" },
   { value: "embed", text: "Embed" },
];
const dateOptions: HuginnSelectItem<"after" | "before" | "on">[] = [
   { value: "after", text: "After" },
   { value: "before", text: "Before" },
   { value: "on", text: "On" },
];
const pinnedOptions = [
   { value: "true", text: "Pinned" },
   { value: "false", text: "Not pinned" },
];
const textOptions = [
   { value: "attachmentFilename", text: "Attachment filename", placeholder: "e.g. my_nice_photo", pattern: undefined },
   // { value: "attachmentExtension", text: "Attachment extension", placeholder: "e.g. png or .png", pattern: "^\\.?[a-zA-Z0-9]+(?:\\.[a-zA-Z0-9]+)*$" },
   // { value: "embedType", text: "Embed type", placeholder: "e.g. image, video, rich or gifv", pattern: undefined },
   // { value: "repliedToMessageId", text: "Reply to message", placeholder: "Message ID", pattern: "[0-9]{1,19}" },
] as const;

export default function ChannelSearchFilterEditor(props: {
   type: SearchFilterEditorType;
   filters: SearchFilter[];
   participants: AppUser[];
   currentUserId?: string;
   onAdd: (filter: SearchFilter) => void;
   onClose: () => void;
}) {
   const [selectedUserId, setSelectedUserId] = useState("");
   const [contentType, setContentType] = useState(contentOptions[0]);
   const [dateCondition, setDateCondition] = useState(dateOptions[0]);
   const [text, setText] = useState("");
   const [date, setDate] = useState("");
   const [pinned, setPinned] = useState(pinnedOptions[0]);

   const userOptions = props.participants.map((user) => ({
      value: user.id,
      text: `${user.displayName ?? user.username}${user.id === props.currentUserId ? " (you)" : ` (@${user.username})`}`,
   }));
   const selectedUser = props.participants.find((user) => user.id === selectedUserId);
   // const userFilter = props.type === "from" || props.type === "mentions" || props.type === "repliedToUserId";
   const userFilter = props.type === "from" || props.type === "mentions";
   const textOption = textOptions.find((option) => option.value === props.type);
   const label = searchFilterOptions.find((option) => option.value === props.type)!.text;
   let draft: SearchFilter | undefined;
   let invalidValue = "";

   // if ((props.type === "from" || props.type === "mentions" || props.type === "repliedToUserId") && selectedUser) {
   if ((props.type === "from" || props.type === "mentions") && selectedUser) {
      draft = { type: props.type, value: selectedUser.id, label: `${label}: ${selectedUser.displayName ?? selectedUser.username}` };
   } else if (props.type === "has") {
      draft = { type: "has", value: contentType.value, label: `Has: ${contentType.text}` };
   } else if (props.type === "date" && date) {
      const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      draft = { type: dateCondition.value, value: date, label: `${dateCondition.text}: ${formattedDate}` };
   } else if (props.type === "pinned") {
      draft = { type: "pinned", value: pinned.value, label: pinned.text };
   } else if (textOption && text.trim()) {
      const value = text.trim();
      // if (textOption.value === "repliedToMessageId" && !isSearchSnowflake(value)) invalidValue = "Enter a valid message ID.";
      // if (textOption.value === "attachmentFilename" && !/^\.?[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/.test(value))
      //    invalidValue = "Enter a valid file extension.";
      if (!invalidValue) draft = { type: textOption.value, value, label: `${label}: ${value}` };
   }
   const isDuplicate = props.filters.some((filter) => filter.type === draft?.type && filter.value === draft.value);

   return (
      <form
         className="bg-surface-deep flex flex-col gap-3 rounded-md p-3"
         onSubmit={(event) => {
            event.preventDefault();
            if (draft && !isDuplicate) props.onAdd(draft);
         }}
         onKeyDown={(event) => {
            if (event.key === "Escape") {
               event.stopPropagation();
               props.onClose();
            }
         }}
      >
         {userFilter && (
            <FilterSelect
               label={label}
               options={userOptions}
               value={selectedUserId}
               onChange={setSelectedUserId}
               placeholder="Select a participant"
            />
         )}
         {props.type === "has" && (
            <FilterSelect
               label="Has"
               options={contentOptions}
               value={contentType.value}
               onChange={(value) => setContentType(contentOptions.find((option) => option.value === value)!)}
            />
         )}
         {props.type === "pinned" && (
            <FilterSelect
               label="Pinned"
               options={pinnedOptions}
               value={pinned.value}
               onChange={(value) => setPinned(pinnedOptions.find((option) => option.value === value)!)}
            />
         )}
         {props.type === "date" && (
            <>
               <FilterSelect
                  label="Date"
                  options={dateOptions}
                  value={dateCondition.value}
                  onChange={(value) => setDateCondition(dateOptions.find((option) => option.value === value)!)}
               />
               <HuginnInput type="date" required value={date} onChange={(event) => setDate(event.target.value)}>
                  <HuginnInput.Label>Choose date</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     {/*scheme-dark is to make the date picker icon white and picker black*/}
                     <HuginnInput.Input className="min-w-0 text-sm scheme-dark" min="2023-01-01" />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            </>
         )}
         {textOption && (
            <HuginnInput required value={text} placeholder={textOption.placeholder} onChange={(event) => setText(event.target.value)}>
               <HuginnInput.Label>{label}</HuginnInput.Label>
               <HuginnInput.Wrapper>
                  <HuginnInput.Input
                     autoComplete="off"
                     className="min-w-0 text-sm"
                     pattern={textOption.pattern}
                     // inputMode={props.type === "repliedToMessageId" ? "numeric" : undefined}
                  />
               </HuginnInput.Wrapper>
            </HuginnInput>
         )}
         <div className="flex items-center justify-end gap-2">
            <HuginnButton type="button" color="surface-alt" className="h-8 w-full text-sm" onClick={props.onClose}>
               Cancel
            </HuginnButton>
            <HuginnButton type="submit" color="primary" disabled={!draft || isDuplicate} className="h-8 w-full text-sm">
               Add filter
            </HuginnButton>
         </div>
      </form>
   );
}

export function FilterSelect<T extends string | number>(props: {
   label: string;
   options: HuginnSelectItem<T>[];
   value: T | undefined;
   onChange: (value: T) => void;
   placeholder?: string;
   className?: string;
}) {
   return (
      <HuginnSelect<T>
         selected={props.options.find((option) => option.value === props.value)}
         onChange={(option) => props.onChange(option.value)}
         className="min-w-0"
      >
         <HuginnSelect.Label>{props.label}</HuginnSelect.Label>
         <HuginnSelect.List className={clsx("w-full!", props.className)} placeholder={props.placeholder} triggerClassName="text-sm">
            <HuginnSelect.ItemsWrapper>
               {props.options.map((option) => (
                  <HuginnSelect.Item key={option.value} item={option} className="text-sm" />
               ))}
            </HuginnSelect.ItemsWrapper>
         </HuginnSelect.List>
      </HuginnSelect>
   );
}
