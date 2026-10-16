import { useThisUser } from "@stores/userStore";

export function useIsOAuth() {
   const { tokenPayload } = useThisUser();

   return tokenPayload?.authType === "oauth";
}
