# dig offline book reader

The reader uses Transformers.js 3.8.1 in a dedicated worker with single-threaded ONNX WebAssembly. It runs extractive question answering, not a generative chat model. Answers are selected from retrieved book text and retain the book/page reference. A confidence threshold and source-span check reject weak or unsupported model outputs; a compact sentence extract remains available if the model is unprepared or fails.

Model: Xenova/distilbert-base-cased-distilled-squad, revision bdbb0a5e9c617c3c7ea9f3cbaf2be3ad871bcd7d, quantized ONNX. Upstream: https://huggingface.co/distilbert/distilbert-base-cased-distilled-squad (Apache 2.0). Conversion: https://huggingface.co/Xenova/distilbert-base-cased-distilled-squad . Runtime library: https://github.com/huggingface/transformers.js (Apache 2.0). The model card documents limitations and benchmark results, which are not guarantees of correctness on cybersecurity books.

Only explicit offline preparation downloads model/tokenizer/runtime files (approximately 90 MB). Downloads come from the pinned Hugging Face revision; there is no prompt upload in offline book mode. Files use dw-dig-reader-v1 Cache Storage. Readiness requires each expected file and a verified download length. Inference disallows remote model files and uses cached WASM bytes. The small MJS runtime is bundled and PWA-precached; full offline testing must use a production build, not the development server.

Short follow-ups inherit the earlier question subject. New explicit questions replace that subject. Online models receive at most six bounded prior turns as context and concise-answer instructions. Existing lab hint levels remain in effect. Book-only mode never sends prompts to the hosted model.

Known limits: lexical retrieval can miss paraphrases, the small model can misunderstand a question, scanned PDFs without text cannot be indexed, and complex comparisons/summaries use compact source sentences. No absolute accuracy guarantee is made. Book references are collapsed by default so sources do not overwhelm the answer.
