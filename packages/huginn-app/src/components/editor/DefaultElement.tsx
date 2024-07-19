import { RenderElementProps } from "slate-react";

export default function DefaultElement(props: RenderElementProps) {
   return <div {...props.attributes}>{props.children}</div>;
}
