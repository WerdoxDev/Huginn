import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import DefaultNotFound from "./components/DefaultNotFound";
import { WindowProvider } from "./contexts/windowContext";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { SettingsProvider } from "./contexts/settingsContext";
import { APIProvider } from "./contexts/apiContext";
import HuginnRouterProvider from "./HuginnRouterProvider";

const queryClient = new QueryClient();

export const router = createRouter({
   routeTree,
   defaultPreload: "intent",
   defaultPreloadDelay: 200,
   defaultPreloadStaleTime: 0,
   context: { queryClient, client: undefined! },
   defaultNotFoundComponent: DefaultNotFound,
   // defaultErrorComponent: DefaultError,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
   type Register = {
      router: typeof router;
   };
}

// function App() {
//    return (

//    );
// }

ReactDOM.createRoot(document.getElementById("root")!).render(
   <QueryClientProvider client={queryClient}>
      <SettingsProvider>
         <APIProvider>
            <WindowProvider>
               <HuginnRouterProvider router={router} />
            </WindowProvider>
         </APIProvider>
      </SettingsProvider>
   </QueryClientProvider>,
);
