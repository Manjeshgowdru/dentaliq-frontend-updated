// Audio plumbing for the Gemini Live voice receptionist.
// Mic -> 16-bit PCM chunks (base64) and model audio (24 kHz PCM) -> speakers, with barge-in support.

const WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = []; this.len = 0; this.chunk = Math.round(sampleRate / 10); }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      this.buf.push(new Float32Array(ch)); this.len += ch.length;
      if (this.len >= this.chunk) {
        const out = new Float32Array(this.len); let o = 0;
        for (const b of this.buf) { out.set(b, o); o += b.length; }
        this.buf = []; this.len = 0;
        this.port.postMessage(out, [out.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

function toBase64(bytes) {
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  return btoa(bin);
}

export class MicStream {
  // onChunk(base64Pcm16, mimeType, level0to1)
  async start(onChunk) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    try {
      this.ctx = new AudioContext({ sampleRate: 16000 });
    } catch {
      this.ctx = new AudioContext(); // browser picks its rate; Gemini resamples
    }
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await this.ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "pcm-capture");
    const mime = `audio/pcm;rate=${this.ctx.sampleRate}`;
    this.muted = false;
    this.node.port.onmessage = (e) => {
      const f32 = e.data;
      let peak = 0;
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const v = Math.max(-1, Math.min(1, f32[i]));
        peak = Math.max(peak, Math.abs(v));
        i16[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      if (!this.muted) onChunk(toBase64(new Uint8Array(i16.buffer)), mime, peak);
    };
    this.source.connect(this.node);
  }

  stop() {
    try { this.source?.disconnect(); this.node?.disconnect(); } catch { /* already stopped */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
  }
}

export class Speaker {
  constructor() {
    this.ctx = new AudioContext({ sampleRate: 24000 });
    this.next = 0;
    this.sources = new Set();
    this.onIdle = null;
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  play(base64, rate = 24000) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const i16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
    const buf = this.ctx.createBuffer(1, i16.length, rate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 0x8000;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    const start = Math.max(this.ctx.currentTime + 0.02, this.next);
    src.start(start);
    this.next = start + buf.duration;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      if (this.sources.size === 0 && this.onIdle) this.onIdle();
    };
  }

  get speaking() {
    return this.sources.size > 0;
  }

  // Caller started talking over the assistant: drop everything queued.
  interrupt() {
    for (const s of this.sources) {
      try { s.stop(); } catch { /* already ended */ }
    }
    this.sources.clear();
    this.next = 0;
  }

  close() {
    this.interrupt();
    this.ctx.close().catch(() => {});
  }
}
