// Wspólny dostęp do transformers.js z CDN (bez bundlera Next) + dekodowanie audio do 16 kHz mono.
// Używany przez transkrypcję (Whisper) i rozpoznawanie dźwięków (AST/AudioSet). Wszystko w przeglądarce.
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";
const TARGET_SR = 16000;

// eslint-disable-next-line
let _mod: any = null;
// eslint-disable-next-line
export async function loadTransformers(): Promise<any> {
  if (_mod) return _mod;
  _mod = await (Function("u", "return import(u)")(TRANSFORMERS_URL));
  return _mod;
}

export async function decodeTo16kMono(file: File): Promise<Float32Array> {
  const buf = await file.arrayBuffer();
  // eslint-disable-next-line
  const AC: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
  const tmp = new AC();
  const decoded = await tmp.decodeAudioData(buf.slice(0));
  tmp.close().catch(() => {});
  const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_SR));
  const off = new OfflineAudioContext(1, frames, TARGET_SR);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0);
}

export const SAMPLE_RATE = TARGET_SR;
