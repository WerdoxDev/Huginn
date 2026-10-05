import type { APIStaffKnownGame } from "@huginnjs/shared";

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

import { StaffAPIError, deleteKnownGame, getKnownGames } from "@/lib/api";
import { clearStaffToken } from "@/lib/auth";

function formatDate(value: Date | string) {
   return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function KnownGamesPanel() {
   const { token } = useStaffSession();
   const [games, setGames] = useState<APIStaffKnownGame[]>([]);
   const [query, setQuery] = useState("");
   const [loading, setLoading] = useState(false);
   const [loadError, setLoadError] = useState("");
   const [gameToDelete, setGameToDelete] = useState<APIStaffKnownGame>();
   const [deleting, setDeleting] = useState(false);
   const [deleteError, setDeleteError] = useState("");

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
               <h1 className="text-lg font-bold text-white">Known games</h1>
               <p className="text-text/70 text-xs">Browse and remove games from the application catalog</p>
            </div>
         </div>

         <main className="scroll-surface-deep min-h-0 flex-1 overflow-y-auto p-3">
            <section className="bg-surface-alt mx-auto flex min-h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl">
               <div className="flex flex-wrap items-center gap-3 p-3">
                  <div>
                     <h2 className="font-semibold text-white">Game catalog</h2>
                     <p className="text-text/70 text-xs">{query.trim() ? `${filteredGames.length} of ${games.length}` : games.length} games</p>
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
                           <button type="button" aria-label="Clear search" className="mx-2 shrink-0 cursor-pointer" onClick={() => setQuery("")}>
                              <IconMingcuteCloseFill className="size-5" />
                           </button>
                        ) : null}
                     </HuginnInput.Wrapper>
                  </HuginnInput>
                  <HuginnButton
                     type="button"
                     color="surface-deep"
                     className="flex size-10 shrink-0 items-center justify-center"
                     aria-label="Refresh known games"
                     disabled={loading}
                     onClick={() => void loadGames(token)}
                  >
                     {loading ? <HuginnLoadingIcon className="size-5" /> : <IconMingcuteRefresh2Fill className="size-5" />}
                  </HuginnButton>
               </div>

               {loadError ? (
                  <div role="alert" className="bg-negative-500/10 text-negative-300 mx-3 mb-3 rounded-md px-3 py-2 text-sm">
                     Loading known games failed: {loadError}
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
                                 <p className="text-text/60 mt-1 text-xs">
                                    Added {formatDate(game.createdAt)} · {game.matchers.length} {game.matchers.length === 1 ? "matcher" : "matchers"}
                                 </p>
                                 {game.aliases.length ? <p className="text-text/70 mt-2 text-sm">Aliases: {game.aliases.join(", ")}</p> : null}
                              </div>
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

                           {game.matchers.length ? (
                              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                 {game.matchers.map((matcher) => (
                                    <div key={matcher.id} className="bg-surface-deep rounded-md p-3 text-xs">
                                       <div className="flex items-center gap-2">
                                          <span className="font-medium text-white">{matcher.platform}</span>
                                          <span className="text-text/50">Matcher #{matcher.id}</span>
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

                     {!loading && games.length === 0 && !loadError ? (
                        <div className="text-text/40 flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                           <IconMingcuteGame2Fill className="size-8" />
                           <div>No known games in the catalog.</div>
                        </div>
                     ) : null}
                     {!loading && games.length > 0 && filteredGames.length === 0 ? (
                        <div className="text-text/40 flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                           <IconMingcuteSearch2Fill className="size-8" />
                           <div>No known games match “{query.trim()}”.</div>
                        </div>
                     ) : null}
                  </div>
                  {loading ? (
                     <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40" aria-live="polite" aria-label="Loading known games">
                        <HuginnLoadingIcon className="text-primary-500 size-10" />
                     </div>
                  ) : null}
               </div>
            </section>
         </main>

         <HuginnDialog
            open={gameToDelete !== undefined}
            onOpenChange={(open) => {
               if (!open && !deleting) setGameToDelete(undefined);
            }}
         >
            <HuginnDialog.Backdrop />
            <HuginnDialog.Viewport>
               <HuginnDialogPanel className="max-w-md">
                  <ModalCloseButton disabled={deleting} onClick={() => setGameToDelete(undefined)} iconClassName="size-5" />
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
                     <HuginnButton color="surface" className="h-10 w-full" disabled={deleting} onClick={() => setGameToDelete(undefined)}>
                        Cancel
                     </HuginnButton>
                     <HuginnLoadingButton color="negative" className="h-10 w-full" isLoading={true} onClick={() => void handleDelete()}>
                        Delete game
                     </HuginnLoadingButton>
                  </DialogActions>
               </HuginnDialogPanel>
            </HuginnDialog.Viewport>
         </HuginnDialog>
      </div>
   );
}
