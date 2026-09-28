import VersionCard from "@components/VersionCard";
import { getAllReleasesOptions, getLatestReleaseOptions } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_public/download")({
   component: DownloadComponent,
});

function DownloadComponent() {
   // const [loadingOlder, setLoadingOlder] = useState(false);
   const [isShowingOlder, setShowingOlder] = useState(false);

   const { isLoading: isLoadingLatest, data: latestRelease } = useQuery(getLatestReleaseOptions());
   const { isLoading: isLoadingOlder, data: allReleases } = useQuery(getAllReleasesOptions({ enabled: isShowingOlder }));

   // const loadOrHideOlder = async () => {
   //    if (showingOlder) {
   //       setAllReleases([]);
   //       setShowingOlder(false);
   //       return;
   //    }

   //    setLoadingOlder(true);

   //    const url = new URL("/api/all-releases", import.meta.env.VITE_SERVER_ADDRESS).toString();
   //    const data = (await (await fetch(url)).json()) as APIGetAllReleasesResult;
   //    setAllReleases(data.filter((release) => release.version !== latestRelease?.version));

   //    setLoadingOlder(false);
   //    setShowingOlder(true);
   // };
   //
   function handleLoadOrHideOlder() {
      setShowingOlder((prev) => !prev);
   }

   return (
      <>
         <div className="mt-32 flex w-full flex-col lg:mt-52">
            <div className="mb-10 flex flex-col">
               <div className="w-full text-center text-5xl font-extrabold">Download Huginn</div>
               <div className="mt-7 w-full text-center text-xl">Please choose your version</div>
            </div>
         </div>
         <div className="mb-auto flex flex-col items-center gap-y-5 px-4 pb-32">
            {isLoadingLatest ? <div className="animate-pulse text-xl font-bold">Loading...</div> : null}

            {latestRelease ? (
               <VersionCard
                  version={latestRelease.version}
                  date={latestRelease.date}
                  latest
                  url={latestRelease.url}
                  description={latestRelease.description}
                  windowsDownloadUrl={latestRelease.windowsDownloadUrl}
                  macosDownloadUrl={latestRelease.macosDownloadUrl}
                  linuxDownloadUrl={latestRelease.linuxDownloadUrl}
                  androidDownloadUrl={latestRelease.androidDownloadUrl}
               />
            ) : null}

            {!isLoadingOlder && !isLoadingLatest ? (
               <button className="text-primary-500 text-lg hover:underline" onClick={handleLoadOrHideOlder} type="button">
                  {isShowingOlder ? "Hide older versions" : "Load older versions"}
               </button>
            ) : null}

            {isLoadingOlder ? <div className="animate-pulse text-xl font-bold">Loading...</div> : null}

            {isShowingOlder &&
               allReleases
                  ?.filter((x) => x.version !== latestRelease?.version)
                  ?.map((release) => (
                     <VersionCard
                        key={release.version}
                        version={release.version}
                        description={release.description}
                        date={release.date}
                        url={release.url}
                        windowsDownloadUrl={release.windowsDownloadUrl}
                        macosDownloadUrl={release.macosDownloadUrl}
                        linuxDownloadUrl={release.linuxDownloadUrl}
                        androidDownloadUrl={release.androidDownloadUrl}
                     />
                  ))}

            {isShowingOlder && allReleases?.length === 0 ? <div className="text-lg">No more releases...</div> : null}
         </div>
      </>
   );
}
