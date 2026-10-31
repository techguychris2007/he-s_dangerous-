import wasmUrl from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import runtimeUrl from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url';

export { wasmUrl, runtimeUrl };
export const READER_CACHE = 'dw-dig-reader-v1';
export const READER_MODEL = 'Xenova/distilbert-base-cased-distilled-squad';
export const READER_REVISION = 'bdbb0a5e9c617c3c7ea9f3cbaf2be3ad871bcd7d';
const root = `https://huggingface.co/${READER_MODEL}/resolve/${READER_REVISION}/`;
export const READER_FILES = [
  { url: root + 'config.json', minimum: 100 },
  { url: root + 'tokenizer.json', minimum: 1000 },
  { url: root + 'tokenizer_config.json', minimum: 100 },
  { url: root + 'onnx/model_quantized.onnx', minimum: 60_000_000 },
  { url: wasmUrl, minimum: 20_000_000 },
  { url: runtimeUrl, minimum: 1000 },
];
