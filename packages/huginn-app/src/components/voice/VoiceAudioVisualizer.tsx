import { remap } from "@huginn/shared";
import { hexToRgbObject, useTheme } from "@stores/themeStore";
import { useEffect, useRef } from "react";

export default function VoiceAudioVisualizer(props: { srcObject?: MediaProvider }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const frameCallbackHandleRef = useRef<number | null>(null);
	const currentTheme = useTheme();

	useEffect(() => {
		if (!props.srcObject || !canvasRef.current) {
			return;
		}

		const canvasContext = canvasRef.current.getContext("2d");

		if (!canvasContext) {
			return;
		}

		const audioContext = new AudioContext();
		const analyser = audioContext.createAnalyser();
		// analyser.maxDecibels = 0;
		// analyser.minDecibels = -90;
		analyser.smoothingTimeConstant = 0.85;
		analyser.fftSize = 256;

		const source = audioContext.createMediaStreamSource(props.srcObject as MediaStream);
		const gain = audioContext.createGain();
		// distortion.oversample = "4x";
		gain.gain.value = 5;
		source.connect(gain);
		gain.connect(analyser);
		// analyser.connect(audioContext.destination);

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		function draw() {
			if (!canvasRef.current || !canvasContext || !containerRef.current) {
				return;
			}

			canvasRef.current.width = containerRef.current.clientWidth - 20;
			canvasRef.current.height = containerRef.current.clientHeight;

			const width = canvasRef.current.width;
			const height = canvasRef.current.height;

			frameCallbackHandleRef.current = requestAnimationFrame(draw);
			analyser.getByteFrequencyData(dataArray);

			canvasContext.clearRect(0, 0, width, height);
			// canvasContext.fillStyle = "rgba(0,0,0,1)";
			// canvasContext.fillRect(0, 0, width, height);

			const barWidth = (width / bufferLength) * 2.15;
			let barHeight = 0;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) {
				// Make bar height proportional to canvas height
				barHeight = (dataArray[i] / 255) * (height / 2.5); // Normalize to half canvas height
				const color = hexToRgbObject(currentTheme.theme["primary-700"]);
				canvasContext.fillStyle = `rgb(${remap(dataArray[i], 0, 255, 128, color?.r)} ${remap(dataArray[i], 0, 255, 128, color?.g)} ${remap(dataArray[i], 0, 255, 128, color?.b)})`;

				// Draw upper bar (mirrored)
				canvasContext.fillRect(
					x,
					height / 2 - barHeight, // Start from middle, go up
					barWidth,
					barHeight,
				);

				// Draw lower bar
				canvasContext.fillRect(
					x,
					height / 2, // Start from middle, go down
					barWidth,
					barHeight,
				);

				x += barWidth + 1;
			}

			// canvasContext.lineTo(width, height / 2);
			// canvasContext.stroke();
		}

		// function draw() {
		// 	if (!canvasRef.current || !canvasContext) {
		// 		return;
		// 	}

		// 	const width = canvasRef.current.width;
		// 	const height = canvasRef.current.height;

		// 	frameCallbackHandleRef.current = requestAnimationFrame(draw);
		// 	analyser.getByteTimeDomainData(dataArray);

		// 	canvasContext.fillStyle = "rgba(200 200 200)";
		// 	canvasContext.fillRect(0, 0, width, height);
		// 	canvasContext.lineWidth = 2;
		// 	canvasContext.strokeStyle = "rgb(0 0 0)";
		// 	canvasContext.beginPath();

		// 	const sliceWidth = width / bufferLength;
		// 	let x = 0;

		// 	// Amplification factor - adjust this value to increase/decrease sensitivity
		// 	const amplification = 5.0;

		// 	for (let i = 0; i < bufferLength; i++) {
		// 		// Center the waveform by subtracting 1 and amplify it
		// 		const v = (dataArray[i] / 128.0 - 1) * amplification + 1;
		// 		const y = v * (height / 2);

		// 		if (i === 0) {
		// 			canvasContext.moveTo(x, y);
		// 		} else {
		// 			canvasContext.lineTo(x, y);
		// 		}

		// 		x += sliceWidth;
		// 	}

		// 	canvasContext.lineTo(width, height / 2);
		// 	canvasContext.stroke();
		// }

		draw();

		return () => {
			source.disconnect();
			analyser.disconnect();
			audioContext.close();

			if (frameCallbackHandleRef.current !== null) {
				cancelAnimationFrame(frameCallbackHandleRef.current);
				frameCallbackHandleRef.current = null;
			}
		};
	}, [currentTheme.theme]);

	return (
		<div ref={containerRef} className="flex h-full w-full items-center justify-center">
			<canvas ref={canvasRef} />
		</div>
	);
}
