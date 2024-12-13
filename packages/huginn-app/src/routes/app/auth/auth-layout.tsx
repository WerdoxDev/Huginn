import clsx from "clsx";
import { Outlet, redirect } from "react-router";

export default function Layout() {
  const { state: backgroundState } = useContext(AuthBackgroundContext);

  return (
    <div
      className={clsx(
        "absolute inset-0",
        backgroundState === 2 && "pointer-events-none"
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 select-none transition-all duration-500",
          backgroundState === 1 ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex h-full flex-col items-center justify-center">
          <HuginnIcon
            overrideTheme="text"
            className="size-20 animate-pulse text-text drop-shadow-[0px_0px_50px_rgb(var(--color-text))]"
          />
          <div className="mt-2 flex items-center justify-center gap-x-2 text-text/80 text-xl">
            <span>Loading</span>
            <LoadingIcon />
          </div>
        </div>
      </div>
      <div className="absolute flex h-full w-full items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
