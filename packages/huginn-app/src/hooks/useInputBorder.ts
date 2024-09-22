import { InputStatus } from "@/types";
import { useState, useEffect } from "react";

export function useInputBorder(status: InputStatus) {
   const defaultColor = "border-primary";
   const errorColor = "border-error";

   const [hasBorder, setHasBorder] = useState(false);
   const [borderColor, setBorderColor] = useState("");

   useEffect(() => {
      setHasBorder(status.code !== "none");

      if (status.code === "default") {
         setBorderColor(defaultColor);
      } else if (status.code === "error") {
         setBorderColor(errorColor);
      } else {
         setBorderColor("");
      }
   }, [status.code]);

   return { hasBorder, borderColor };
}
