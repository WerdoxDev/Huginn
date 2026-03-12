import { HuginnClient, Voice } from "@huginn/api";

import "./index.css";

class VoiceBridge extends Voice {
   protected override async onRtcReady(): Promise<void> {}
}

const client = new HuginnClient({
   rest: { api: `http://localhost:3004/api` },
   cdn: { url: `http://localhost:3002/cdn` },
   gateway: {
      url: `http://localhost:3004/gateway`,
      intents: 0,
      createSocket(url) {
         return new WebSocket(url);
      },
   },
   voice: {
      class: VoiceBridge,
      // url: `http://192.168.178.51:3003/voice`,
      url: `http://192.168.178.21:3003/voice`,
      createSocket(url) {
         return new WebSocket(url);
      },
   },
});

await client.login({ username: "user", password: "user" });
client.gateway.connect();
await client.gateway.authenticate();

client.voice.on("status_changed", (d) => {
   console.log(d, new Date());
});

export function App() {
   async function connectVoice() {
      const channels = await client.channels.getAll();
      await client.gateway.connectVoice(null, channels[0]!.id);
   }
   return (
      <div className="app">
         <div className="logo-container">
            <button onClick={connectVoice}>CONNECT VOICE</button>
         </div>
      </div>
   );
}

export default App;
