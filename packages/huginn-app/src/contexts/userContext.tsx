import type { APIUser, GatewayUserUpdateData, TokenPayload } from "@huginn/shared";
import type { ReactNode } from "@tanstack/react-router";
import * as jose from "jose";
import { createContext } from "react";

type UserContextType = {
	user?: APIUser;
	tokenPayload?: TokenPayload;
	setUser: (user?: APIUser) => void;
};

export const UserContext = createContext<UserContextType>({ user: undefined, setUser: (_user) => {} });

export function UserProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const { dispatchEvent } = useEvent();

	const [user, setUser] = useState(() => client.user);
	const tokenPayload = useMemo(() => (client.tokenHandler.token ? (jose.decodeJwt(client.tokenHandler.token) as TokenPayload) : undefined), [user]);

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

	return <UserContext.Provider value={{ user, setUser, tokenPayload }}>{props.children}</UserContext.Provider>;
}

export function useUser() {
	return useContext(UserContext);
}
