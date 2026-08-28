import type { Control, FieldValues } from "react-hook-form";

import { CONSTANTS, Fields } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useAsyncDebouncer } from "@tanstack/react-pacer";

import type { InputMessage } from "@/types";

export function useUniqueUsernameMessage<I extends FieldValues>(control: Control<I>, defaultUsername?: string) {
   const client = useClient();

   async function checkForUniqueUsername(value: string): Promise<InputMessage | null> {
      if (!client || !value) return null;

      if (!validateLength(value)) {
         return {
            text: Fields.wrongLength(CONSTANTS.USERNAME_MIN_LENGTH, CONSTANTS.USERNAME_MAX_LENGTH)[0],
            status: "error",
         };
      }

      if (!validateRegex(value)) {
         return { text: Fields.usernameInvalid()[0], status: "error" };
      }

      const result = await client.common.uniqueUsername({ username: value });
      if (result.taken) {
         return { text: Fields.usernameTaken()[0], status: "error" };
      } else {
         return { text: "Username is available!", status: "success" };
      }
   }

   function validateLength(value: string) {
      return value.length >= CONSTANTS.USERNAME_MIN_LENGTH && value.length <= CONSTANTS.USERNAME_MAX_LENGTH;
   }

   function validateRegex(value: string) {
      return value.match(CONSTANTS.USERNAME_REGEX);
   }

   const usernameDebouncer = useAsyncDebouncer(checkForUniqueUsername, { wait: 1000 });

   async function validate(value: string) {
      usernameDebouncer.cancel();
      if (value === defaultUsername) return;
      const result = await usernameDebouncer.maybeExecute(value);
      if (result?.status === "error") {
         return result.text;
      }
   }

   return { validate };
}
