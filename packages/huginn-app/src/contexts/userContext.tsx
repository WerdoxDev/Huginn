import { APIUser, GatewayUserUpdateData } from "@huginn/shared";
import { ReactNode } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { useClient } from "./apiContext";
import { useEvent } from "./eventContext";

type UserContextType = {
   user?: APIUser;
   setUser: (user?: APIUser) => void;
};

export const UserContext = createContext<UserContextType>({ user: undefined, setUser: _user => {} });

export function UserProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const { dispatchEvent } = useEvent();

   const [user, setUser] = useState(() => client.user);

   function userUpdated(user: GatewayUserUpdateData) {
      setUser(user);
      dispatchEvent("user_updated", { user, self: true });
   }

   useEffect(() => {
      client.gateway.on("user_update", userUpdated);

      return () => {
         client.gateway.off("user_update", userUpdated);
      };
   }, []);
   // useEffect(() => {
   //    console.log("HI?", client.readyState);
   //    if (client.isLoggedIn) {
   //       setUser(client.user);
   //    }
   // }, [client.readyState]);

   return <UserContext.Provider value={{ user, setUser }}>{props.children}</UserContext.Provider>;
}

export function useUser() {
   return useContext(UserContext);
}
