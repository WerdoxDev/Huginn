import type { APIIGDBGameCandidate, APIStaffGameContribution } from "@huginnjs/shared";

import { useStaffSession } from "@contexts/StaffSessionContext";
import {
   DialogActions,
   DialogBody,
   HuginnButton,
   HuginnDialog,
   HuginnDialogPanel,
   HuginnInput,
   HuginnLabel,
   HuginnLoadingButton,
   HuginnLoadingIcon,
   ModalCloseButton,
} from "@huginn/frontend-shared";
import clsx from "clsx";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { StaffAPIError, acceptGameContribution, getGameContributions, rejectGameContribution, searchIGDB } from "@/lib/api";
import { clearStaffToken } from "@/lib/auth";

function formatDate(value: Date | string) {
   return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatReleaseDate(value: number | null) {
   if (!value) return "Release date unknown";
   return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value * 1_000));
}

function parseMatcherValues(value: string) {
   return [
      ...new Set(
         value
            .split(/\r?\n/)
            .map((entry) => entry.trim())
            .filter(Boolean),
      ),
   ];
}

function isValidExeName(value: string) {
   const parts = value.split(/[/\\]/);
   return parts.length <= 2 && parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}

function Detail({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
   return (
      <div className="bg-surface rounded-lg p-3">
         <HuginnLabel className="text-text/70 mb-1!">{label}</HuginnLabel>
         <div className={clsx("text-sm break-all text-white", mono && "font-ubuntu")}>{children || <span className="text-text/50">Not provided</span>}</div>
      </div>
   );
}

export default function GameContributionsPanel() {
   const { token } = useStaffSession();
   const [contributions, setContributions] = useState<APIStaffGameContribution[]>([]);
   const [queueLoading, setQueueLoading] = useState(false);
   const [queueError, setQueueError] = useState("");
   const [queueQuery, setQueueQuery] = useState("");
   const [selectedId, setSelectedId] = useState<number>();
   const [searchQuery, setSearchQuery] = useState("");
   const [candidates, setCandidates] = useState<APIIGDBGameCandidate[]>([]);
   const [searchLoading, setSearchLoading] = useState(false);
   const [searchError, setSearchError] = useState("");
   const [candidateToAccept, setCandidateToAccept] = useState<APIIGDBGameCandidate>();
   const [exeNamesInput, setExeNamesInput] = useState("");
   const [windowTitlesInput, setWindowTitlesInput] = useState("");
   const [commandLinePatternsInput, setCommandLinePatternsInput] = useState("");
   const [matcherError, setMatcherError] = useState("");
   const [isAccepting, setIsAccepting] = useState(false);
   const [isRejecting, setIsRejecting] = useState(false);
   const [rejectError, setRejectError] = useState("");

   const selectedContribution = useMemo(() => contributions.find((contribution) => contribution.id === selectedId), [contributions, selectedId]);
   const filteredContributions = useMemo(() => {
      const query = queueQuery.trim().toLocaleLowerCase();
      if (!query) return contributions;

      return contributions.filter((contribution) =>
         [
            contribution.id.toString(),
            contribution.windowTitle,
            contribution.cleanedWindowTitle,
            contribution.exeName,
            contribution.exePath,
            contribution.commandLine,
            contribution.platform,
            contribution.contributor?.username,
            contribution.contributor?.displayName,
         ].some((value) => value?.toLocaleLowerCase().includes(query)),
      );
   }, [contributions, queueQuery]);

   useEffect(() => {
      void loadContributions(token);
   }, [token]);

   useEffect(() => {
      setRejectError("");
      setMatcherError("");
      if (!selectedContribution) {
         setSearchQuery("");
         setCandidates([]);
         setExeNamesInput("");
         setWindowTitlesInput("");
         return;
      }
      setSearchQuery(selectedContribution.cleanedWindowTitle || selectedContribution.windowTitle);
      setExeNamesInput(selectedContribution.exeName);
      setCommandLinePatternsInput("");
      setWindowTitlesInput(selectedContribution.cleanedWindowTitle);
   }, [selectedContribution?.id]);

   useEffect(() => {
      const query = searchQuery.trim();
      if (!token || !selectedContribution || query.length < 2) {
         setCandidates([]);
         setSearchLoading(false);
         return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(async () => {
         setSearchLoading(true);
         setSearchError("");
         try {
            const result = await searchIGDB(token, query, controller.signal);
            setCandidates(result.games);
         } catch (error) {
            if (controller.signal.aborted) return;
            setSearchError(error instanceof Error ? error.message : "IGDB search failed.");
         } finally {
            if (!controller.signal.aborted) setSearchLoading(false);
         }
      }, 350);

      return () => {
         window.clearTimeout(timeout);
         controller.abort();
      };
   }, [searchQuery, selectedContribution?.id, token]);

   async function loadContributions(activeToken: string) {
      setQueueLoading(true);
      setQueueError("");
      try {
         const result = await getGameContributions(activeToken);
         setContributions(result.contributions);
         setSelectedId((current) => (result.contributions.some((contribution) => contribution.id === current) ? current : result.contributions[0]?.id));
      } catch (error) {
         if (error instanceof StaffAPIError && (error.status === 401 || error.status === 403)) {
            clearStaffToken();
            window.location.assign("/staff/login");
         }
         setQueueError(error instanceof Error ? error.message : "The contribution queue could not be loaded.");
      } finally {
         setQueueLoading(false);
      }
   }

   async function handleConfirmCandidate() {
      if (!candidateToAccept || !selectedContribution) return;

      setIsAccepting(true);
      try {
         await acceptGameContribution(token, selectedContribution.id, {
            igdbId: candidateToAccept.id,
            exeNames: parseMatcherValues(exeNamesInput),
            windowTitles: parseMatcherValues(windowTitlesInput),
            commandLinePatterns: parseMatcherValues(commandLinePatternsInput),
         });
         const remaining = contributions.filter((contribution) => contribution.id !== selectedContribution.id);
         setContributions(remaining);
         setSelectedId(remaining[0]?.id);
         setCandidateToAccept(undefined);
      } catch (error) {
         setSearchError(error instanceof Error ? error.message : "The contribution could not be accepted.");
      } finally {
         setIsAccepting(false);
      }
   }

   function handleSelectCandidate(candidate: APIIGDBGameCandidate) {
      const exeNames = parseMatcherValues(exeNamesInput);
      const windowTitles = parseMatcherValues(windowTitlesInput);
      if (exeNames.length === 0 && windowTitles.length === 0) {
         setMatcherError("Add at least one executable name or window title.");
         return;
      }
      if (exeNames.some((exeName) => !isValidExeName(exeName))) {
         setMatcherError("Executable names may include at most one parent folder, for example bin/game.exe.");
         return;
      }

      setMatcherError("");
      setCandidateToAccept(candidate);
   }

   async function handleRejectContribution() {
      if (!selectedContribution) return;

      setIsRejecting(true);
      setRejectError("");
      try {
         await rejectGameContribution(token, selectedContribution.id);
         const remaining = contributions.filter((contribution) => contribution.id !== selectedContribution.id);
         setContributions(remaining);
         setSelectedId(remaining[0]?.id);
      } catch (error) {
         setRejectError(error instanceof Error ? error.message : "The contribution could not be rejected.");
      } finally {
         setIsRejecting(false);
      }
   }

   return (
      <div className="flex h-full min-h-0 flex-col">
         <div className="border-surface bg-surface-deep flex h-16 shrink-0 items-center border-b-2 px-5">
            <div>
               <h1 className="text-lg font-bold text-white">Game contributions</h1>
               <p className="text-text/70 text-xs">Review client submissions and connect them to IGDB</p>
            </div>
         </div>

         <main className="scroll-surface-deep flex min-h-0 flex-1 flex-wrap content-start gap-4 overflow-y-auto p-3">
            <section className="bg-surface-alt flex h-full min-h-128 min-w-[min(100%,18rem)] flex-[1_1_17rem] flex-col overflow-hidden rounded-xl">
               <div className="p-3">
                  <div className="mb-3 flex items-center">
                     <div>
                        <h2 className="font-semibold text-white">Pending queue</h2>
                        <p className="text-text/70 text-xs">
                           {queueQuery.trim() ? `${filteredContributions.length} of ${contributions.length}` : contributions.length} contributions
                        </p>
                     </div>
                     <button
                        type="button"
                        onClick={() => void loadContributions(token)}
                        disabled={queueLoading}
                        aria-label="Refresh contribution queue"
                        className="text-text/80 hover:bg-surface hover:text-text disabled:text-text/50 ml-auto flex size-8 items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed"
                        title="Refresh queue"
                     >
                        {queueLoading ? <HuginnLoadingIcon className="size-5" /> : <IconMingcuteRefresh2Fill className="size-5" />}
                     </button>
                  </div>
                  <HuginnInput
                     value={queueQuery}
                     onChange={(event) => setQueueQuery(event.target.value)}
                     type="search"
                     hideMessage
                     placeholder="Search title, executable, user…"
                  >
                     <HuginnInput.Wrapper className="bg-surface-deep relative flex h-10 items-center rounded-md">
                        <IconMingcuteSearch2Fill className="text-primary-500 ml-2 size-5 shrink-0" />
                        <HuginnInput.Input className="text-sm" />
                        {queueQuery && (
                           <button className="mx-2 shrink-0 cursor-pointer" onClick={() => setQueueQuery("")}>
                              <IconMingcuteCloseFill className="size-5" />
                           </button>
                        )}
                     </HuginnInput.Wrapper>
                  </HuginnInput>
               </div>
               {queueError ? (
                  <div role="alert" className="text-negative-300 px-4 pt-3 text-sm">
                     Queue loading failed: {queueError}
                  </div>
               ) : null}
               <div className="scroll-thin relative min-h-0 flex-1 overflow-auto px-2">
                  <div className="bg-surface-alt text-text/70 sticky top-0 z-10 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-2 px-2 py-2 text-xs font-medium uppercase md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_8rem]">
                     <span>Game</span>
                     <span>Executable</span>
                     <span className="hidden md:block">Sent</span>
                  </div>
                  <div className="flex flex-col gap-y-1">
                     {filteredContributions.map((contribution) => {
                        const selected = contribution.id === selectedId;
                        return (
                           <button
                              type="button"
                              key={contribution.id}
                              onClick={() => setSelectedId(contribution.id)}
                              aria-pressed={selected}
                              className={clsx(
                                 "grid w-full cursor-pointer grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-2 rounded-md p-2 text-left text-sm transition-all duration-150 outline-none ring-inset md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_8rem]",
                                 selected ? "bg-primary-900 text-white" : "hover:bg-surface",
                              )}
                           >
                              <span className="min-w-0">
                                 <span className="block truncate font-semibold">{contribution.windowTitle}</span>
                                 <span className={clsx("block truncate text-xs", selected ? "text-white/50" : "text-text/50")}>#{contribution.id}</span>
                              </span>
                              <span className="font-ubuntu min-w-0 text-xs">
                                 <span className="block truncate">{contribution.exeName}</span>
                                 <span className={clsx("mt-0.5 block", selected ? "text-white/50" : "text-text/50")}>{contribution.platform}</span>
                              </span>
                              <span className={clsx("hidden text-xs whitespace-nowrap md:block", selected ? "text-white/50" : "text-text/50")}>
                                 {formatDate(contribution.createdAt)}
                              </span>
                           </button>
                        );
                     })}
                  </div>
                  {!queueLoading && contributions.length === 0 ? (
                     <div className="text-text/40 flex min-h-40 flex-col items-center justify-center gap-2 px-6 text-center">
                        <IconMingcuteCheckCircleFill className="text-positive-300 size-8" />
                        <div>No pending contributions.</div>
                     </div>
                  ) : null}
                  {!queueLoading && contributions.length > 0 && filteredContributions.length === 0 ? (
                     <div className="text-text/40 flex min-h-40 flex-col items-center justify-center gap-2 px-6 text-center">
                        <IconMingcuteSearch2Fill className="size-8" />
                        <div>No contributions match “{queueQuery.trim()}”.</div>
                     </div>
                  ) : null}
                  {queueLoading ? (
                     <div
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
                        aria-live="polite"
                        aria-label="Loading contribution queue"
                     >
                        <HuginnLoadingIcon className="text-primary-500 size-10" />
                     </div>
                  ) : null}
               </div>
            </section>

            <section className="bg-surface-alt flex h-full min-h-128 min-w-[min(100%,20rem)] flex-[0.9_1_20rem] flex-col overflow-hidden rounded-xl">
               <div className="flex items-center gap-3 px-3 py-3">
                  <div>
                     <h2 className="font-semibold text-white">Contribution data</h2>
                     <p className="text-text/70 text-xs">Everything sent by the client</p>
                  </div>
                  <HuginnLoadingButton
                     color="negative"
                     className="ml-auto h-8 px-3 text-sm"
                     isLoading={isRejecting}
                     disabled={!selectedContribution}
                     onClick={() => void handleRejectContribution()}
                  >
                     Reject
                  </HuginnLoadingButton>
               </div>
               {selectedContribution ? (
                  <div className="scroll-thin flex min-h-0 flex-col gap-y-3 overflow-auto p-3 pr-1">
                     <div className="bg-surface flex items-center gap-4 rounded-lg p-3">
                        {selectedContribution.iconUrl ? (
                           <img src={selectedContribution.iconUrl} alt="Submitted application" className="size-16 rounded-lg object-cover" />
                        ) : (
                           <div className="bg-surface-deep text-text/30 flex size-16 shrink-0 items-center justify-center rounded-lg">
                              <IconMingcuteGame2Fill className="size-8" />
                           </div>
                        )}
                        <div className="min-w-0">
                           <div className="truncate text-lg font-semibold text-white">{selectedContribution.windowTitle}</div>
                           <div className="text-text/70 truncate text-sm">{selectedContribution.cleanedWindowTitle}</div>
                        </div>
                     </div>
                     <div className="grid gap-3 md:grid-cols-2">
                        <Detail label="Executable" mono>
                           {selectedContribution.exeName}
                        </Detail>
                        <Detail label="Platform">{selectedContribution.platform}</Detail>
                     </div>
                     <Detail label="Executable path" mono>
                        {selectedContribution.exePath}
                     </Detail>
                     <Detail label="Command line" mono>
                        {selectedContribution.commandLine?.replaceAll(selectedContribution.exePath, "").trim() ?? ""}
                     </Detail>
                     <div className="bg-surface rounded-lg p-3">
                        <HuginnLabel htmlFor="command-line-patterns" className="text-text/70">
                           Command Line Patterns
                        </HuginnLabel>
                        <textarea
                           id="command-line-patterns"
                           value={commandLinePatternsInput}
                           onChange={(event) => {
                              setCommandLinePatternsInput(event.target.value);
                              setMatcherError("");
                           }}
                           rows={3}
                           spellCheck={false}
                           className="bg-surface-deep font-ubuntu focus:ring-primary-700 min-h-20 w-full resize-y rounded-md p-2 text-sm text-white outline-none focus:ring-1"
                        />
                     </div>
                     <div className="bg-surface rounded-lg p-3">
                        <HuginnLabel htmlFor="matcher-exe-names" className="text-text/70">
                           Executable names
                        </HuginnLabel>
                        <textarea
                           id="matcher-exe-names"
                           value={exeNamesInput}
                           onChange={(event) => {
                              setExeNamesInput(event.target.value);
                              setMatcherError("");
                           }}
                           rows={3}
                           spellCheck={false}
                           className="bg-surface-deep font-ubuntu focus:ring-primary-700 min-h-20 w-full resize-y rounded-md p-2 text-sm text-white outline-none focus:ring-1"
                           placeholder="game.exe"
                        />
                     </div>
                     <div className="bg-surface rounded-lg p-3">
                        <HuginnLabel htmlFor="matcher-window-titles" className="text-text/70">
                           Window titles
                        </HuginnLabel>
                        <textarea
                           id="matcher-window-titles"
                           value={windowTitlesInput}
                           onChange={(event) => {
                              setWindowTitlesInput(event.target.value);
                              setMatcherError("");
                           }}
                           rows={3}
                           spellCheck={false}
                           className="bg-surface-deep focus:ring-primary-700 min-h-20 w-full resize-y rounded-md p-2 text-sm text-white outline-none focus:ring-1"
                           placeholder="Exact window title"
                        />
                     </div>
                     {matcherError ? (
                        <div role="alert" className="text-negative-300 text-sm">
                           {matcherError}
                        </div>
                     ) : null}
                     <Detail label="Contributor">
                        {selectedContribution.contributor
                           ? `${selectedContribution.contributor.displayName ?? selectedContribution.contributor.username} (@${selectedContribution.contributor.username})`
                           : "Unknown user"}
                     </Detail>
                     <Detail label="Submitted">{formatDate(selectedContribution.createdAt)}</Detail>
                     {rejectError ? (
                        <div role="alert" className="text-negative-300 text-sm">
                           Rejection failed: {rejectError}
                        </div>
                     ) : null}
                  </div>
               ) : (
                  <div className="text-text/40 flex min-h-40 flex-1 items-center justify-center px-6 text-center">Select a contribution from the queue.</div>
               )}
            </section>

            <section className="bg-surface-alt flex h-full min-h-128 min-w-[min(100%,24rem)] flex-[1.35_1_24rem] flex-col overflow-hidden rounded-xl">
               <div className="p-3">
                  <h2 className="font-semibold text-white">IGDB candidates</h2>
                  <p className="text-text/70 mb-3 text-xs">Search and assign the corresponding game</p>
                  <HuginnInput
                     placeholder="Search IGDB"
                     value={searchQuery}
                     onChange={(event) => setSearchQuery(event.target.value)}
                     disabled={!selectedContribution}
                     hideMessage
                  >
                     <HuginnInput.Wrapper className="bg-surface-deep relative flex h-10 items-center rounded-md">
                        <IconMingcuteSearch2Fill className="text-primary-500 ml-2 size-5 shrink-0" />
                        <HuginnInput.Input className="text-sm" />
                        {searchQuery && (
                           <button className="mx-2 shrink-0 cursor-pointer" onClick={() => setSearchQuery("")}>
                              <IconMingcuteCloseFill className="size-5" />
                           </button>
                        )}
                        {searchLoading ? <HuginnLoadingIcon className="text-primary-500 mx-2 size-5" /> : null}
                     </HuginnInput.Wrapper>
                  </HuginnInput>
                  {searchError ? (
                     <div role="alert" className="text-negative-300 mt-2 text-sm">
                        IGDB action failed: {searchError}
                     </div>
                  ) : null}
               </div>
               <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
                  {candidates.map((candidate) => (
                     <article key={candidate.id} className="bg-surface flex gap-3 rounded-lg p-3 shadow-sm">
                        {candidate.coverUrl ? (
                           <img src={candidate.coverUrl} alt="" className="h-28 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                        ) : (
                           <div className="bg-surface-deep text-text/30 flex h-28 w-20 shrink-0 items-center justify-center rounded-lg">
                              <IconMingcutePicFill className="size-7" />
                           </div>
                        )}
                        <div className="min-w-0 flex-1">
                           <div className="flex gap-2">
                              <div className="font-semibold text-white">{candidate.name}</div>
                              {candidate.rating !== null ? (
                                 <div className="bg-primary-900 ml-auto h-fit rounded-sm px-1.5 py-0.5 text-xs font-medium text-white">
                                    {Math.round(candidate.rating)}%
                                 </div>
                              ) : null}
                           </div>
                           <div className="text-text/50 mt-0.5 text-xs">
                              {formatReleaseDate(candidate.firstReleaseDate)}
                              {candidate.developers.length ? ` · ${candidate.developers.join(", ")}` : ""}
                           </div>
                           <div className="text-text/70 mt-2 line-clamp-2 text-xs">{candidate.summary ?? "No summary available."}</div>
                           <div className="mt-2 flex flex-wrap gap-1">
                              {[...candidate.genres, ...candidate.platforms].slice(0, 5).map((label) => (
                                 <span key={label} className="bg-surface-deep text-text/70 text-tiny rounded-sm px-1.5 py-0.5">
                                    {label}
                                 </span>
                              ))}
                           </div>
                           <div className="mt-3 flex items-center gap-2">
                              {candidate.url ? (
                                 <a href={candidate.url} target="_blank" rel="noreferrer" className="text-primary-500 text-xs hover:underline">
                                    IGDB page
                                 </a>
                              ) : null}
                              <HuginnButton
                                 type="button"
                                 color="primary"
                                 onClick={() => handleSelectCandidate(candidate)}
                                 className="ml-auto h-8 px-3 text-sm font-medium"
                              >
                                 Use this game
                              </HuginnButton>
                           </div>
                        </div>
                     </article>
                  ))}
                  {!searchLoading && selectedContribution && searchQuery.trim().length >= 2 && candidates.length === 0 && !searchError ? (
                     <div className="text-text/40 flex min-h-40 items-center justify-center px-6 text-center">No IGDB candidates found.</div>
                  ) : null}
                  {!selectedContribution ? (
                     <div className="text-text/40 flex min-h-40 items-center justify-center px-6 text-center">Select a contribution to search IGDB.</div>
                  ) : null}
               </div>
            </section>
         </main>

         <HuginnDialog
            open={candidateToAccept !== undefined}
            onOpenChange={(open) => {
               if (!open && !isAccepting) setCandidateToAccept(undefined);
            }}
         >
            <HuginnDialog.Backdrop />
            <HuginnDialog.Viewport>
               <HuginnDialogPanel className="max-w-md">
                  <ModalCloseButton disabled={isAccepting} onClick={() => setCandidateToAccept(undefined)} iconClassName="size-5" />
                  <DialogBody>
                     <HuginnDialog.Title>Confirm game match</HuginnDialog.Title>
                     <div className="text-text/70">
                        Match <strong className="font-semibold text-white">{selectedContribution?.windowTitle}</strong> to{" "}
                        <strong className="font-semibold text-white">{candidateToAccept?.name}</strong>? This publishes the matcher to the application catalog.
                     </div>
                     <div className="bg-surface-deep rounded-lg p-3 text-sm">
                        <div className="text-text/60 text-xs font-medium uppercase">Executable names</div>
                        <div className="font-ubuntu mt-1 break-all whitespace-pre-wrap text-white">
                           {parseMatcherValues(exeNamesInput).join("\n") || "None"}
                        </div>
                        <div className="text-text/60 mt-3 text-xs font-medium uppercase">Window titles</div>
                        <div className="mt-1 break-all whitespace-pre-wrap text-white">{parseMatcherValues(windowTitlesInput).join("\n") || "None"}</div>
                        {commandLinePatternsInput.trim() && (
                           <>
                              <div className="text-text/60 mt-3 text-xs font-medium uppercase">Command line patterns</div>
                              <div className="font-ubuntu mt-1 break-all whitespace-pre-wrap text-white">
                                 {parseMatcherValues(commandLinePatternsInput).join("\n") || "None"}
                              </div>
                           </>
                        )}
                     </div>
                  </DialogBody>
                  <DialogActions>
                     <HuginnButton color="surface" className="w-full" disabled={isAccepting} onClick={() => setCandidateToAccept(undefined)}>
                        Cancel
                     </HuginnButton>
                     <HuginnLoadingButton isLoading={isAccepting} className="h-10 w-full" color="primary" onClick={() => void handleConfirmCandidate()}>
                        Confirm match
                     </HuginnLoadingButton>
                  </DialogActions>
               </HuginnDialogPanel>
            </HuginnDialog.Viewport>
         </HuginnDialog>
      </div>
   );
}
