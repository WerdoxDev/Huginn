import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import router from "./routes";

const root = document.getElementById("root");

export const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: 60000 } },
});

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(root!).render(
	<QueryClientProvider client={queryClient}>
		<RouterProvider router={router} />
	</QueryClientProvider>,
);
