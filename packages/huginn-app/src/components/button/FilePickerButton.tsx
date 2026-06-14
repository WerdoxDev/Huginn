import HuginnButton from "./HuginnButton";

export default function FilePickerButton(props: { onClick: () => void }) {
   return (
      <HuginnButton
         onClick={props.onClick}
         color="surface"
         className="bg-surface m-2 mr-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full!"
      >
         <IconMingcuteAddFill name="gravity-ui:plus" className="text-text size-5" />
      </HuginnButton>
   );
}
