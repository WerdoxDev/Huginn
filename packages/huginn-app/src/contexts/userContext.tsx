import { useClient } from "@contexts/apiContext.tsx";
import { useEvent } from "@contexts/eventContext.tsx";
import type { APIUser, GatewayUserUpdateData } from "@huginn/shared";
import type { ReactNode } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";

type UserContextType = {
	user?: APIUser;
	setUser: (user?: APIUser) => void;
};

export const UserContext = createContext<UserContextType>({ user: undefined, setUser: (_user) => {} });

export function UserProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const { dispatchEvent } = useEvent();

	const [user, setUser] = useState(() => client.user);

	function userUpdated(user: GatewayUserUpdateData) {
		setUser(user);
		dispatchEvent("user_updated", user);
	}

	useEffect(() => {
		client.gateway.on("user_update", userUpdated);

		return () => {
			client.gateway.off("user_update", userUpdated);
		};
	}, []);

	return <UserContext.Provider value={{ user, setUser }}>{props.children}</UserContext.Provider>;
}

export function useUser() {
	return useContext(UserContext);
}
