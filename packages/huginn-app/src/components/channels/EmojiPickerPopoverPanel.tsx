import HuginnPopover from "@components/popover/HuginnPopover";

export default function EmojiPickerPopoverPanel(props: { children: React.ReactNode; sideGap?: number }) {
   return (
      <HuginnPopover.Panel sideGap={props.sideGap} className="bg-surface flex flex-col overflow-hidden rounded-lg pr-0">
         {props.children}
      </HuginnPopover.Panel>
   );
}
