import posthog, { type CaptureResult } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
	defaults: "2025-05-24",
	capture_exceptions: true,
	debug: import.meta.env.DEV,
	before_send: (event: CaptureResult | null): CaptureResult | null => {
		if (event?.properties?.$current_url) {
			// parse the URL
			const parsed = new URL(event.properties.$current_url);

			// if there is a hash in the URL, we want to include it in the $pathname property
			if (parsed.hash) {
				event.properties.$pathname = parsed.pathname + parsed.hash;
			}
		}
		return event;
	},
});

export default function PHProvider(props: { children?: ReactNode }) {
	return <PostHogProvider client={posthog}>{props.children}</PostHogProvider>;
}
