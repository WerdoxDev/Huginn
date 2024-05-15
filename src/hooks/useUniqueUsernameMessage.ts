import { constants } from "@shared/constants";
import { Field } from "@shared/errors";
import { useRef, useState } from "react";
import { client } from "../lib/api";

export default function useUniqueUsernameMessage() {
   const defaultMessage = "Please only use numbers, letters, _";
   const [message, setMessage] = useState<MessageDetail>({ text: defaultMessage, status: "default", visible: false });

   const usernameTimeout = useRef<number>();
   const lastFocus = useRef<boolean>(false);

   function set(message: string, state: StatusCode, visible: boolean) {
      setMessage({ text: message, status: state, visible });
   }

   async function checkForUniqueUsername(value: string) {
      const result = await client.common.uniqueUsername({ username: value });

      if (result.taken) {
         set("Username is taken. Try adding numbers, letters, underlines _ and...", "error", true);
      } else {
         set("Username is available!", "success", true);
      }
   }

   function validateLength(value: string) {
      const isValid = value.length >= constants.USERNAME_MIN_LENGTH && value.length <= constants.USERNAME_MAX_LENGTH;
      return isValid;
   }

   function onChanged(value: string) {
      console.log("hi");
      if (!value) {
         set(defaultMessage, "default", true);
         return;
      }

      if (!validateLength(value)) {
         set(Field.wrongLength(constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH)[0], "error", true);
         return;
      }

      if (usernameTimeout.current) {
         console.log("clear");
         clearTimeout(usernameTimeout.current);
      }

      usernameTimeout.current = setTimeout(async () => {
         await checkForUniqueUsername(value);
         onFocusChanged(lastFocus.current);
      }, 1000);
   }

   function onFocusChanged(isFocused: boolean) {
      lastFocus.current = isFocused;
      setMessage((prev) => ({ text: prev.text, status: prev.status, visible: prev.status === "error" ? true : isFocused }));
   }

   return { message, onFocusChanged, onChanged };
}
