import HuginnButton from "@components/button/HuginnButton";
import HuginnIcon from "@components/HuginnIcon";
import LoadingIcon from "@components/LoadingIcon";
import StartWrapper from "@components/StartWrapper";
import { useConnect } from "@hooks/useConnect";
import { useCountdown } from "@hooks/useCountdown";
import { useUpdater } from "@hooks/useUpdater";
import { initializeClient, setHostnamesFromExternal, setHostnamesFromSettings, useClient } from "@stores/clientStore";
import { useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { animate, createScope } from "animejs";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useReducer, useRef } from "react";

type Step = "none" | "fetch_hostnames" | "check_update" | "initialize" | "update" | "welcome";

type State = {
   current: Step;
   status: "none" | "in-progress" | "error";
   text: string;
   error?: string;
};

type Action = { type: "SET"; step: Step; text: string } | { type: "FAIL"; error?: string };

function getSessionRedirect() {
   const redirect = sessionStorage.getItem("redirect");
   return redirect ? (JSON.parse(redirect) as { pathname: string; requiresAuth: boolean }) : null;
}

function reducer(state: State, action: Action): State {
   switch (action.type) {
      case "SET":
         return {
            current: action.step,
            text: action.text,
            status: "in-progress",
         };
      case "FAIL":
         return { ...state, status: "error", error: action.error };
      default:
         return state;
   }
}

// const searchSchema = z.object({ requireAuth: z.optional(z.string()) });
export const Route = createFileRoute("/_app/_start/")({
   // validateSearch: searchSchema,
   component: IndexComponent,
});

function IndexComponent() {
   const huginnWindow = useHuginnWindow();
   const client = useClient();
   const settings = useStorage("settings");
   // const search = Route.useSearch();

   const posthog = usePostHog();
   const navigate = useNavigate();
   const connect = useConnect();

   const { checkAndDownload, updateInfo, progress, contentLength, downloaded } = useUpdater({
      async onNotAvailable() {
         await setInitialize();
      },
      onError(message) {
         dispatch({ type: "FAIL", error: message });
      },
      onUpdating() {
         dispatch({ type: "SET", step: "update", text: "Updating to" });
      },
   });

   const [state, dispatch] = useReducer(reducer, {
      current: "none",
      status: "none",
      error: "",
      text: "",
   });

   const { startCountdown, countdown } = useCountdown();

   const iconRef = useRef<HTMLDivElement | null>(null);
   const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

   const updateProgressText = useMemo(() => {
      if (huginnWindow.environment === "desktop")
         return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
      if (huginnWindow.environment === "android") return `${Math.ceil(progress)}%`;
   }, [progress]);

   const { errorTitle, errorDescription } = useMemo(() => {
      if (state.status !== "error") {
         return { errorTitle: "Huginn", errorDescription: "" };
      }

      let title = "Couldn't start Huginn :(";
      let description = "An unexpected error occurred while starting Huginn. You can try again in a moment.";

      switch (state.current) {
         case "fetch_hostnames":
            description =
               "We either couldn't reach the specified external hostname or the response was invalid. Please check your settings and internet connection, or try again.";
            break;
         case "check_update":
            description = "We couldn't check for updates. You can retry, or continue using the current version.";
            break;
         case "initialize":
            description = "We couldn't connect to Huginn. Make sure the server is reachable and your settings are correct, then retry.";
            break;
         default:
            break;
      }

      return { errorTitle: title, errorDescription: description };
   }, [state.status, state.current]);

   async function initialize() {
      let redirect = getSessionRedirect();

      if (!redirect?.requiresAuth && redirect?.pathname) {
         sessionStorage.removeItem("redirect");
         await navigate({ to: redirect.pathname, replace: true, viewTransition: true });
         return;
      }

      const result = await connect();
      // redirect could have been set again by push notification after we authenticate
      redirect = getSessionRedirect();

      if (result.success) {
         dispatch({
            type: "SET",
            step: "welcome",
            text: `Welcome ${client?.currentUser?.displayName ?? client?.currentUser?.username}!`,
         });
         sessionStorage.removeItem("redirect");
         await navigate({
            to: redirect?.pathname ?? "/channels/@me",
            replace: true,
            viewTransition: { types: ["forwards"] },
         });
      } else if (result.retryable) {
         dispatch({ type: "FAIL", error: result.status });
      } else {
         await navigate({ to: "/login", replace: true, viewTransition: true });
      }
   }

   function setCheckUpdate() {
      dispatch({ type: "SET", step: "check_update", text: "Checking for updates..." });
   }

   function setFetchHostnames() {
      dispatch({ type: "SET", step: "fetch_hostnames", text: "Fetching external hostnames..." });
   }

   async function setInitialize() {
      dispatch({ type: "SET", step: "initialize", text: "Connecting..." });
   }

   async function retry() {
      posthog.capture("start:retry_button_click", { state: state.current });

      if (state.current === "fetch_hostnames") {
         setFetchHostnames();
      } else if (state.current === "check_update") {
         setCheckUpdate();
      } else if (state.current === "initialize") {
         setInitialize();
      }
   }

   useEffect(() => {
      if (state.status === "error") {
         startCountdown(10);
      }
   }, [state.status, startCountdown]);

   useEffect(() => {
      if (state.status !== "error") return;
      if (countdown === 0) {
         retry();
      }
   }, [countdown]);

   useEffect(() => {
      if (state.error) return;

      async function decideState() {
         switch (state.current) {
            case "none": {
               const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);
               if (activePreset?.hostnameSource === "external") {
                  setFetchHostnames();
               } else if (huginnWindow.environment === "desktop" || huginnWindow.environment === "android") {
                  setCheckUpdate();
               } else {
                  setHostnamesFromSettings();
                  await initializeClient();
                  await setInitialize();
               }
               break;
            }

            case "fetch_hostnames":
               const result = await setHostnamesFromExternal();
               if (!result.success) {
                  dispatch({ type: "FAIL", error: result.status });
               } else {
                  await initializeClient();

                  if (huginnWindow.environment !== "desktop" && huginnWindow.environment !== "android") {
                     await setInitialize();
                  } else {
                     setCheckUpdate();
                  }
               }
               break;

            case "check_update":
               if (!client) {
                  setHostnamesFromSettings();
                  await initializeClient();
               }
               await checkAndDownload();
               break;
            case "initialize":
               await initialize();
               break;
         }
      }

      decideState().catch(console.error);
   }, [state]);

   useEffect(() => {
      if (state.status !== "error") return;
      if (!iconRef.current) return;

      scopeRef.current = createScope().add(() => {
         animate(iconRef.current!, {
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 500,
            ease: "outCubic",
            translateX: [0, -5, 5, -3, 3, 0],
         });
      });

      return () => {
         scopeRef.current?.revert();
      };
   }, [state.status]);

   useEffect(() => {
      if (huginnWindow.environment === "desktop" && !huginnWindow.args.includes("--silent")) {
         window.electronAPI.showMain();
      }
   }, []);

   return (
      <StartWrapper transitionName="start-index" className="mx-10 w-auto! bg-transparent! p-0! shadow-none!">
         <div className="flex w-full flex-col items-center select-none">
            {state.status === "error" ? (
               <div ref={iconRef} className="bg-negative-700 rounded-full p-2.5">
                  <div className="bg-negative-500 rounded-full p-2.5">
                     <IconMingcuteAlertLine className="size-7 text-white" />
                  </div>
               </div>
            ) : (
               <HuginnIcon
                  outlined
                  className={clsx(
                     "text-primary-500 size-20 animate-pulse drop-shadow-[0px_0px_25px_rgb(var(--color-primary-700))] transition-all hover:scale-105 hover:-rotate-12 active:rotate-6",
                  )}
               />
            )}
            <div className="mt-4 text-xl font-bold text-white">{state.status === "error" ? errorTitle : "Huginn"}</div>
            {state.status === "error" ? (
               <>
                  <div className="text-text/80 mt-2 max-w-md text-center">{errorDescription}</div>
                  {state.error && (
                     <div className="text-text/60 mt-4 text-center text-sm">
                        <span className="uppercase">reason:</span>
                        <span className="ml-1 font-semibold uppercase">{state.error}</span>
                     </div>
                  )}
               </>
            ) : (
               <div className="text-text/80 mt-2">
                  <div className="flex items-center justify-center gap-x-2 text-center">
                     <div className="flex items-center justify-center gap-x-1">
                        <div>{state.text}</div>
                        {state.current === "update" && <div className="font-bold"> {updateInfo?.version}</div>}
                     </div>
                     {(state.current === "check_update" ||
                        state.current === "update" ||
                        state.current === "initialize" ||
                        state.current === "fetch_hostnames") &&
                        progress === 0 && <LoadingIcon className="size-6" />}
                  </div>
               </div>
            )}
            {state.status === "error" && (
               <div className="mt-5 flex w-full flex-col items-center justify-center gap-y-1">
                  <div className="flex gap-x-2">
                     <HuginnButton type="button" className="h-10 w-32 rounded-md" color="surface" onClick={retry}>
                        Retry
                     </HuginnButton>
                     {state.current === "check_update" && (
                        <HuginnButton color="surface-deep" type="button" className="h-10 w-32 rounded-md" onClick={setInitialize}>
                           Continue
                        </HuginnButton>
                     )}
                  </div>
                  {countdown > 0 && (
                     <div className="text-text/60 text-sm">
                        retrying in <span>{countdown}s</span>
                     </div>
                  )}
               </div>
            )}
            {state.current === "update" && progress !== 0 && (
               <div className="mt-3 flex flex-col">
                  <div className="bg-surface-deep relative h-6 w-56 rounded-md p-0.5">
                     <div className="bg-positive-700 h-full rounded-sm" style={{ width: `${progress}%` }} />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-text px-2 py-1 text-xs">{updateProgressText}</div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </StartWrapper>
   );
}
