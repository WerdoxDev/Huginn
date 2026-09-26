import { StaffSessionContext } from "@contexts/StaffSessionContext";
import { HuginnIcon, HuginnLoadingIcon } from "@huginn/frontend-shared";
import { useTheme } from "@stores/themeStore";
import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { StaffSession } from "@/types";

import { getStaffMe } from "@/lib/api";
import { clearStaffToken, getStoredStaffToken } from "@/lib/auth";

export const Route = createFileRoute("/staff/_staff")({
   component: StaffLayoutComponent,
});

const staffNavigation = [
   {
      label: "Game contributions",
      description: "Review submitted games",
      icon: IconMingcuteGame2Fill,
      to: "/staff/game-contributions" as const,
   },
];

function StaffLayoutComponent() {
   const navigate = useNavigate();
   const pathname = useRouterState({ select: (state) => state.location.pathname });
   const { themeType } = useTheme();
   const [session, setSession] = useState<StaffSession>();
   const [checking, setChecking] = useState(true);
   const [navigationOpen, setNavigationOpen] = useState(false);

   useEffect(() => {
      const token = getStoredStaffToken();
      if (!token) {
         setChecking(false);
         return;
      }

      void getStaffMe(token)
         .then((user) => setSession({ token, user }))
         .catch(() => clearStaffToken())
         .finally(() => setChecking(false));
   }, []);

   useEffect(() => {
      setNavigationOpen(false);
   }, [pathname]);

   async function logout() {
      clearStaffToken();
      setSession(undefined);
      await navigate({ to: "/staff/login", replace: true });
   }

   if (checking) {
      return (
         <div className="staff-interface bg-surface-deep text-primary-500 flex min-h-dvh items-center justify-center">
            <HuginnLoadingIcon className="size-10" />
         </div>
      );
   }

   if (!session) return <Navigate to="/staff/login" replace />;

   return (
      <StaffSessionContext.Provider value={session}>
         <div className="staff-interface bg-surface-deep text-text flex h-dvh flex-col overflow-hidden">
            <header className="border-surface bg-surface-deep z-40 flex h-16 shrink-0 items-center border-b-2 px-3 shadow-lg md:px-6">
               <button
                  type="button"
                  onClick={() => setNavigationOpen((open) => !open)}
                  aria-label={navigationOpen ? "Close staff navigation" : "Open staff navigation"}
                  aria-expanded={navigationOpen}
                  className="text-text/80 hover:bg-surface-alt hover:text-text mr-2 flex size-10 items-center justify-center rounded-full transition-colors duration-150 md:hidden"
               >
                  {navigationOpen ? <IconMdiClose className="size-6" /> : <IconMaterialSymbolsMenu className="size-6" />}
               </button>
               <HuginnIcon themeType={themeType} alt="Huginn" className="size-10" outlined />
               <div className="ml-3">
                  <div className="leading-tight font-semibold text-white">Huginn staff</div>
                  <div className="text-text/70 text-xs">Internal tools</div>
               </div>
               <div className="ml-auto flex items-center gap-2">
                  <div className="hidden text-right sm:block">
                     <div className="text-sm font-medium text-white">{session.user.displayName ?? session.user.username}</div>
                     <div className="text-text/50 text-xs">@{session.user.username}</div>
                  </div>
                  <button
                     type="button"
                     onClick={() => void logout()}
                     aria-label="Clear staff token and sign out"
                     className="text-text/80 hover:bg-surface-alt hover:text-text flex size-10 items-center justify-center rounded-full transition-colors duration-150"
                     title="Clear staff token"
                  >
                     <IconMingcuteExitFill className="size-6" />
                  </button>
               </div>
            </header>

            <div className="relative flex min-h-0 flex-1">
               {navigationOpen ? (
                  <button
                     type="button"
                     aria-label="Close staff navigation"
                     onClick={() => setNavigationOpen(false)}
                     className="fixed inset-x-0 top-16 bottom-0 z-30 bg-black/50 md:hidden"
                  />
               ) : null}

               <aside
                  className={`border-text/5 bg-surface-alt fixed top-16 bottom-0 left-0 z-40 w-64 shrink-0 border-r shadow-lg transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:shadow-none ${navigationOpen ? "translate-x-0" : "-translate-x-full"}`}
               >
                  <div className="text-text/70 px-3 pt-4 pb-2 text-xs font-medium uppercase">Staff tools</div>
                  <nav className="space-y-1 p-2">
                     {staffNavigation.map((item) => {
                        const active = pathname === item.to;
                        const NavigationIcon = item.icon;
                        return (
                           <Link
                              key={item.to}
                              to={item.to}
                              className={`flex items-center gap-3 rounded-md p-3 transition-colors duration-150 ${active ? "bg-primary-900 text-white" : "text-text/70 hover:bg-surface hover:text-text"}`}
                           >
                              <NavigationIcon className="size-5 shrink-0" aria-hidden="true" />
                              <div className="min-w-0">
                                 <div className="text-sm font-medium">{item.label}</div>
                                 <div className={`truncate text-xs ${active ? "text-white/70" : "text-text/50"}`}>{item.description}</div>
                              </div>
                           </Link>
                        );
                     })}
                  </nav>
               </aside>

               <div className="bg-surface-deep min-h-0 min-w-0 flex-1 overflow-hidden">
                  <Outlet />
               </div>
            </div>
         </div>
      </StaffSessionContext.Provider>
   );
}
