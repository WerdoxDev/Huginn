import { useEffect, useRef } from "react";

export function useAudioLevel() {
	const animationFrameHandler = useRef<number>(null);
	const intervalId = useRef<number>(null);
	const currentLevel = useRef<number>(0);

	function startChecking(stream: MediaStream, interval: number, callback: (db: number) => void) {
		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();

		source.connect(analyser);
		analyser.fftSize = 2048;

		const dataArray = new Uint8Array(analyser.frequencyBinCount);

		function checkAudioLevel() {
			analyser.getByteFrequencyData(dataArray);
			const sum = dataArray.reduce((sum, value) => sum + value, 0);
			const average = sum / dataArray.length;

			const db = 20 * Math.log10(average / 255);
			currentLevel.current = db;

			animationFrameHandler.current = requestAnimationFrame(checkAudioLevel);
		}

		intervalId.current = window.setInterval(() => {
			callback(currentLevel.current);
		}, interval);

		checkAudioLevel();
	}

	function stopChecking() {
		if (animationFrameHandler.current) {
			cancelAnimationFrame(animationFrameHandler.current);
		}
		if (intervalId.current) {
			window.clearInterval(intervalId.current);
		}
	}

	useEffect(() => {
		return () => {
			stopChecking();
		};
	}, []);

	return { startChecking, stopChecking };
}
