import type { ReactNode } from "react";

export default function DialogActions(props: { children?: ReactNode }) {
   return <div className="bg-surface-alt flex w-full justify-end gap-x-2 p-5">{props.children}</div>;
}
