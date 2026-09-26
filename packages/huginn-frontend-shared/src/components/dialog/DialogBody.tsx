import type { ComponentPropsWithRef } from "react";

import clsx from "clsx";

export type DialogBodyProps = ComponentPropsWithRef<"div">;

export default function DialogBody({ className, ...props }: DialogBodyProps) {
   return <div {...props} className={clsx("flex flex-col gap-y-5 p-5", className)} />;
}
