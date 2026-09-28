import type { ComponentPropsWithRef } from "react";

import clsx from "clsx";

export type DialogActionsProps = ComponentPropsWithRef<"div">;

export default function DialogActions({ className, ...props }: DialogActionsProps) {
   return <div {...props} className={clsx("bg-surface-alt flex w-full justify-end gap-x-2 p-5", className)} />;
}
