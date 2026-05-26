import type { APIGetAllReleasesResult, APIGetLatestReleaseResult } from "@huginn/shared";

import { useEffect, useState } from "react";

import VersionCard from "./components/VersionCard";

export type FlavourType = "nightly" | "release";

export default function Download() {
  const [latestRelease, setLatestRelease] = useState<APIGetLatestReleaseResult | undefined>(
    undefined,
  );
  const [allReleases, setAllReleases] = useState<APIGetAllReleasesResult>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showingOlder, setShowingOlder] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadLatest = async () => {
      setLoading(true);
      try {
        const url = new URL("/api/latest-release", import.meta.env.VITE_SERVER_ADDRESS).toString();
        const data = await (await fetch(url)).json();
        if (isActive) {
          setLatestRelease(data);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadLatest();

    return () => {
      isActive = false;
    };
  }, []);

  const loadOrHideOlder = async () => {
    if (showingOlder) {
      setAllReleases([]);
      setShowingOlder(false);
      return;
    }

    setLoadingOlder(true);

    const url = new URL("/api/all-releases", import.meta.env.VITE_SERVER_ADDRESS).toString();
    const data = (await (await fetch(url)).json()) as APIGetAllReleasesResult;
    setAllReleases(data.filter((release) => release.version !== latestRelease?.version));

    setLoadingOlder(false);
    setShowingOlder(true);
  };

  return (
    <>
      <div className="mt-32 flex w-full flex-col md:mt-52">
        <div className="mb-10 flex flex-col">
          <div className="w-full text-center text-5xl font-extrabold">Download Huginn</div>
          <div className="mt-7 w-full text-center text-xl">Please choose your version</div>
        </div>
      </div>
      <div className="mb-auto flex flex-col items-center gap-y-5 px-4 pb-32">
        {loading ? <div className="animate-pulse text-xl font-bold">Loading...</div> : null}

        {latestRelease ? (
          <VersionCard
            version={latestRelease.version}
            date={latestRelease.date}
            latest
            url={latestRelease.url}
            windowsSetupUrl={latestRelease.windowsSetupUrl}
            macosSetupUrl={latestRelease.macosSetupUrl}
            linuxSetupUrl={latestRelease.linuxSetupUrl}
          />
        ) : null}

        {!loadingOlder && !loading ? (
          <button
            className="text-lg text-accent hover:underline"
            onClick={loadOrHideOlder}
            type="button"
          >
            {showingOlder ? "Hide older versions" : "Load older versions"}
          </button>
        ) : null}

        {loadingOlder ? <div className="animate-pulse text-xl font-bold">Loading...</div> : null}

        {allReleases.map((release) => (
          <VersionCard
            key={release.version}
            version={release.version}
            date={release.date}
            url={release.url}
            windowsSetupUrl={release.windowsSetupUrl}
            macosSetupUrl={release.macosSetupUrl}
            linuxSetupUrl={release.linuxSetupUrl}
          />
        ))}

        {showingOlder && allReleases.length === 0 ? (
          <div className="text-lg">No more releases...</div>
        ) : null}
      </div>
    </>
  );
}
