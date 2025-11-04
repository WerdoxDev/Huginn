import HuginnButton from "@components/button/HuginnButton";
import HuginnIcon from "@components/HuginnIcon";
import LoadingIcon from "@components/LoadingIcon";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { useConnect } from "@hooks/useConnect";
import { useUpdater } from "@hooks/useUpdater";
import { initializeClient, setHostnamesFromExternal, setHostnamesFromSettings, useClient } from "@stores/clientStore";
import { useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router";

type Step = "none" | "fetch_hostnames" | "check_update" | "connect" | "update" | "welcome";

type State = {
   current: Step;
   status: "none" | "in-progress" | "error";
   text: string;
   error?: string;
};

type Action = { type: "SET"; step: Step; text: string } | { type: "FAIL"; error: string };

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

export default function Index() {
   const huginnWindow = useHuginnWindow();
   const client = useClient();
   const settings = useStorage("settings");
   const [search] = useSearchParams();
   const startBackground = useStartBackground();
   const posthog = usePostHog();
   const navigate = useNavigate();
   const connect = useConnect();

   const { checkAndDownload, updateInfo, progress, contentLength, downloaded } = useUpdater({
      async onNotAvailable() {
         await setConnect();
      },
      onError() {
         dispatch({ type: "FAIL", error: "Could not check for updates" });
      },
      onUpdating() {
         dispatch({ type: "SET", step: "update", text: "Updating to" });
      },
   });

   const [state, dispatch] = useReducer(reducer, { current: "none", status: "none", error: undefined, text: "" });

   const updateProgressText = useMemo(() => {
      return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
   }, [progress]);

   async function tryConnect() {
      startBackground.setState(1);
      const result = await connect();
      if (result.success) {
         dispatch({ type: "SET", step: "welcome", text: `Welcome ${client?.currentUser?.displayName ?? client?.currentUser?.username}!` });
         await navigate({ pathname: search.get("redirect") ?? "/channels/@me" }, { replace: true, viewTransition: true });
      } else if (result.retryable) {
         dispatch({ type: "FAIL", error: "Failed to connect..." });
         startBackground.setState(0);
      } else {
         await navigate({ pathname: "/login", search: `?${search.toString()}` }, { replace: true, viewTransition: true });
      }

      // await tryLogin({
      //    async onError() {
      //       await navigate({ pathname: "/login", search: `?${search.toString()}` }, { viewTransition: true });
      //    },
      //    onFound() {
      //       startBackground.setState(1);
      //       dispatch({ type: "SET", step: "login", text: "Logging in..." });
      //    },
      //    async onNotFound() {
      //       await navigate({ pathname: "/login", search: `?${search.toString()}` }, { viewTransition: true });
      //    },
      //    async onSuccessful() {},
      //    navigatePath: { pathname: search.get("redirect") ?? "/channels/@me" },
      // });
   }

   function setCheckUpdate() {
      dispatch({ type: "SET", step: "check_update", text: "Checking for updates..." });
   }

   function setFetchHostnames() {
      dispatch({ type: "SET", step: "fetch_hostnames", text: "Fetching external hostnames..." });
   }

   async function setConnect() {
      dispatch({ type: "SET", step: "connect", text: "Connecting..." });
   }

   async function retry() {
      posthog.capture("start:retry_button_click", { state: state.current });

      if (state.current === "fetch_hostnames") {
         setFetchHostnames();
      } else if (state.current === "check_update") {
         setCheckUpdate();
      } else if (state.current === "connect") {
         setConnect();
      }
   }

   useEffect(() => {
      if (state.error) {
         return;
      }
      async function decideState() {
         switch (state.current) {
            case "none":
               if (settings.hostnameSource === "external") {
                  setFetchHostnames();
               } else if (huginnWindow.environment === "desktop") {
                  setCheckUpdate();
               } else {
                  setHostnamesFromSettings();
                  initializeClient();
                  await setConnect();
               }
               break;

            case "fetch_hostnames":
               const result = await setHostnamesFromExternal();
               if (!result) {
                  dispatch({ type: "FAIL", error: "Failed to fetch external hostnames!" });
               } else {
                  initializeClient();

                  if (huginnWindow.environment !== "desktop") {
                     await setConnect();
                  } else {
                     setCheckUpdate();
                  }
               }
               break;

            case "check_update":
               if (!client) {
                  setHostnamesFromSettings();
                  initializeClient();
               }
               await checkAndDownload();
               break;
            case "connect":
               await tryConnect();
               break;
         }
      }

      decideState().catch(console.error);
   }, [state]);

   useEffect(() => {
      startBackground.setState(0);

      if (huginnWindow.environment === "desktop" && !huginnWindow.args.includes("--silent")) {
         window.electronAPI.showMain();
      }
   }, []);

   return (
      <StartWrapper transitionName="start-index" className="w-auto! bg-transparent! p-0! shadow-none!">
         <div className="flex w-full select-none flex-col items-center">
            {state.status === "error" ? (
               <div className="bg-negative-600 rounded-full p-3">
                  <div className="bg-negative-200 rounded-full p-3">
                     <IconMingcuteAlertLine className="h-8 w-8 text-white" />
                  </div>
               </div>
            ) : (
               <HuginnIcon
                  outlined
                  className={clsx(
                     "text-primary-500 size-20 animate-pulse drop-shadow-[0px_0px_25px_rgb(var(--color-primary-700))] transition-all hover:-rotate-12 hover:scale-105 active:rotate-6",
                  )}
               />
            )}
            <div className="text-text mt-4 text-xl font-bold">{state.status === "error" ? "Something went wrong" : "Huginn"}</div>
            <div className="text-text/80 mt-2">
               <div className="flex items-center justify-center gap-x-2 text-center">
                  <span className="text-lg">
                     {state.error ?? state.text}
                     <span className="font-bold"> {state.current === "update" ? updateInfo?.version : ""}</span>
                  </span>
                  {/* {state.status === "error" && <IconMingcuteAlertFill className="size-6 text-negative-100" />} */}
                  {(state.current === "check_update" ||
                     state.current === "update" ||
                     state.current === "connect" ||
                     state.current === "fetch_hostnames") &&
                     state.status !== "error" &&
                     progress === 0 && <LoadingIcon className="size-6" />}
               </div>
            </div>
            {state.status === "error" && (
               <div className="no-drag-region bottom-3 mt-4 flex w-full justify-center gap-x-2">
                  <HuginnButton type="button" className="w-32 rounded-md py-1" color="primary" onClick={retry}>
                     Retry
                  </HuginnButton>
                  {state.current === "check_update" && (
                     <HuginnButton color="surface-deep" type="button" className="w-32 rounded-md py-1" onClick={setConnect}>
                        Continue
                     </HuginnButton>
                  )}
               </div>
            )}
            {state.current === "update" && progress !== 0 && (
               <div className="bg-surface-deep relative mt-3 h-6 w-56 rounded-md">
                  <div className="bg-primary-500 h-full rounded-md" style={{ width: `${progress}%` }} />
                  <div className="absolute left-0 right-0 flex items-center justify-center">
                     <div className="bg-surface-alt text-text/50 rounded-b-md px-2 py-1 text-xs">{updateProgressText}</div>
                  </div>
               </div>
            )}
         </div>
      </StartWrapper>
   );
}
