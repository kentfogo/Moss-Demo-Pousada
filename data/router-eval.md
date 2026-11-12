# Intent router evaluation

Live on the branch deploy (Moss index `builder-intents-1p9o9b7`, model `moss-minilm`), 53 held-out command phrases and 28 requests that need the model (`api/_router-eval-set.js`; none appear in `api/_intents.js`). Re-run with `GET /api/router-eval`.

**Timing (warm instance):** query p50 13.8 ms, p95 20 ms, including embedding the query on the function. **Cold:** building the index 6100 ms (once, ever), loading the model and index about 5 s per new instance (the 11 s load span includes the build), which is why a cold turn skips the router after 250 ms and the page sends a warm-up ping.

## Semantic search only

Embeddings confuse opposites, with high confidence: "the buttons need to be bigger" matched **Smaller buttons** at 0.94, and "buttons without fill" matched **Solid buttons** at 0.92.

| High threshold | Instant (correct) | Wrong command | False fire |
|---|---|---|---|
| 0.6 | 38/53 | 9 | 3/28 |
| 0.65 | 33/53 | 8 | 2/28 |
| 0.7 | 29/53 | 5 | 2/28 |
| 0.75 | 24/53 | 4 | 0/28 |
| 0.8 | 17/53 | 3 | 0/28 |
| 0.82 | 15/53 | 3 | 0/28 |
| 0.85 | 13/53 | 3 | 0/28 |
| 0.9 | 6/53 | 2 | 0/28 |

## Hybrid: semantic search plus keyword guards (shipped)

Each command has `require`/`avoid` word patterns. Search proposes, the guards veto, and the best remaining command decides.

| High threshold | Instant (correct) | Wrong command | False fire |
|---|---|---|---|
| 0.6 | 46/53 | 0 | 0/28 |
| 0.65 | 39/53 | 0 | 0/28 |
| 0.7 | 33/53 | 0 | 0/28 |
| 0.75 | 27/53 | 0 | 0/28 |
| 0.8 | 20/53 | 0 | 0/28 |
| 0.82 | 18/53 | 0 | 0/28 |
| 0.85 | 14/53 | 0 | 0/28 |
| 0.9 | 7/53 | 0 | 0/28 |

**Chosen:** high 0.65 (39 of 53 commands run instantly, none wrong, none of 28 misfire), with a little margin over 0.6 because the negative set is small. Middle band 0.5–0.65 sends the likely commands to the model as hints. Override with `ROUTER_HIGH` and `ROUTER_MID`.
