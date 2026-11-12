# Moss benchmark, 2026-11-12 14:34 UTC

Model `moss/fastlane-1`, 10 runs per variant, from the cloud dev container (not Vercel). Times in ms, measured after the connection is up, so TCP and TLS setup through the proxy are left out (shown separately as "connect").

| Variant | TTFT p50 | TTFT p95 | Total p50 | Total p95 | Prompt tok | Cached tok | Output tok | Connect p50 | OK |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Round trip only (GET /v1/models) | – | – | 49 | 74 | – | – | – | 64 | 10/10 |
| Talker (tiny prompt, 40 tokens) | 100 | 116 | 166 | 182 | 231 | 0 | 10 | 62 | 10/10 |
| Talker, not streamed | – | – | 168 | 192 | 231 | 0 | 10 | 59 | 8/10 |
| Edit, new layout, cold prefix | 407 | 430 | 972 | 1183 | 5681 | 0 | 80 | 58 | 10/10 |
| Edit, new layout, warm prefix | 119 | 134 | 789 | 1093 | 5669 | 5600 | 87 | 59 | 10/10 |
| Edit, old layout (320a90f), warm | 154 | 178 | 593 | 910 | 3863 | 3200 | 71 | 61 | 10/10 |
| Edit, new layout, JSON mode off | 115 | 154 | 759 | 923 | 5669 | 5600 | 86 | 61 | 10/10 |
| Edit, new layout, max_tokens 200 | 121 | 135 | 754 | 1054 | 5669 | 5600 | 90 | 59 | 10/10 |
| Edit, Responses API (/v1/responses) | 156 | 166 | 757 | 1070 | 5669 | 5600 | 89 | 59 | 10/10 |

For the round-trip row, "Total" is the full request after connecting: the floor any call pays.
