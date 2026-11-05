import type { APIApplicationMatcher, APIStaffKnownGame } from "@huginnjs/shared";

import { useStaffSession } from "@contexts/StaffSessionContext";
import {
   DialogActions,
   DialogBody,
   HuginnButton,
   HuginnDialog,
   HuginnDialogPanel,
   HuginnLabel,
   HuginnLoadingButton,
   HuginnSelect,
   HuginnTextArea,
   ModalCloseButton,
} from "@huginn/frontend-shared";
import { useRef, useState } from "react";

import { getApplicationIconUrl, updateKnownGameMatcher } from "@/lib/api";

function parseValues(value: string) {
   return [
      ...new Set(
         value
            .split(/\r?\n/)
            .map((entry) => entry.trim())
            .filter(Boolean),
      ),
   ];
}

export default function KnownGameMatcherEditor({
   game,
   matcher,
   onClose,
   onSave,
}: {
   game: APIStaffKnownGame;
   matcher: APIApplicationMatcher;
   onClose: () => void;
   onSave: (matcher: APIApplicationMatcher) => void;
}) {
   const { token } = useStaffSession();
   const [exeNames, setExeNames] = useState(matcher.exeNames.join("\n"));
   const [windowTitles, setWindowTitles] = useState(matcher.windowTitles.join("\n"));
   const [commandLinePatterns, setCommandLinePatterns] = useState(matcher.commandLinePatterns.join("\n"));
   const [platform, setPlatform] = useState(matcher.platform);
   const [icon, setIcon] = useState<string>();
   const [isReadingIcon, setReadingIcon] = useState(false);
   const [isSaving, setSaving] = useState(false);
   const [error, setError] = useState("");
   const fileInput = useRef<HTMLInputElement>(null);
   const busy = isSaving || isReadingIcon;
   const platforms = [
      { value: "win32", text: "Windows" },
      { value: "linux", text: "Linux" },
      { value: "darwin", text: "macOS" },
      { value: "unknown", text: "Unknown" },
   ];
   if (!platforms.some((item) => item.value === matcher.platform)) platforms.push({ value: matcher.platform, text: matcher.platform });
   const iconUrl = icon ?? (matcher.iconHash ? getApplicationIconUrl(game.id, matcher.iconHash) : undefined);

   async function selectIcon(file?: File) {
      if (!file) return;
      setError("");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1_024 * 1_024) {
         setError("Choose a PNG, JPEG, or WebP image up to 2 MB.");
         return;
      }
      setReadingIcon(true);
      try {
         const value = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("The icon could not be read."));
            reader.readAsDataURL(file);
         });
         setIcon(value);
      } catch (error) {
         setError(error instanceof Error ? error.message : "The icon could not be read.");
      } finally {
         setReadingIcon(false);
      }
   }

   async function save() {
      const rules = {
         exeNames: parseValues(exeNames.replaceAll("\\", "/")),
         windowTitles: parseValues(windowTitles),
         commandLinePatterns: parseValues(commandLinePatterns),
      };
      setError("");
      if (!rules.exeNames.length && !rules.windowTitles.length) {
         setError("At least one executable name or window title is required.");
         return;
      }
      if (
         rules.exeNames.some((value) => {
            const parts = value.split("/");
            return parts.length > 2 || parts.some((part) => !part || part === "." || part === "..");
         })
      ) {
         setError("Executable names may include at most one parent folder.");
         return;
      }
      if (Object.values(rules).some((values) => values.length > 50 || values.some((value) => value.length > 1_024))) {
         setError("Each matcher field allows up to 50 entries, with at most 1,024 characters per entry.");
         return;
      }
      setSaving(true);
      try {
         onSave(await updateKnownGameMatcher(token, game.id, matcher.id, { ...rules, platform, ...(icon ? { icon } : {}) }));
      } catch (error) {
         setError(error instanceof Error ? error.message : "The matcher could not be updated.");
      } finally {
         setSaving(false);
      }
   }

   return (
      <HuginnDialog
         open
         onOpenChange={(open) => {
            if (!open && !busy) onClose();
         }}
      >
         <HuginnDialog.Backdrop />
         <HuginnDialog.Viewport>
            <HuginnDialogPanel className="flex max-h-[90dvh] max-w-xl flex-col">
               <ModalCloseButton disabled={busy} onClick={onClose} iconClassName="size-5" />
               <form
                  className="flex min-h-0 flex-col"
                  onSubmit={(event) => {
                     event.preventDefault();
                     if (!busy) void save();
                  }}
               >
                  <DialogBody className="scroll-thin min-h-0 overflow-y-auto">
                     <div className="pr-6">
                        <HuginnDialog.Title>Edit matcher</HuginnDialog.Title>
                        <HuginnDialog.Description className="mt-1">
                           {game.canonicalName} · Matcher #{matcher.id}
                        </HuginnDialog.Description>
                     </div>
                     <div className="bg-surface-deep flex items-center gap-4 rounded-lg p-3">
                        {iconUrl ? (
                           <img src={iconUrl} alt="Matcher icon preview" className="size-16 shrink-0 rounded-lg object-contain" />
                        ) : (
                           <div className="bg-surface-alt text-text/40 flex size-16 shrink-0 items-center justify-center rounded-lg">
                              <IconMingcuteGame2Fill className="size-8" />
                           </div>
                        )}
                        <div>
                           <HuginnLabel>Matcher icon</HuginnLabel>
                           <input
                              ref={fileInput}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              aria-label="Upload matcher icon"
                              disabled={busy}
                              onChange={(event) => {
                                 void selectIcon(event.target.files?.[0]);
                                 event.target.value = "";
                              }}
                           />
                           <div className="flex flex-wrap gap-2">
                              <HuginnButton
                                 type="button"
                                 color="surface-alt"
                                 className="h-8 px-3 text-sm"
                                 disabled={busy}
                                 onClick={() => fileInput.current?.click()}
                              >
                                 {iconUrl ? "Change icon" : "Add icon"}
                              </HuginnButton>
                              {icon ? (
                                 <HuginnButton type="button" color="ghost" className="h-8 px-2 text-xs" disabled={busy} onClick={() => setIcon(undefined)}>
                                    Undo icon change
                                 </HuginnButton>
                              ) : null}
                           </div>
                           <div className="text-text/50 mt-1 text-xs">PNG, JPEG, or WebP · up to 2 MB</div>
                        </div>
                     </div>
                     <HuginnSelect
                        mobile={false}
                        selected={platforms.find((item) => item.value === platform)}
                        onChange={(item) => setPlatform(item.value)}
                        disabled={busy}
                     >
                        <HuginnSelect.Label>Platform</HuginnSelect.Label>
                        <HuginnSelect.List className="bg-surface-deep w-full!">
                           <HuginnSelect.ItemsWrapper positionerClassName="z-50">
                              {platforms.map((item) => (
                                 <HuginnSelect.Item key={item.value} item={item} />
                              ))}
                           </HuginnSelect.ItemsWrapper>
                        </HuginnSelect.List>
                     </HuginnSelect>
                     <div className="text-text/60 text-xs">
                        Enter one value per line. At least one executable name or window title is required. Every command line pattern must be present.
                     </div>
                     {[
                        { label: "Executable names", value: exeNames, setValue: setExeNames, placeholder: "game.exe\nfolder/game.exe" },
                        { label: "Window titles", value: windowTitles, setValue: setWindowTitles, placeholder: "Exact window title" },
                        { label: "Command line patterns", value: commandLinePatterns, setValue: setCommandLinePatterns, placeholder: "--game-id=123" },
                     ].map((field) => (
                        <HuginnTextArea
                           key={field.label}
                           value={field.value}
                           onChange={(event) => {
                              field.setValue(event.target.value);
                              setError("");
                           }}
                           disabled={busy}
                           placeholder={field.placeholder}
                           hideMessage
                        >
                           <HuginnTextArea.Label>{field.label}</HuginnTextArea.Label>
                           <HuginnTextArea.Wrapper className="bg-surface-deep">
                              <HuginnTextArea.TextArea rows={3} className="min-h-20 text-sm" />
                           </HuginnTextArea.Wrapper>
                        </HuginnTextArea>
                     ))}
                     {error ? (
                        <div role="alert" className="text-negative-300 text-sm">
                           {error}
                        </div>
                     ) : null}
                  </DialogBody>
                  <DialogActions className="shrink-0">
                     <HuginnButton type="button" color="surface" className="h-10 w-full" disabled={busy} onClick={onClose}>
                        Cancel
                     </HuginnButton>
                     <HuginnLoadingButton type="submit" color="primary" className="h-10 w-full" isLoading={isSaving} disabled={busy}>
                        Save changes
                     </HuginnLoadingButton>
                  </DialogActions>
               </form>
            </HuginnDialogPanel>
         </HuginnDialog.Viewport>
      </HuginnDialog>
   );
}
