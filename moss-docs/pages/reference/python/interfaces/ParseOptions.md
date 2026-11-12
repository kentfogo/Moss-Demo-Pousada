<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/ParseOptions.md -->
# ParseOptions (Python SDK)

> Python text extraction options for OCR, high-resolution processing, document segmentation, and merging tables across pages.

[moss](https://docs.moss.dev/docs/reference/python/api.md) / ParseOptions

Controls how the server extracts and chunks text from uploaded documents. Every field is optional;
omitted fields use the server defaults.

## Properties

* **ocr\_mode**: `Optional[str]` - `"auto_ocr"` or `"full_ocr"`; `"full_ocr"` forces OCR on every page, which is what scanned documents with no text layer need
* **use\_high\_resolution**: `Optional[bool]` - slower, higher fidelity extraction; useful for dense tables
* **segmentation\_method**: `Optional[str]` - `"smart_layout_detection"` or `"page_by_page"`
* **merge\_tables**: `Optional[bool]` - merge a table split across a page break into a single segment
* **chunk\_size**: `Optional[int]` - maximum chunk length in characters, 200-2000; default `1200`. Chunks end at `.`, `!` or `?` before a capital letter; a longer sentence is cut at spaces, or mid-word if it has none. The title prefix is not counted. *(moss 1.17.0+)*
* **chunk\_overlap**: `Optional[int]` - characters repeated from the end of one chunk at the start of the next, 0 to half of `chunk_size`; default `200`, or half of `chunk_size` when smaller. The overlap moves forward to a sentence start when one falls inside it, and is absent around long sentences. *(moss 1.17.0+)*
