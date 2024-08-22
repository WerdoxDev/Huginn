import { APIUser } from "@huginn/shared";
import { createContext, useContext, useEffect, useState } from "react";
import { useEvent } from "./event";
import { useClient } from "./apiContext";
import { ReactNode } from "@tanstack/react-router";

type UserContextType = {
   user?: APIUser;
   setUser: (user?: APIUser) => void;
};

export const UserContext = createContext<UserContextType>({ user: undefined, setUser: _user => {} });

export function UserProvider(props: { children?: ReactNode }) {
   const client = useClient();
   // const { listenEvent } = useEvent();

   const [user, setUser] = useState(() => client.user);

   useEffect(() => {
      if (client.isLoggedIn) {
         setUser(client.user);
      }
   }, [client.isLoggedIn]);

   return <UserContext.Provider value={{ user, setUser }}>{props.children}</UserContext.Provider>;
}

export function useUser() {
   return useContext(UserContext);
}
