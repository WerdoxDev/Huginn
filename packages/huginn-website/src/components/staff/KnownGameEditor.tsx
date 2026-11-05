import type { APIIGDBGameCandidate, APIStaffKnownGame } from "@huginnjs/shared";

import { useStaffSession } from "@contexts/StaffSessionContext";
import {
   DialogActions,
   DialogBody,
   HuginnButton,
   HuginnDialog,
   HuginnDialogPanel,
   HuginnInput,
   HuginnLoadingButton,
   HuginnLoadingIcon,
   ModalCloseButton,
} from "@huginn/frontend-shared";
import { useEffect, useState } from "react";

import { searchIGDB, updateKnownGame } from "@/lib/api";

export default function KnownGameEditor({
   game,
   onClose,
   onSave,
}: {
   game: APIStaffKnownGame;
   onClose: () => void;
   onSave: (game: APIStaffKnownGame) => void;
}) {
   const { token } = useStaffSession();
   const [query, setQuery] = useState(game.canonicalName);
   const [candidates, setCandidates] = useState<APIIGDBGameCandidate[]>([]);
   const [selected, setSelected] = useState<APIIGDBGameCandidate>();
   const [isSearching, setSearching] = useState(false);
   const [searchError, setSearchError] = useState("");
   const [isSaving, setSaving] = useState(false);
   const [saveError, setSaveError] = useState("");

   useEffect(() => {
      const controller = new AbortController();
      setCandidates([]);
      setSearchError("");
      setSearching(false);
      if (query.trim().length < 2) return;
      setSearching(true);
      const timeout = window.setTimeout(async () => {
         try {
            const result = await searchIGDB(token, query.trim(), controller.signal);
            if (!controller.signal.aborted) setCandidates(result.games);
         } catch (error) {
            if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "IGDB search failed.");
         } finally {
            if (!controller.signal.aborted) setSearching(false);
         }
      }, 350);
      return () => {
         window.clearTimeout(timeout);
         controller.abort();
      };
   }, [query, token]);

   async function save() {
      if (!selected) return;
      setSaving(true);
      setSaveError("");
      try {
         onSave(await updateKnownGame(token, game.id, { igdbId: selected.id }));
      } catch (error) {
         setSaveError(error instanceof Error ? error.message : "The game could not be updated.");
      } finally {
         setSaving(false);
      }
   }

   return (
      <HuginnDialog
         open
         onOpenChange={(open) => {
            if (!open && !isSaving) onClose();
         }}
      >
         <HuginnDialog.Backdrop />
         <HuginnDialog.Viewport>
            <HuginnDialogPanel className="flex max-h-[90dvh] max-w-2xl flex-col">
               <ModalCloseButton disabled={isSaving} onClick={onClose} iconClassName="size-5" />
               <DialogBody className="scroll-thin min-h-0 overflow-y-auto">
                  <div className="pr-6">
                     <HuginnDialog.Title>Edit known game</HuginnDialog.Title>
                     <HuginnDialog.Description className="mt-1">
                        Change the IGDB reference for {game.canonicalName}. Its name and aliases will update from IGDB. All matchers stay linked to this game.
                     </HuginnDialog.Description>
                  </div>
                  <div className="bg-surface-deep rounded-lg p-3 text-sm">
                     <div className="text-text/60 text-xs">Current reference</div>
                     <div className="mt-1 font-semibold text-white">
                        {game.canonicalName} <span className="text-text/50 font-normal">· IGDB #{game.igdbId}</span>
                     </div>
                  </div>
                  <HuginnInput value={query} onChange={(event) => setQuery(event.target.value)} disabled={isSaving} placeholder="Search IGDB" hideMessage>
                     <HuginnInput.Label>Search IGDB</HuginnInput.Label>
                     <HuginnInput.Wrapper className="bg-surface-deep relative flex h-10 items-center rounded-md">
                        <IconMingcuteSearch2Fill className="text-primary-500 ml-2 size-5 shrink-0" />
                        <HuginnInput.Input className="text-sm" />
                        {isSearching ? <HuginnLoadingIcon className="text-primary-500 mx-2 size-5" /> : null}
                     </HuginnInput.Wrapper>
                  </HuginnInput>
                  {searchError ? (
                     <div role="alert" className="text-negative-300 text-sm">
                        IGDB search failed: {searchError}
                     </div>
                  ) : null}
                  <div className="space-y-3">
                     {candidates.map((candidate) => (
                        <article key={candidate.id} className="bg-surface-deep flex gap-3 rounded-lg p-3">
                           {candidate.coverUrl ? (
                              <img src={candidate.coverUrl} alt="" className="h-28 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                           ) : (
                              <div className="bg-surface-alt text-text/30 flex h-28 w-20 shrink-0 items-center justify-center rounded-lg">
                                 <IconMingcutePicFill className="size-7" />
                              </div>
                           )}
                           <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white">{candidate.name}</div>
                              <div className="text-text/50 mt-0.5 text-xs">
                                 IGDB #{candidate.id}
                                 {candidate.firstReleaseDate ? ` · ${new Date(candidate.firstReleaseDate * 1_000).getFullYear()}` : ""}
                                 {candidate.developers.length ? ` · ${candidate.developers.join(", ")}` : ""}
                              </div>
                              <div className="text-text/70 mt-2 line-clamp-2 text-xs">{candidate.summary ?? "No summary available."}</div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                 {candidate.url ? (
                                    <a href={candidate.url} target="_blank" rel="noreferrer" className="text-primary-500 text-xs hover:underline">
                                       IGDB page
                                    </a>
                                 ) : null}
                                 <HuginnButton
                                    type="button"
                                    color={selected?.id === candidate.id ? "primary" : "surface-alt"}
                                    className="ml-auto h-8 px-3 text-sm"
                                    disabled={isSaving || candidate.id === game.igdbId}
                                    aria-pressed={selected?.id === candidate.id}
                                    onClick={() => {
                                       setSelected(candidate);
                                       setSaveError("");
                                    }}
                                 >
                                    {candidate.id === game.igdbId ? "Current game" : selected?.id === candidate.id ? "Selected" : "Use this game"}
                                 </HuginnButton>
                              </div>
                           </div>
                        </article>
                     ))}
                     {!isSearching && !searchError && candidates.length === 0 ? (
                        <div className="text-text/50 py-6 text-center text-sm">
                           {query.trim().length < 2 ? "Enter at least two characters to search IGDB." : "No IGDB candidates found."}
                        </div>
                     ) : null}
                  </div>
                  {selected ? (
                     <div className="bg-primary-900/40 rounded-lg p-3 text-sm text-white">
                        New reference: <strong>{selected.name}</strong> · IGDB #{selected.id}
                     </div>
                  ) : null}
                  {saveError ? (
                     <div role="alert" className="text-negative-300 text-sm">
                        Saving failed: {saveError}
                     </div>
                  ) : null}
               </DialogBody>
               <DialogActions className="shrink-0">
                  <HuginnButton type="button" color="surface" className="h-10 w-full" disabled={isSaving} onClick={onClose}>
                     Cancel
                  </HuginnButton>
                  <HuginnLoadingButton
                     type="button"
                     color="primary"
                     className="h-10 w-full"
                     isLoading={isSaving}
                     disabled={!selected}
                     onClick={() => void save()}
                  >
                     Save changes
                  </HuginnLoadingButton>
               </DialogActions>
            </HuginnDialogPanel>
         </HuginnDialog.Viewport>
      </HuginnDialog>
   );
}
