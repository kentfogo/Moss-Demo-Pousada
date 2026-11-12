<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/ParseOptions.md -->
# ParseOptions (JavaScript SDK)

> JavaScript text extraction options for OCR, high-resolution processing, document segmentation, and merging tables across pages.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / ParseOptions

Controls how the server extracts and chunks text from uploaded documents. Every field is optional;
omitted fields use the server defaults.

## Properties

| Property | Type | Description |
| - | - | - |
| `ocrMode?` | `"auto_ocr"` \| `"full_ocr"` | `"full_ocr"` forces OCR on every page, which is what scanned documents with no text layer need. `"auto_ocr"` runs it only where it looks necessary. |
| `useHighResolution?` | `boolean` | Slower, higher fidelity extraction. Useful for dense tables. |
| `segmentationMethod?` | `"smart_layout_detection"` \| `"page_by_page"` | How the document is segmented before extraction. |
| `mergeTables?` | `boolean` | Merge a table split across a page break into a single segment. |
| `chunkSize?` | `number` | Maximum chunk length in characters, 200-2000; default `1200`. Chunks end at `.`, `!` or `?` before a capital letter; a longer sentence is cut at spaces, or mid-word if it has none. The title prefix is not counted. *(@moss-js/moss 1.18.0+)* |
| `chunkOverlap?` | `number` | Characters repeated from the end of one chunk at the start of the next, 0 to half of `chunkSize`; default `200`, or half of `chunkSize` when smaller. The overlap moves forward to a sentence start when one falls inside it, and is absent around long sentences. *(@moss-js/moss 1.18.0+)* |
