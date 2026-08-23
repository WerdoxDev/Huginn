import { Accordion } from "@base-ui/react";
import clsx from "clsx";

export default function HuginnAccordion<Value = any>(props: Accordion.Root.Props<Value>) {
   return <Accordion.Root {...props} />;
}

function Panel({ className, ...props }: Accordion.Panel.Props) {
   return (
      <Accordion.Panel
         className={clsx(
            "h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0",
            className,
         )}
         {...props}
      />
   );
}

HuginnAccordion.Item = Accordion.Item;
HuginnAccordion.Header = Accordion.Header;
HuginnAccordion.Trigger = Accordion.Trigger;
HuginnAccordion.Panel = Panel;
