import { APIUser } from "@huginn/shared";
import { ReactNode } from "@tanstack/react-router";
import { createContext, useContext, useState } from "react";
import { useClient } from "./apiContext";

type UserContextType = {
   user?: APIUser;
   setUser: (user?: APIUser) => void;
};

export const UserContext = createContext<UserContextType>({ user: undefined, setUser: _user => {} });

export function UserProvider(props: { children?: ReactNode }) {
   const client = useClient();
   // const { listenEvent } = useEvent();

   const [user, setUser] = useState(() => client.user);

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
