import type { ReactNode } from "react";

export default function ListElement(props: { children?: ReactNode; ordered?: boolean }) {
   return props.ordered ? (
      <ol className="w-max list-inside list-decimal">{props.children}</ol>
   ) : (
      <ul className="w-max list-inside list-disc">{props.children}</ul>
   );
}
