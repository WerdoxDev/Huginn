import { constants, Fields } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import type { InputMessage } from "@/types";
import { useDebouncer } from "./useDebouncer";

export function useUniqueUsernameMessage() {
   const client = useClient();

   async function checkForUniqueUsername(value: string): Promise<InputMessage | null> {
      if (!client || !value) return null;

      if (!validateLength(value)) {
         return { text: Fields.wrongLength(constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH)[0], status: "error" };
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
      return value.length >= constants.USERNAME_MIN_LENGTH && value.length <= constants.USERNAME_MAX_LENGTH;
   }

   function validateRegex(value: string) {
      return value.match(constants.USERNAME_REGEX);
   }

   const { debouncedFunction, cancel } = useDebouncer(checkForUniqueUsername, 1000);

   async function validate(value: string) {
      cancel();
      const result = await debouncedFunction(value);
      console.log("VALIDATE", value, result);
      if (result?.status === "error") {
         return result.text;
      }
   }

   return { validate };
}
