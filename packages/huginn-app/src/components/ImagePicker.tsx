import clsx from "clsx";

import { ImagePickerDeleteButton, ImagePickerEditButton } from "./button/ImagePickerButtons";

export default function ImagePicker(props: {
   className?: string;
   data?: string | null;
   onDelete?: () => void;
   onEdit?: () => void;
   imageClassName?: string;
   editButtonColor?: "surface" | "surface-alt";
}) {
   const { imageClassName = "size-24" } = props;

   return (
      <div className={clsx("relative z-10 w-max shrink-0", props.className)}>
         <div className="rounded-full">
            <div className="relative h-full w-full overflow-hidden rounded-full">
               {props.data ? (
                  <img alt="editable-image" className={clsx(imageClassName, "object-cover")} src={props.data} />
               ) : (
                  <div className={clsx("bg-primary-700", imageClassName)} />
               )}
            </div>
         </div>
         <div className="absolute -top-2 -right-2 z-20 flex gap-x-1">
            {props.data && <ImagePickerDeleteButton onClick={props.onDelete} />}
            <ImagePickerEditButton onClick={props.onEdit} color={props.editButtonColor} />
         </div>
      </div>
   );
}
