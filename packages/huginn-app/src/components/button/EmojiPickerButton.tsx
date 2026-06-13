import HuginnButton from "./HuginnButton";

export default function EmojiPickerButton(props: { onClick?: () => void }) {
   return (
      <HuginnButton
         color="primary"
         className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full!"
         type="button"
         onClick={props.onClick}
      >
         <IconMingcuteEmoji2Fill className="text-text size-5" />
      </HuginnButton>
   );
}
