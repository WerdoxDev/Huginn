import { HuginnIcon, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { useTheme } from "@stores/themeStore";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type SubmitEvent } from "react";

import { getStaffMe } from "@/lib/api";
import { cleanStaffToken, clearStaffToken, getStoredStaffToken, storeStaffToken } from "@/lib/auth";

export const Route = createFileRoute("/staff/login")({
   component: LoginComponent,
});

function LoginComponent() {
   const navigate = useNavigate();
   const { themeType } = useTheme();
   const [tokenInput, setTokenInput] = useState("");
   const [checking, setChecking] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      const storedToken = getStoredStaffToken();
      if (!storedToken) {
         setChecking(false);
         return;
      }

      void verify(storedToken);
   }, []);

   async function verify(value: string) {
      const token = cleanStaffToken(value);
      if (!token) return;

      setChecking(true);
      setError("");
      try {
         await getStaffMe(token);
         storeStaffToken(token);
         await navigate({ to: "/staff/game-contributions", replace: true });
      } catch (cause) {
         clearStaffToken();
         setError(cause instanceof Error ? cause.message : "The token could not be verified.");
      } finally {
         setChecking(false);
      }
   }

   function submit(event: SubmitEvent) {
      event.preventDefault();
      void verify(tokenInput);
   }

   return (
      <main className="staff-interface bg-surface-deep text-text flex min-h-dvh items-center justify-center p-5">
         <form onSubmit={submit} className="bg-surface w-full max-w-96 rounded-lg p-5 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
               <HuginnIcon themeType={themeType} alt="Huginn" className="size-12" outlined />
               <div>
                  <h1 className="text-2xl font-medium text-white">Huginn staff</h1>
                  <p className="text-text/70 text-sm">Authenticate with a Huginn access token.</p>
               </div>
            </div>
            <HuginnInput
               value={tokenInput}
               onChange={(event) => setTokenInput(event.target.value)}
               type="password"
               autoFocus
               placeholder="Paste token"
               message={{ status: error ? "error" : "none", text: error ? `Token verification failed: ${error}` : "" }}
            >
               <HuginnInput.Label>Staff token</HuginnInput.Label>
               <HuginnInput.Wrapper>
                  <HuginnInput.Input className="font-ubuntu" />
               </HuginnInput.Wrapper>
            </HuginnInput>
            <HuginnLoadingButton
               type="submit"
               color="primary"
               isLoading={checking}
               disabled={checking || !tokenInput.trim()}
               className="mt-5 h-10 w-full gap-2 px-4 font-medium disabled:text-white/50"
               iconClassName="size-5"
            >
               Verify token
            </HuginnLoadingButton>
         </form>
      </main>
   );
}
