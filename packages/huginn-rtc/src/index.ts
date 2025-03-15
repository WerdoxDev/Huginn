import { createServer } from "node:http";
import crossws from "crossws/adapters/node";
import mediasoup from "mediasoup";
import type {
	Consumer,
	DtlsParameters,
	Producer,
	Router,
	RtpCapabilities,
	RtpCodecCapability,
	RtpParameters,
	Transport,
	Worker,
} from "mediasoup/node/lib/types.d.ts";

type WebsocketData = {
	op: string;
	d: unknown;
};

type RtcPeer = {
	id: string;
	transports: Map<string, { transport: Transport; direction: "send" | "recv" }>;
	producers: Map<string, Producer>;
	consumers: Map<string, Consumer>;
};

let worker: Worker;

const mediaCodecs: RtpCodecCapability[] = [
	{
		kind: "audio",
		mimeType: "audio/opus",
		clockRate: 48000,
		channels: 2,
	},
	{
		kind: "video",
		mimeType: "video/VP8",
		clockRate: 90000,
	},
];

const rooms = new Map<string, { id: string; router: Router; peers: Map<string, RtcPeer> }>(); // roomId -> Room

async function runMediasoupWorker() {
	worker = await mediasoup.createWorker({
		logLevel: "warn",
	});

	console.log("mediasoup worker created");

	worker.on("died", () => {
		console.error("mediasoup worker died, exiting...");
		process.exit(1);
	});
}

async function createRoom(roomId: string) {
	const router = await worker.createRouter({ mediaCodecs });

	rooms.set(roomId, {
		id: roomId,
		router,
		peers: new Map(), // peerId -> peer
	});

	return router;
}

async function createTransport(router: Router) {
	return await router.createWebRtcTransport({
		listenIps: [
			{ ip: "127.0.0.1", announcedIp: "127.0.0.1" }, // Use your server's public IP in production
		],
		enableUdp: true,
		enableTcp: true,
		preferUdp: true,
	});
}

const ws = crossws({
	hooks: {
		open(peer) {
			console.log("new connection", peer.id);
			peer.subscribe(peer.id);
		},
		async message(peer, message) {
			const msg: WebsocketData = message.json();
			if (msg.op === "join-room") {
				const { roomId } = msg.d as { roomId: string };
				let room = rooms.get(roomId);

				if (!room) {
					const router = await createRoom(roomId);
					room = rooms.get(roomId);
				}

				if (!room) {
					return;
				}

				const rtcPeer = {
					id: peer.id,
					transports: new Map(),
					producers: new Map(),
					consumers: new Map(),
				};

				room?.peers.set(peer.id, rtcPeer);

				const roomProducers = Array.from(
					room.peers
						.values()
						.map((x) => Array.from(x.producers.values().map((y) => ({ producerId: y.id, producerPeerId: x.id, kind: y.kind })))),
				).flat();
				peer.send(
					JSON.stringify({
						op: "room-joined",
						d: { roomId: roomId, peerId: peer.id, rtpCapabilities: room?.router.rtpCapabilities, producers: roomProducers },
					}),
				);

				// for (const [otherPeerId, otherPeer] of room.peers) {
				// 	if (otherPeerId !== peer.id) {
				// 		ws.publish(otherPeerId, JSON.stringify({ op: "new-producer", d: { producerId: producer.id, producerPeerId: peer.id, kind } }));
				// 	}
				// }
			} else if (msg.op === "create-transport") {
				const { roomId, direction } = msg.d as { roomId: string; direction: "send" | "recv" };
				const room = rooms.get(roomId);

				if (!room) {
					peer.send(JSON.stringify({ op: "error", d: { message: "Room not found" } }));
					return;
				}

				const transport = await createTransport(room.router);
				const rtcPeer = room.peers.get(peer.id);
				rtcPeer?.transports.set(transport.id, { transport, direction });

				peer.send(
					JSON.stringify({
						op: "transport-created",
						d: {
							direction,
							transportId: transport.id,
							params: {
								id: transport.id,
								iceParameters: transport.iceParameters,
								iceCandidates: transport.iceCandidates,
								dtlsParameters: transport.dtlsParameters,
							},
						},
					}),
				);
			} else if (msg.op === "connect-transport") {
				const { roomId, transportId, dtlsParameters } = msg.d as { roomId: string; transportId: string; dtlsParameters: DtlsParameters };
				const room = rooms.get(roomId);

				if (!room) {
					return;
				}

				const rtcPeer = room.peers.get(peer.id);
				const transportData = rtcPeer?.transports.get(transportId);

				if (!transportData) {
					return;
				}

				await transportData.transport.connect({ dtlsParameters });

				peer.send(JSON.stringify({ op: "transport-connected", d: { transportId } }));
			} else if (msg.op === "produce") {
				const { roomId, transportId, rtpParameters, kind } = msg.d as {
					roomId: string;
					transportId: string;
					rtpParameters: RtpParameters;
					kind: "audio" | "video";
				};
				const room = rooms.get(roomId);

				if (!room) {
					return;
				}

				const rtcPeer = room.peers.get(peer.id);
				const transportData = rtcPeer?.transports.get(transportId);

				if (!transportData || transportData.direction !== "send") {
					return;
				}

				const producer = await transportData.transport.produce({ kind, rtpParameters });

				rtcPeer?.producers.set(producer.id, producer);

				for (const [otherPeerId, otherPeer] of room.peers) {
					if (otherPeerId !== peer.id) {
						ws.publish(otherPeerId, JSON.stringify({ op: "new-producer", d: { producerId: producer.id, producerPeerId: peer.id, kind } }));
					}
				}

				peer.send(JSON.stringify({ op: "producer-created", d: { producerId: producer.id } }));
			} else if (msg.op === "consume") {
				const { roomId, transportId, rtpCapabilities, producerId } = msg.d as {
					roomId: string;
					producerId: string;
					transportId: string;
					rtpCapabilities: RtpCapabilities;
				};
				const room = rooms.get(roomId);

				if (!room) {
					return;
				}

				const rtcPeer = room.peers.get(peer.id);
				const transportData = rtcPeer?.transports.get(transportId);

				if (!transportData || transportData.direction !== "recv") {
					return;
				}

				if (!room.router.canConsume({ producerId, rtpCapabilities })) {
					peer.send(JSON.stringify({ op: "error", d: { message: "Cannot consume producer" } }));
					return;
				}

				const consumer = await transportData.transport.consume({ producerId, rtpCapabilities, paused: true });
				rtcPeer?.consumers.set(consumer.id, consumer);

				peer.send(
					JSON.stringify({
						op: "consumer-created",
						d: { consumerId: consumer.id, producerId, kind: consumer.kind, rtpParameters: consumer.rtpParameters },
					}),
				);
			} else if (msg.op === "resume-consumer") {
				const { roomId, consumerId } = msg.d as { roomId: string; consumerId: string };
				const room = rooms.get(roomId);

				if (!room) {
					return;
				}

				const rtcPeer = room.peers.get(peer.id);
				const consumer = rtcPeer?.consumers.get(consumerId);

				if (!consumer) {
					return;
				}

				await consumer.resume();

				peer.send(JSON.stringify({ op: "consumer-resumed", d: { consumerId } }));
			}
		},
		close(peer, details) {
			console.log("connection closed", peer.id);

			for (const [roomId, room] of rooms) {
				const rtcPeer = room.peers.get(peer.id);

				if (rtcPeer) {
					for (const [transportId, transportData] of rtcPeer.transports) {
						transportData.transport.close();
					}

					room.peers.delete(peer.id);
					const producers = Array.from(rtcPeer.producers.values().map((x) => x.id));

					for (const [otherPeerId, otherPeer] of room.peers) {
						ws.publish(otherPeerId, JSON.stringify({ op: "peer-left", d: { peerId: peer.id, producers } }));
					}

					// If room is empty, close it
					if (room.peers.size === 0) {
						room.router.close();
						rooms.delete(roomId);
						console.log("room closed", roomId);
					}
				}
			}
		},
	},
});

await runMediasoupWorker();

const server = createServer().listen(3003);

server.on("upgrade", (req, socket, head) => {
	if (req.headers.upgrade === "websocket") {
		ws.handleUpgrade(req, socket, head);
	}
});
// Bun.serve({
// 	port: 3003,
// 	websocket: ws.websocket,
// 	fetch(request, server) {
// 		if (request.headers.get("upgrade") === "websocket") {
// 			return ws.handleUpgrade(request, server);
// 		}
// 	},
// });
