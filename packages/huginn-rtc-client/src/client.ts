import * as mediasoupClient from "mediasoup-client";
import type { RtpCapabilities, RtpParameters } from "mediasoup-client/lib/RtpParameters";
import type { Consumer, DtlsParameters, IceCandidate, IceParameters, Producer, Transport, TransportOptions } from "mediasoup-client/lib/types";

const roomId = "test-room";
let tempRoomProducers: Array<{ producerId: string; producerPeerId: string; kind: "video" | "audio" }>;
let ws: WebSocket;
let device: mediasoupClient.Device;
let sendTransport: Transport;
let receiveTransport: Transport;
let localStream: MediaStream;
const producers: { audio?: Producer; video?: Producer } = {};
const consumers = new Map<string, Consumer>();

// Connect to WebSocket server
function connectToServer() {
	ws = new WebSocket("ws://localhost:3003");

	ws.onopen = () => {
		console.log("Connected to server");
		joinRoom();
	};

	ws.onmessage = (event) => {
		const message = JSON.parse(event.data);
		handleMessage(message);
	};

	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	ws.onclose = () => {
		console.log("Disconnected from server");
	};
}

// Join a room
function joinRoom() {
	ws.send(
		JSON.stringify({
			op: "join-room",
			d: { roomId },
		}),
	);
}

// Handle incoming messages
async function handleMessage(message: { op: string; d: unknown }) {
	if (message.op === "room-joined") {
		const { roomId, rtpCapabilities, producers } = message.d as {
			roomId: string;
			rtpCapabilities: RtpCapabilities;
			producers: Array<{ producerId: string; producerPeerId: string; kind: "video" | "audio" }>;
		};
		console.log("Joined room:", roomId);
		tempRoomProducers = producers;
		await loadDevice(rtpCapabilities);
	} else if (message.op === "transport-created") {
		const { direction, params } = message.d as {
			direction: "send" | "recv";
			params: { id: string; iceParameters: IceParameters; iceCandidates: IceCandidate[]; dtlsParameters: DtlsParameters };
		};

		setupTransport(direction, params);

		if (direction === "send") {
			startStreaming();
		}
	} else if (message.op === "transport-connected") {
		const { transportId } = message.d as { transportId: string };
		console.log(`Transport ${transportId} connected successfully`);
	} else if (message.op === "producer-created") {
		const { producerId } = message.d as { producerId: string };
		console.log("Producer created:", producerId);
	} else if (message.op === "new-producer") {
		const { producerId, producerPeerId } = message.d as { producerId: string; producerPeerId: string };
		console.log("New producer:", producerId, "from peer:", producerPeerId);
		subscribeToProducer(producerId);
	} else if (message.op === "consumer-created") {
		const { consumerId, kind, producerId, rtpParameters } = message.d as {
			consumerId: string;
			producerId: string;
			kind: "video" | "audio";
			rtpParameters: RtpParameters;
		};
		await handleConsumer(consumerId, producerId, kind, rtpParameters);
	} else if (message.op === "consumer-resumed") {
		const { consumerId } = message.d as { consumerId: string };
		console.log("Consumer resumed:", consumerId);
	} else if (message.op === "peer-left") {
		const { peerId, producers } = message.d as { peerId: string; producers: string[] };
		console.log("Peer left:", peerId);
		handlePeerLeft(peerId, producers);
	}
}

// Load mediasoup device
async function loadDevice(rtpCapabilities: RtpCapabilities) {
	try {
		device = new mediasoupClient.Device();

		// Load device with router's RTP capabilities
		await device.load({ routerRtpCapabilities: rtpCapabilities });

		// Create send transport
		ws.send(
			JSON.stringify({
				op: "create-transport",
				d: { roomId, direction: "send" },
			}),
		);

		// Create receive transport
		ws.send(
			JSON.stringify({
				op: "create-transport",
				d: { roomId, direction: "recv" },
			}),
		);
	} catch (error) {
		console.error("Failed to load device:", error);
	}
}

// Set up transport
function setupTransport(
	direction: "send" | "recv",
	params: { id: string; iceParameters: IceParameters; iceCandidates: IceCandidate[]; dtlsParameters: DtlsParameters },
) {
	try {
		if (direction === "send") {
			sendTransport = device.createSendTransport(params);

			sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					ws.send(
						JSON.stringify({
							op: "connect-transport",
							d: { roomId, transportId: sendTransport.id, dtlsParameters },
						}),
					);
					callback();
				} catch (error) {
					errback(error as Error);
				}
			});

			sendTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
				try {
					ws.send(
						JSON.stringify({
							op: "produce",
							d: { roomId, transportId: sendTransport.id, kind, rtpParameters },
						}),
					);

					// The server will respond with 'producer-created' message
					// We'll get producer ID from there and pass it to the callback
					// For simplicity, we're passing a dummy ID here
					callback({ id: "temp-id" });
				} catch (error) {
					errback(error as Error);
				}
			});
		} else if (direction === "recv") {
			receiveTransport = device.createRecvTransport(params);

			receiveTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					ws.send(
						JSON.stringify({
							op: "connect-transport",
							d: { roomId, transportId: receiveTransport.id, dtlsParameters },
						}),
					);
					callback();
				} catch (error) {
					errback(error as Error);
				}
			});
		}

		for (const producer of tempRoomProducers) {
			subscribeToProducer(producer.producerId);
		}

		tempRoomProducers.slice(0, tempRoomProducers.length - 1);
	} catch (error) {
		console.error("Failed to set up transport:", error);
	}
}

// Start streaming local media
async function startStreaming() {
	try {
		// Get user media
		localStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});

		// Display local video
		const localVideo = document.getElementById("localVideo") as HTMLMediaElement;
		if (!localVideo) {
			console.log("LOCAL VIDEO IS NULL");
			return;
		}

		localVideo.srcObject = localStream;

		// Create producers for audio and video
		const audioTrack = localStream.getAudioTracks()[0];
		const videoTrack = localStream.getVideoTracks()[0];

		// if (audioTrack) {
		// 	const audioProducer = await sendTransport.produce({
		// 		track: audioTrack,
		// 		codecOptions: {
		// 			opusStereo: true,
		// 			opusDtx: true,
		// 		},
		// 	});
		// 	producers.audio = audioProducer;
		// }

		if (videoTrack) {
			const videoProducer = await sendTransport.produce({
				track: videoTrack,
				codecOptions: {
					videoGoogleStartBitrate: 1000,               
				},
			});
			producers.video = videoProducer;
		}
	} catch (error) {
		console.error("Failed to start streaming:", error);
	}
}

// Subscribe to a remote producer
function subscribeToProducer(producerId: string) {
	ws.send(
		JSON.stringify({
			op: "consume",
			d: { roomId, transportId: receiveTransport.id, producerId, rtpCapabilities: device.rtpCapabilities },
		}),
	);
}

// Handle consumer
async function handleConsumer(consumerId: string, producerId: string, kind: "video" | "audio", rtpParameters: RtpParameters) {
	try {
		// Consume the track
		const consumer = await receiveTransport.consume({
			id: consumerId,
			producerId,
			kind,
			rtpParameters,
		});

		consumers.set(consumerId, consumer);

		// Display remote track
		const remoteStream = new MediaStream([consumer.track]);

		// Create or get a video element for this consumer
		let remoteVideo = document.getElementById(`remote-${consumerId}`) as HTMLMediaElement;
		if (!remoteVideo) {
			remoteVideo = document.createElement("video") as HTMLMediaElement;
			remoteVideo.id = `remote-${consumerId}`;
			remoteVideo.autoplay = true;
			// remoteVideo.playsinline = true;
			document.getElementById("remoteVideos")?.appendChild(remoteVideo);
		}

		remoteVideo.srcObject = remoteStream;

		// Resume the consumer
		ws.send(
			JSON.stringify({
				op: "resume-consumer",
				d: { roomId, consumerId },
			}),
		);
	} catch (error) {
		console.error("Failed to handle consumer:", error);
	}
}

function handlePeerLeft(peerId: string, producers: string[]) {
	for (const producerId of producers) {
		const consumer = Array.from(consumers.values()).find((c) => c.producerId === producerId);
		if (consumer) {
			consumer.close();
			consumers.delete(consumer.id);
			const remoteVideo = document.getElementById(`remote-${consumer.id}`);
			console.log(remoteVideo);
			if (remoteVideo) {
				remoteVideo.remove();
			}
		}
	}
}

// Initialize
window.onload = () => {
	connectToServer();
};
