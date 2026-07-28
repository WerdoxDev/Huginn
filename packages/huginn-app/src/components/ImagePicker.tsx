import { createRadialMaskStyle } from "@lib/mask-utils";
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

   const maskStyle = createRadialMaskStyle(
      props.data
         ? [
              { radius: "1.25rem", x: "calc(50% - 1.125rem)", y: "calc(100% - 0.375rem )" },
              { radius: "1.25rem", x: "calc(50% + 1.125rem)", y: "calc(100% - 0.375rem )" },
           ]
         : [{ radius: "1.25rem", x: "50%", y: "calc(100% - 0.375rem)" }],
   );

   return (
      <div className={clsx("relative z-10 w-max shrink-0", props.className)}>
         <div className="rounded-full">
            <div className="relative h-full w-full overflow-hidden rounded-full" style={maskStyle}>
               {props.data ? (
                  <img alt="editable-image" className={clsx(imageClassName, "object-cover")} src={props.data} />
               ) : (
                  <div className={clsx("bg-primary-700", imageClassName)} />
               )}
            </div>
         </div>
         <div className="absolute right-0 -bottom-2.5 left-0 z-20 flex items-center justify-center gap-x-1">
            {props.data && <ImagePickerDeleteButton onClick={props.onDelete} />}
            <ImagePickerEditButton onClick={props.onEdit} color={props.editButtonColor} />
         </div>
      </div>
   );
}
