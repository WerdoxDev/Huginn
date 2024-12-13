import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
} from "react-router";

import "./index.css";
import type { ReactNode } from "react";

// export async function clientLoader({ request }: any) {
//   const pathname = new URL(request.url).pathname;

//   if (pathname === "/splashscreen" || pathname === "/redirect") {
//     return;
//   }

//   if (pathname === "/") {
//     throw redirect("/login");
//   }
// }

export function Layout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {props.children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const [settingsLoaded, setSettingsLoaded] = useState(true);

  return (
    // <PostHogProvider client={posthogClient}>
    // <EventProvider>
    //   <HistoryProvider>
    //     <WindowProvider>
    //       <ThemeProvier>
    //         <MainRenderer>
    <Outlet />
    //         </MainRenderer>
    //       </ThemeProvier>
    //     </WindowProvider>
    //   </HistoryProvider>
    // </EventProvider>
    // </PostHogProvider>
  );
}

function MainRenderer(props: { children: ReactNode }) {
  const appWindow = useWindow();
  return (
    <div
      className={`flex h-full flex-col overflow-hidden ${
        appWindow.maximized ? "rounded-none" : "rounded-lg"
      }`}
    >
      <div className="relative h-full w-full">{props.children}</div>
    </div>
  );
}
