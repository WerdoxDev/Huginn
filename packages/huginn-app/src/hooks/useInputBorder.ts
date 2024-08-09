import { InputStatus } from "@/types";
import { useState, useEffect } from "react";

export function useInputBorder(state: InputStatus) {
   const defaultColor = "border-primary";
   const errorColor = "border-error";

   const [hasBorder, setHasBorder] = useState(false);
   const [borderColor, setBorderColor] = useState("");

   useEffect(() => {
      setHasBorder(state.code !== "none");

      if (state.code === "default") {
         setBorderColor(defaultColor);
      } else if (state.code === "error") {
         setBorderColor(errorColor);
      } else {
         setBorderColor("");
      }
   }, [state.code]);

   return { hasBorder, borderColor };
}
