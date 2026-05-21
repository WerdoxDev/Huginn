import clsx from "clsx";

const editButtonColors = {
   surface: "bg-surface hover:bg-surface-alt",
   "surface-alt": "bg-surface-alt hover:bg-surface-deep",
};

export function ImagePickerEditButton(props: { onClick?: () => void; className?: string; color?: "surface" | "surface-alt" }) {
   const color = props.color ?? "surface";

   return (
      <button
         onClick={props.onClick}
         className={clsx("cursor-pointer rounded-full! p-2 shadow-md", editButtonColors[color], props.className)}
         type="button"
      >
         <IconMingcuteEdit2Fill className="size-4 text-white" />
      </button>
   );
}

export function ImagePickerDeleteButton(props: { onClick?: () => void; className?: string }) {
   return (
      <button
         onClick={props.onClick}
         className={clsx("bg-negative-500 hover:bg-negative-600 cursor-pointer rounded-full! p-2 shadow-md", props.className)}
         type="button"
      >
         <IconMingcuteDelete3Fill className="size-4 text-white" />
      </button>
   );
}
