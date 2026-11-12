# Moss benchmark, 2026-11-12 15:07 UTC

Model `moss/fastlane-1`, 10 runs per variant, from the cloud dev container (not Vercel). Times in ms, measured after the connection is up, so TCP and TLS setup through the proxy are left out (shown separately as "connect").

| Variant | TTFT p50 | TTFT p95 | Total p50 | Total p95 | Prompt tok | Cached tok | Output tok | Connect p50 | OK |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Round trip only (GET /v1/models) | – | – | 47 | 52 | – | – | – | 57 | 10/10 |
| Talker (tiny prompt, 40 tokens) | 97 | 155 | 165 | 178 | 231 | 0 | 10 | 58 | 10/10 |
| Talker, not streamed | – | – | 165 | 189 | 231 | 0 | 10 | 57 | 8/10 |
| Edit, new layout, cold prefix | 418 | 433 | 945 | 1143 | 5941 | 0 | 77 | 58 | 8/10 |
| Edit, new layout, warm prefix | 121 | 232 | 739 | 953 | 5930 | 5600 | 84 | 74 | 10/10 |
| Edit, real turn (new history), cache-aligned | 118 | 150 | 790 | 904 | 5961 | 5600 | 85 | 56 | 10/10 |
| Edit, real turn (new history), not aligned | 193 | 268 | 669 | 1023 | 5695 | 4800 | 72 | 64 | 10/10 |
| Edit, old layout (320a90f), warm | 156 | 230 | 536 | 754 | 3859 | 3200 | 62 | 56 | 10/10 |
| Edit, new layout, JSON mode off | 117 | 142 | 720 | 1023 | 5930 | 5600 | 88 | 67 | 10/10 |
| Edit, new layout, max_tokens 200 | 117 | 151 | 751 | 881 | 5930 | 5600 | 82 | 57 | 10/10 |
| Edit, Responses API (/v1/responses) | 151 | 175 | 718 | 876 | 5930 | 5600 | 81 | 56 | 10/10 |

For the round-trip row, "Total" is the full request after connecting: the floor any call pays.
