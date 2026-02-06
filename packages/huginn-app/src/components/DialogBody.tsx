import clsx from "clsx";
import type { ReactNode } from "react";

export default function DialogBody(props: { children?: ReactNode; className?: string }) {
   return <div className={clsx("flex flex-col gap-y-5 p-5", props.className)}>{props.children}</div>;
}
