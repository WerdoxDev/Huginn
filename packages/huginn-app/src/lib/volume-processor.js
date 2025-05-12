class VolumeProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this._lastDb = -100; // Initialize it super low
		this._smoothingFactor = 0.8; // Between 0 and 1. Higher = smoother but more delayed
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		if (input.length > 0) {
			const samples = input[0];
			let sum = 0;
			for (let i = 0; i < samples.length; i++) {
				sum += samples[i] * samples[i];
			}
			const rms = Math.sqrt(sum / samples.length);
			let db = 20 * Math.log10(rms);

			// Handle -Infinity when rms is 0
			if (!Number.isFinite(db)) {
				db = -100;
			}

			// Apply smoothing
			this._lastDb = this._smoothingFactor * this._lastDb + (1 - this._smoothingFactor) * db;
			// console.log(this._lastDb);

			this.port.postMessage({ db: this._lastDb });
			// this.port.postMessage({ db: db });
		}

		return true;
	}
}

registerProcessor("volume-processor", VolumeProcessor);
