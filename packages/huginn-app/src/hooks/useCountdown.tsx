import { useRef, useState } from "react";

export function useCountdown() {
	const [countdown, setCountdown] = useState(0);
	const interval = useRef<number>(undefined);

	function startCountdown(from: number) {
		setCountdown(from);

		if (interval.current) {
			window.clearInterval(interval.current);
		}

		interval.current = window.setInterval(() => {
			if (countdown <= 0) {
				window.clearInterval(interval.current);
				interval.current = undefined;
			}
			setCountdown((old) => old - 1);
		}, 1000);
	}

	return { startCountdown, countdown };
}
