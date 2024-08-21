import { constants } from "@huginn/shared";
import { Field } from "@huginn/shared";
import { useEffect, useRef, useState } from "react";
import { useClient } from "@contexts/apiContext";
import { InputValues, MessageDetail, StatusCode } from "@/types";
import { useUser } from "@contexts/userContext";

export default function useUniqueUsernameMessage(values: InputValues, usernameField: string) {
   const client = useClient();
   const { user } = useUser();

   const defaultMessage = "Please only use numbers, letters, _";
   const [message, setMessage] = useState<MessageDetail>({ text: defaultMessage, status: "default", visible: false });

   const usernameTimeout = useRef<number>();
   const lastFocus = useRef<boolean>(false);
   const prevUsername = useRef(values[usernameField].value);

   useEffect(() => {
      if (prevUsername.current === values[usernameField].value) {
         return;
      }

      onChanged(values[usernameField].value, user?.username);
      prevUsername.current = values[usernameField].value;
   }, [values, user]);

   function set(message: string, state: StatusCode, visible: boolean) {
      setMessage({ text: message, status: state, visible });
      console.log(visible);
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

   function onChanged(value: string, username?: string) {
      if (!value || value === username) {
         set(defaultMessage, "default", lastFocus.current);
         clearTimeout(usernameTimeout.current);
         return;
      }

      if (!validateLength(value)) {
         set(Field.wrongLength(constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH)[0], "error", true);
         return;
      }

      if (usernameTimeout.current) {
         clearTimeout(usernameTimeout.current);
      }

      usernameTimeout.current = setTimeout(async () => {
         await checkForUniqueUsername(value);
         onFocusChanged(lastFocus.current);
      }, 1000);
   }

   function onFocusChanged(isFocused: boolean) {
      lastFocus.current = isFocused;
      setMessage(prev => ({ text: prev.text, status: prev.status, visible: prev.status === "error" ? true : isFocused }));
   }

   return { message, onFocusChanged, onChanged };
}
