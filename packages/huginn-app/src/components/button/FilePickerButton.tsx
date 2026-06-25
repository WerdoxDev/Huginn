import HuginnButton from "./HuginnButton";

export default function FilePickerButton(props: { onClick: () => void; isActive?: boolean }) {
   return (
      <HuginnButton
         onClick={props.onClick}
         color={props.isActive ? "primary" : "surface"}
         className="flex size-10 cursor-pointer items-center justify-center rounded-full! p-2"
      >
         <IconMingcuteAddFill name="gravity-ui:plus" className="text-text size-full" />
      </HuginnButton>
   );
}
