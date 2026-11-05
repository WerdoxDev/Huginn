import type { APIApplicationMatcher, APIStaffKnownGame } from "@huginnjs/shared";

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
import { useEffect, useMemo, useState } from "react";

import { StaffAPIError, deleteKnownGame, getApplicationIconUrl, getKnownGames } from "@/lib/api";
import { clearStaffToken } from "@/lib/auth";

import KnownGameEditor from "./KnownGameEditor";
import KnownGameMatcherEditor from "./KnownGameMatcherEditor";

function formatDate(value: Date | string) {
   return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function KnownGamesPanel() {
   const { token } = useStaffSession();
   const [games, setGames] = useState<APIStaffKnownGame[]>([]);
   const [query, setQuery] = useState("");
   const [isLoading, setLoading] = useState(false);
   const [loadError, setLoadError] = useState("");
   const [gameToDelete, setGameToDelete] = useState<APIStaffKnownGame>();
   const [isDeleting, setDeleting] = useState(false);
   const [deleteError, setDeleteError] = useState("");
   const [gameToEdit, setGameToEdit] = useState<APIStaffKnownGame>();
   const [matcherToEdit, setMatcherToEdit] = useState<{ game: APIStaffKnownGame; matcher: APIApplicationMatcher }>();
   const [saveMessage, setSaveMessage] = useState("");

   const filteredGames = useMemo(() => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      if (!normalizedQuery) return games;

      return games.filter((game) =>
         [
            game.id.toString(),
            game.igdbId.toString(),
            game.canonicalName,
            ...game.aliases,
            ...game.matchers.flatMap((matcher) => [matcher.platform, ...matcher.exeNames, ...matcher.windowTitles, ...matcher.commandLinePatterns]),
         ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
      );
   }, [games, query]);

   useEffect(() => {
      void loadGames(token);
   }, [token]);

   async function loadGames(activeToken: string) {
      setLoading(true);
      setLoadError("");
      try {
         const result = await getKnownGames(activeToken);
         setGames(result.games);
      } catch (error) {
         if (error instanceof StaffAPIError && (error.status === 401 || error.status === 403)) {
            clearStaffToken();
            window.location.assign("/staff/login");
         }
         setLoadError(error instanceof Error ? error.message : "Known games could not be loaded.");
      } finally {
         setLoading(false);
      }
   }

   async function handleDelete() {
      if (!gameToDelete) return;

      setDeleting(true);
      setDeleteError("");
      try {
         await deleteKnownGame(token, gameToDelete.id);
         setGames((currentGames) => currentGames.filter((game) => game.id !== gameToDelete.id));
         setGameToDelete(undefined);
      } catch (error) {
         setDeleteError(error instanceof Error ? error.message : "The game could not be deleted.");
      } finally {
         setDeleting(false);
      }
   }

   return (
      <div className="flex h-full min-h-0 flex-col">
         <div className="border-surface bg-surface-deep flex h-16 shrink-0 items-center border-b-2 px-5">
            <div>
               <div className="text-lg font-bold text-white">Known games</div>
               <div className="text-text/70 text-xs">Manage games, IGDB references, and detection matchers</div>
            </div>
         </div>

         <main className="scroll-surface-deep min-h-0 flex-1 overflow-y-auto p-3">
            <section className="bg-surface-alt mx-auto flex min-h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl">
               <div className="flex flex-wrap items-center gap-3 p-3">
                  <div>
                     <div className="font-semibold text-white">Game catalog</div>
                     <div className="text-text/70 text-xs">{query.trim() ? `${filteredGames.length} of ${games.length}` : games.length} games</div>
                  </div>
                  <HuginnInput
                     placeholder="Search known games"
                     value={query}
                     onChange={(event) => setQuery(event.target.value)}
                     hideMessage
                     className="ml-auto w-72"
                  >
                     <HuginnInput.Wrapper className="bg-surface-deep relative flex h-10 items-center rounded-md">
                        <IconMingcuteSearch2Fill className="text-primary-500 ml-2 size-5 shrink-0" />
                        <HuginnInput.Input className="text-sm" />
                        {query ? (
                           <button type="button" className="mx-2 shrink-0 cursor-pointer" onClick={() => setQuery("")}>
                              <IconMingcuteCloseFill className="size-5" />
                           </button>
                        ) : null}
                     </HuginnInput.Wrapper>
                  </HuginnInput>
                  <HuginnButton
                     type="button"
                     color="surface-deep"
                     className="flex size-10 shrink-0 items-center justify-center"
                     disabled={isLoading}
                     onClick={() => void loadGames(token)}
                  >
                     {isLoading ? <HuginnLoadingIcon className="size-5" /> : <IconMingcuteRefresh2Fill className="size-5" />}
                  </HuginnButton>
               </div>

               {loadError ? (
                  <div role="alert" className="bg-negative-500/10 text-negative-300 mx-3 mb-3 rounded-md px-3 py-2 text-sm">
                     Loading known games failed: {loadError}
                  </div>
               ) : null}

               {saveMessage ? (
                  <div role="status" className="bg-positive-500/10 text-positive-300 mx-3 mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                     <span className="flex-1">{saveMessage}</span>
                     <button type="button" aria-label="Dismiss update message" className="cursor-pointer" onClick={() => setSaveMessage("")}>
                        <IconMingcuteCloseFill className="size-4" />
                     </button>
                  </div>
               ) : null}

               <div className="relative min-h-80 flex-1">
                  <div className="scroll-thin absolute inset-0 space-y-3 overflow-y-auto px-3 pb-3">
                     {filteredGames.map((game) => (
                        <article key={game.id} className="bg-surface rounded-lg p-4">
                           <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                 <div className="flex flex-wrap items-baseline gap-x-2">
                                    <h3 className="text-base font-semibold text-white">{game.canonicalName}</h3>
                                    <span className="text-text/50 text-xs">IGDB #{game.igdbId}</span>
                                 </div>
                                 <div className="text-text/60 mt-1 text-xs">
                                    Added {formatDate(game.createdAt)} · {game.matchers.length} {game.matchers.length === 1 ? "matcher" : "matchers"}
                                 </div>
                                 {game.aliases.length ? <div className="text-text/70 mt-2 text-sm">Aliases: {game.aliases.join(", ")}</div> : null}
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                 <HuginnButton
                                    type="button"
                                    color="surface-deep"
                                    className="flex h-9 items-center gap-2 px-3 text-sm"
                                    onClick={() => setGameToEdit(game)}
                                 >
                                    <IconMingcuteEdit2Fill className="size-4" />
                                    Edit game
                                 </HuginnButton>
                                 <HuginnButton
                                    type="button"
                                    color="negative"
                                    className="flex h-9 shrink-0 items-center gap-2 px-3 text-sm"
                                    onClick={() => {
                                       setDeleteError("");
                                       setGameToDelete(game);
                                    }}
                                 >
                                    <IconMingcuteDelete3Fill className="size-4" />
                                    Delete
                                 </HuginnButton>
                              </div>
                           </div>

                           {game.matchers.length ? (
                              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                 {game.matchers.map((matcher) => (
                                    <div key={matcher.id} className="bg-surface-deep rounded-md p-3 text-xs">
                                       <div className="flex items-center gap-2">
                                          {matcher.iconHash ? (
                                             <img
                                                src={getApplicationIconUrl(matcher.knownGameId, matcher.iconHash)}
                                                alt=""
                                                width={32}
                                                height={32}
                                                loading="lazy"
                                                className="size-8 shrink-0 rounded-md object-contain"
                                             />
                                          ) : (
                                             <div
                                                className="bg-surface text-text/40 flex size-8 shrink-0 items-center justify-center rounded-md"
                                                aria-hidden="true"
                                             >
                                                <IconMingcuteGame2Fill className="size-5" />
                                             </div>
                                          )}
                                          <span className="font-medium text-white">{matcher.platform}</span>
                                          <span className="text-text/50">Matcher #{matcher.id}</span>
                                          <HuginnButton
                                             type="button"
                                             color="surface"
                                             className="ml-auto flex h-8 shrink-0 items-center gap-1.5 px-2 text-xs"
                                             aria-label={`Edit matcher #${matcher.id} for ${game.canonicalName}`}
                                             onClick={() => setMatcherToEdit({ game, matcher })}
                                          >
                                             <IconMingcuteEdit2Fill className="size-3.5" />
                                             Edit
                                          </HuginnButton>
                                       </div>
                                       <div className="text-text/70 mt-2 space-y-1 break-all">
                                          {matcher.exeNames.length ? <div>Executables: {matcher.exeNames.join(", ")}</div> : null}
                                          {matcher.windowTitles.length ? <div>Titles: {matcher.windowTitles.join(", ")}</div> : null}
                                          {matcher.commandLinePatterns.length ? <div>Commands: {matcher.commandLinePatterns.join(", ")}</div> : null}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="text-text/50 mt-3 text-xs">No active matchers.</div>
                           )}
                        </article>
                     ))}

                     {!isLoading && games.length === 0 && !loadError ? (
                        <div className="text-text/40 flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                           <IconMingcuteGame2Fill className="size-8" />
                           <div>No known games in the catalog.</div>
                        </div>
                     ) : null}
                     {!isLoading && games.length > 0 && filteredGames.length === 0 ? (
                        <div className="text-text/40 flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                           <IconMingcuteSearch2Fill className="size-8" />
                           <div>No known games match “{query.trim()}”.</div>
                        </div>
                     ) : null}
                  </div>
                  {isLoading ? (
                     <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                        <HuginnLoadingIcon className="text-primary-500 size-10" />
                     </div>
                  ) : null}
               </div>
            </section>
         </main>

         {gameToEdit ? (
            <KnownGameEditor
               key={gameToEdit.id}
               game={gameToEdit}
               onClose={() => setGameToEdit(undefined)}
               onSave={(updated) => {
                  setGames((current) =>
                     current
                        .map((game) => (game.id === updated.id ? updated : game))
                        .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName)),
                  );
                  setGameToEdit(undefined);
                  setSaveMessage("Game updated. Connected clients have been notified.");
               }}
            />
         ) : null}
         {matcherToEdit ? (
            <KnownGameMatcherEditor
               key={matcherToEdit.matcher.id}
               game={matcherToEdit.game}
               matcher={matcherToEdit.matcher}
               onClose={() => setMatcherToEdit(undefined)}
               onSave={(updated) => {
                  setGames((current) =>
                     current.map((game) =>
                        game.id === updated.knownGameId
                           ? { ...game, matchers: game.matchers.map((matcher) => (matcher.id === updated.id ? updated : matcher)) }
                           : game,
                     ),
                  );
                  setMatcherToEdit(undefined);
                  setSaveMessage("Matcher updated. Connected clients have been notified.");
               }}
            />
         ) : null}

         <HuginnDialog
            open={gameToDelete !== undefined}
            onOpenChange={(open) => {
               if (!open && !isDeleting) setGameToDelete(undefined);
            }}
         >
            <HuginnDialog.Backdrop />
            <HuginnDialog.Viewport>
               <HuginnDialogPanel className="max-w-md">
                  <ModalCloseButton disabled={isDeleting} onClick={() => setGameToDelete(undefined)} iconClassName="size-5" />
                  <DialogBody>
                     <HuginnDialog.Title>Delete known game</HuginnDialog.Title>
                     <div className="text-text/70">
                        Delete <strong className="font-semibold text-white">{gameToDelete?.canonicalName}</strong> and its {gameToDelete?.matchers.length ?? 0}{" "}
                        active {(gameToDelete?.matchers.length ?? 0) === 1 ? "matcher" : "matchers"} from the application catalog?
                     </div>
                     {deleteError ? (
                        <div role="alert" className="text-negative-300 text-sm">
                           Deletion failed: {deleteError}
                        </div>
                     ) : null}
                  </DialogBody>
                  <DialogActions>
                     <HuginnButton color="surface" className="h-10 w-full" disabled={isDeleting} onClick={() => setGameToDelete(undefined)}>
                        Cancel
                     </HuginnButton>
                     <HuginnLoadingButton color="negative" className="h-10 w-full" isLoading={isDeleting} onClick={() => void handleDelete()}>
                        Delete game
                     </HuginnLoadingButton>
                  </DialogActions>
               </HuginnDialogPanel>
            </HuginnDialog.Viewport>
         </HuginnDialog>
      </div>
   );
}
