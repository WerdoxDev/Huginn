import type { APIPostChannelSearchJSONBody } from "@huginnjs/shared";

import HuginnSelect from "@components/dropdown/HuginnSelect";
import { MessageProvider } from "@contexts/MessageProvider";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useIsMobile } from "@hooks/useIsMobile";
import { HuginnButton, HuginnInput, HuginnLabel, HuginnLoadingButton, type HuginnSelectItem } from "@huginn/frontend-shared";
import { MessageType } from "@huginnjs/shared";
import { addSearchFilter, buildMessageSearchBody, searchFilterOptions, type SearchFilter, type SearchFilterEditorType } from "@lib/message-search";
import { getMessageSearchOptions } from "@lib/queries";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";

import type { AppDirectChannel, AppMessage, ProcessedMessage } from "@/types";

import ChannelSearchFilterEditor from "./ChannelSearchFilterEditor";

const sortOptions: HuginnSelectItem[] = [
   { value: "desc", text: "Newest first", icon: <IconMingcuteSortDescendingFill className="size-4 shrink-0" /> },
   { value: "asc", text: "Oldest first", icon: <IconMingcuteSortAscendingFill className="size-4 shrink-0" /> },
] as const;

export default function ChannelSearchPanel(props: { channel: AppDirectChannel; onClose: () => void }) {
   return <SearchPanel key={props.channel.id} {...props} />;
}

function SearchPanel(props: { channel: AppDirectChannel; onClose: () => void }) {
   const inputRef = useRef<HTMLInputElement>(null);
   const searchFormId = useId();
   const client = useClient();
   const isMobile = useIsMobile();
   const { requestJumpToMessage } = useChannelStore();
   const [content, setContent] = useState("");
   const [filters, setFilters] = useState<SearchFilter[]>([]);
   const [filterType, setFilterType] = useState<SearchFilterEditorType | null>(null);
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
   const [submittedSearch, setSubmittedSearch] = useState<APIPostChannelSearchJSONBody | null>(null);
   const search = useQuery(getMessageSearchOptions(client, submittedSearch));
   const offset = submittedSearch?.offset ?? 0;
   const limit = submittedSearch?.limit ?? 25;
   const { user } = useThisUser();
   const recipients = useUsers(props.channel.recipientIds);
   const participants = [...(user ? [user] : []), ...recipients.filter((recipient) => recipient.id !== user?.id)];
   const handleError = useErrorHandler();

   useEffect(() => {
      // The input can mount while the panel is still sliding in from offscreen.
      inputRef.current?.focus({ preventScroll: true });
   }, []);

   function closeEditor() {
      setFilterType(null);
      inputRef.current?.focus({ preventScroll: true });
   }

   useEffect(() => {
      if (search.error) {
         handleError(search.error);
      }
   }, [search.error]);

   function submitSearch() {
      const body = { ...buildMessageSearchBody(props.channel.id, content, filters, sortOrder, limit), offset: 0 };
      if (JSON.stringify(body) === JSON.stringify(submittedSearch)) void search.refetch();
      else setSubmittedSearch(body);
   }

   return (
      <div className="text-text flex h-full min-h-0 flex-col">
         <div className="scroll-super-thin scroll-surface flex min-h-0 flex-1 flex-col gap-y-3 overflow-y-scroll p-3 pr-1">
            <form
               id={searchFormId}
               onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
               }}
            >
               <HuginnInput
                  ref={inputRef}
                  placeholder="Search messages..."
                  value={content}
                  onChange={(event) => {
                     setContent(event.target.value);
                  }}
               >
                  <HuginnInput.Label>Search</HuginnInput.Label>
                  <HuginnInput.Wrapper className="bg-surface-deep">
                     <div className="flex items-center justify-center pl-2">
                        <IconMingcuteSearch2Fill className="size-5 shrink-0" />
                     </div>
                     <HuginnInput.Input autoComplete="off" className="min-w-0 text-sm" />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            </form>
            {filters.length > 0 && (
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                     <HuginnLabel className="mb-0!">Filters</HuginnLabel>
                     <HuginnButton
                        type="button"
                        color="ghost"
                        className="px-1 py-0.5 text-xs"
                        onClick={() => {
                           setFilters([]);
                        }}
                     >
                        Clear all
                     </HuginnButton>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                     {filters.map((filter) => (
                        <li
                           key={`${filter.type}:${filter.value}`}
                           className="bg-surface-deep flex max-w-full min-w-0 items-center gap-x-1 rounded-md text-xs"
                        >
                           <div className="box-exact truncate py-1.5 pl-2" title={filter.label}>
                              {filter.label}
                           </div>
                           <button
                              type="button"
                              className="hover:bg-negative-500 m-1 flex shrink-0 cursor-pointer items-center justify-center rounded! p-1.5 transition-colors"
                              onClick={() => {
                                 setFilters((current) => current.filter((item) => item !== filter));
                              }}
                           >
                              <IconMingcuteCloseFill className="size-3.5" />
                           </button>
                        </li>
                     ))}
                  </ul>
               </div>
            )}
            <div className="flex flex-col gap-2">
               <HuginnLabel className="mb-0!">Add filter</HuginnLabel>
               <div className="flex flex-wrap gap-1.5">
                  {searchFilterOptions.map((option) => (
                     <HuginnButton
                        key={option.value}
                        type="button"
                        color={filterType === option.value ? "primary" : "surface-deep"}
                        className="flex items-center gap-1.5 px-2.5 py-2 text-xs"
                        onClick={() => setFilterType((current) => (current === option.value ? null : option.value))}
                     >
                        {option.value === "from" && <IconMingcuteUser3Fill className="size-4" />}
                        {option.value === "has" && <IconMingcutePicFill className="size-4" />}
                        {option.value === "date" && <IconMingcuteCalendarFill className="size-4" />}
                        {option.value === "mentions" && <IconMingcuteAtFill className="size-4" />}
                        {option.value === "pinned" && <IconMingcutePinFill className="size-4" />}
                        {option.text}
                     </HuginnButton>
                  ))}
               </div>
            </div>
            {filterType && (
               <ChannelSearchFilterEditor
                  key={filterType}
                  type={filterType}
                  filters={filters}
                  participants={participants}
                  currentUserId={user?.id}
                  onClose={closeEditor}
                  onAdd={(filter) => {
                     setFilters((current) => addSearchFilter(current, filter));
                     closeEditor();
                  }}
               />
            )}
            <div className="flex items-center justify-center gap-x-2">
               <HuginnLoadingButton
                  type="submit"
                  form={searchFormId}
                  color="primary"
                  className="h-10 w-full"
                  // iconClassName="size-5!"
                  isLoading={search.isFetching}
                  disabled={!client}
               >
                  Search
               </HuginnLoadingButton>
               <HuginnSelect
                  selected={sortOrder ? sortOptions.find((option) => option.value === sortOrder) : undefined}
                  onChange={(option) => setSortOrder(option.value as "asc" | "desc")}
               >
                  {/*<HuginnSelect.Label>{props.label}</HuginnSelect.Label>*/}
                  <HuginnSelect.List className={"bg-surface-deep! w-40!"} triggerClassName="text-sm">
                     <HuginnSelect.ItemsWrapper>
                        {sortOptions.map((option) => (
                           <HuginnSelect.Item key={option.value} item={option} className="text-sm" />
                        ))}
                     </HuginnSelect.ItemsWrapper>
                  </HuginnSelect.List>
               </HuginnSelect>
            </div>
            {/*<FilterSelect label="Sort order" options={[...sortOptions]} value={sortOrder} onChange={setSortOrder} className="bg-surface-deep!" />*/}
            {!!search.data?.length && (
               <>
                  <div className="bg-surface-deep h-0.5 shrink-0" />
                  <div className="mt-2 flex flex-col gap-3">
                     <div className="flex items-center justify-between gap-2">
                        <HuginnLabel className="mb-0!">Results</HuginnLabel>
                        {!search.isFetching && !!search.data?.length && (
                           <span className="text-text/70 text-xs">
                              {offset + 1}–{offset + search.data.length}
                           </span>
                        )}
                     </div>
                     {!search.isFetching && !search.isError && search.data?.length === 0 && (
                        <div className="text-text/70 py-6 text-center text-sm">
                           {offset > 0 ? "No more matching messages." : "No messages matched your search."}
                        </div>
                     )}
                     {!search.isFetching && !search.isError && !!search.data?.length && (
                        <ol className="flex flex-col gap-3">
                           {search.data.map((message) => (
                              <SearchResult
                                 key={message.id}
                                 message={message}
                                 onJump={() => {
                                    requestJumpToMessage(message.channelId, message.id);
                                    if (isMobile) props.onClose();
                                 }}
                              />
                           ))}
                        </ol>
                     )}
                     {!!search.data.length && !search.isFetching && (
                        <div className="flex items-center justify-between gap-2">
                           <HuginnButton
                              type="button"
                              color="surface-deep"
                              className="px-3 py-2 text-sm"
                              disabled={offset === 0 || search.isFetching}
                              onClick={() => setSubmittedSearch({ ...submittedSearch, offset: Math.max(0, offset - limit) })}
                           >
                              Previous
                           </HuginnButton>
                           <HuginnButton
                              type="button"
                              color="surface-deep"
                              className="px-3 py-2 text-sm"
                              disabled={search.isFetching || search.isError || (search.data?.length ?? 0) < limit}
                              onClick={() => setSubmittedSearch({ ...submittedSearch, offset: offset + limit })}
                           >
                              Next
                           </HuginnButton>
                        </div>
                     )}
                  </div>
               </>
            )}
         </div>
      </div>
   );
}

function SearchResult(props: { message: AppMessage; onJump: () => void }) {
   const messageRef = useRef<HTMLLIElement>(null);
   const message: ProcessedMessage = {
      ...props.message,
      hasNewMinute: false,
      hasNewDate: false,
      hasNewAuthor: true,
      isActionType: !props.message.isPreview && ![MessageType.DEFAULT, MessageType.REPLY].includes(props.message.type),
      isReplyType: !props.message.isPreview && props.message.type === MessageType.REPLY,
      isUnread: false,
      isEditing: false,
      isReplying: false,
      isJumpHighlighted: false,
      isMentioned: false,
   };
   return (
      <li className="bg-surface-deep group/background relative min-w-0 overflow-hidden rounded-lg">
         <div className="absolute top-2 right-2 z-10 flex select-none lg:opacity-0 lg:group-hover/background:opacity-100">
            <button
               onClick={props.onJump}
               className="bg-surface-alt hover:bg-surface active:bg-surface flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm text-white/70 transition-colors outline-none hover:text-white active:text-white lg:px-2 lg:py-1"
            >
               Jump
            </button>
         </div>
         <ol>
            <MessageProvider
               message={message}
               channelId={message.channelId}
               ref={messageRef}
               options={{
                  idPrefix: "search_",
                  hideBackground: true,
                  disableContextMenu: true,
                  hideActions: true,
                  disableReactions: true,
                  equalPadding: true,
               }}
            />
         </ol>
      </li>
   );
}
