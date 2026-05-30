import { useEffect, useRef, useState } from "react";

import icon from "./assets/icon.png";

export default function Redirect() {
   const linkRef = useRef<HTMLAnchorElement | null>(null);

   const [title, setTitle] = useState("");
   const [showSuccess, setShowSuccess] = useState(true);
   const [showError, setShowError] = useState(false);

   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");

      if (error) {
         setShowSuccess(false);
         setShowError(true);
         setTitle(error.toLowerCase() === "cancelled" ? "Cancelled" : "Unknown Error");
         return;
      }

      const flow = params.get("flow");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const oauthToken = params.get("oauth_token");

      if (flow === "browser") {
         localStorage.setItem(
            "oauth-confirm",
            JSON.stringify({
               access_token: accessToken,
               refresh_token: refreshToken,
               flow,
               oauth_token: oauthToken,
            }),
         );

         const timer = window.setInterval(() => {
            if (!localStorage.getItem("oauth-confirm")) {
               window.close();
            }
         }, 500);

         return () => {
            window.clearInterval(timer);
         };
      }

      if (linkRef.current) {
         linkRef.current.href = "huginn://oauth-confirm" + window.location.search;
         linkRef.current.click();
      }

      setShowError(false);
      setShowSuccess(true);
      setTitle("Redirected to Huginn");
   }, []);

   return (
      <div className="flex h-full w-full">
         <div className="flex w-full items-center justify-center">
            <div className="flex h-max flex-col items-center justify-center gap-y-5">
               <img src={icon} className="text-text size-32 animate-pulse drop-shadow-[0px_0px_50px_#EBEBD3]" />
               <div className="text-center">
                  <div className="text-text flex items-center justify-center gap-x-2 text-2xl font-bold">
                     <span>{title}</span>
                     {showSuccess ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="text-accent size-8">
                           <g fill="none" fillRule="evenodd">
                              <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                              <path
                                 fill="currentColor"
                                 d="M21.546 5.111a1.5 1.5 0 0 1 0 2.121L10.303 18.475a1.6 1.6 0 0 1-2.263 0L2.454 12.89a1.5 1.5 0 1 1 2.121-2.121l4.596 4.596L19.424 5.111a1.5 1.5 0 0 1 2.122 0"
                              />
                           </g>
                        </svg>
                     ) : null}
                     {showError ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="text-error size-8">
                           <g fill="none" fillRule="evenodd">
                              <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                              <path
                                 fill="currentColor"
                                 d="m12 14.122l5.303 5.303a1.5 1.5 0 0 0 2.122-2.122L14.12 12l5.304-5.303a1.5 1.5 0 1 0-2.122-2.121L12 9.879L6.697 4.576a1.5 1.5 0 1 0-2.122 2.12L9.88 12l-5.304 5.304a1.5 1.5 0 1 0 2.122 2.12z"
                              />
                           </g>
                        </svg>
                     ) : null}
                  </div>
                  {showSuccess ? (
                     <div className="text-text/80 mt-2 max-w-lg text-lg">
                        <span>
                           You can return to the application and safely close this window. If you are not redirected automatically, Please click
                        </span>{" "}
                        <a ref={linkRef} className="text-accent underline">
                           here
                        </a>
                     </div>
                  ) : null}
                  {showError ? (
                     <div className="text-text/80 mt-2 max-w-lg text-lg">
                        <span>The authentication process was cancelled! You can safely close this window and start again in the application</span>
                     </div>
                  ) : null}
               </div>
            </div>
         </div>
      </div>
   );
}
