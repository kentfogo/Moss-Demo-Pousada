<!-- Source: https://docs.moss.dev/docs/reference/telemetry.md -->
# Telemetry

> What the Moss SDKs send to Moss, when they send it, and what never leaves your device.

Every Moss SDK sends usage telemetry to the Moss service: counts, timings, versions and
identifiers that show how Moss is used. Telemetry never contains your queries or your
documents. This page lists what is sent, when, and where, and the other data that leaves the
device when you use cloud features.

Telemetry is always on.

## What is sent

Every report from an SDK client or session carries:

* Your project id.
* The kind of operation it reports, such as an index load or a batch of queries.
* A random id for the client or session that sent it, so its reports can be grouped. A
  session opened from a client may carry the client's id.
* The device id, and the user id when you set one. See [Device id and user id](#device-id-and-user-id).
* The version of the SDK and of its native core and, outside the browser, the layout version
  of the on-disk model cache.

Depending on the operation, a report may also include:

* The name of the index or session it concerns, or the names of every index in a
  multi-index query.
* The embedding model id and its exact version. Swift and C sessions also send which version
  of the session options API opened them.
* Counts: queries run, documents in an index or session, documents added, and an estimate of
  the tokens in the added documents. The estimate is computed from the length of the text,
  and the text itself is not sent.
* How long each query took, in milliseconds.
* How an index was loaded: whether a cache directory was set, whether the index came from the
  disk cache while the Moss service was unreachable, the auto-refresh setting and interval,
  whether a refresh changed the index, when the cloud copy was last updated, and whether an
  old session snapshot was rebuilt and saved again.
* The name of the on-disk cache snapshot in use, a generated name of the form
  `generation-<timestamp>-<random id>`. Never its path.

Voice agents built with `moss-agent` (Python) send the same fields without a device id. They
also send, for each [LiveKit](https://livekit.com/) call, the LiveKit room name and job id,
a random call id, and the start time, end time and duration of the call. The agent's `client_id` option sets its random
id, which then stays the same across runs.

The browser SDK (`@moss-dev/moss-web`) sends less: the project id, a random id per client, the
device id, versions, and query counts. It sends no index names, timings or model details.
Releases before `@moss-dev/moss-web` 1.4.0, or with `@moss-dev/moss-wasm` 0.16.0, send none.

> [!WARNING]
>
> Index names, session names and LiveKit room names are sent exactly as you chose them. Keep
> personal data out of them.

## What is never sent

A report's body **never** contains:

* Query text.
* Document text, metadata, payloads or embeddings.
* File paths or file contents.
* Your operating system, device model, hardware serial numbers, MAC addresses or location.

The SDKs include no third-party analytics library, and telemetry goes only to the Moss
service. Like any request, each report reaches Moss from your IP address. In the browser it
also carries the headers the browser adds to every request, such as `User-Agent`, which names
the browser and operating system.

## When it is sent

* **When an operation happens.** Loading or unloading an index, an auto-refresh, and loading,
  changing or pushing a session each send one report in the background. If it fails, it is
  not sent again, and it never fails the call that caused it.
* **While you query.** Queries are counted and reported together every few seconds while
  there is activity. A client or session with nothing new to report sends nothing.
* **When you close.** Closing a client or session sends a final report and waits until it
  arrives or 2 seconds pass. See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).
* **While a voice agent runs.** `moss-agent` sends a heartbeat every few seconds, even when
  idle.

When the Moss service can't be reached, usage and query reports stay in memory for a limited
time and are sent again with later reports. Telemetry is never written to disk; the only thing
it stores is the device id described below.

> [!NOTE]
>
> The 2-second wait on close and the resending of usage and query reports need
> `@moss-js/moss` >= **1.16.0**, `moss` >= **1.15.0** (Python), Elixir `moss` >= **1.5.0**, the Swift
> SDK >= **0.8.0** or the C SDK >= **0.24.0**. Earlier releases drop a report that fails.

The browser SDK reports every few seconds after queries run, and once more when the page is
unloaded or navigated away from, or when you call `dispose()`. It does not resend a report
that fails.

## Where it goes

Telemetry is sent over HTTPS to `https://service.usemoss.dev/index/telemetry`, authenticated
with your project's access token. When you point the SDK at another index service, with
`MOSS_INDEX_URL` or a base URL option such as the browser SDK's `baseUrl`, telemetry goes to
`/telemetry` under that URL along with the rest of the index traffic. Changing the URL moves
telemetry; it does not stop it.

## Device id and user id

The device id identifies the device or app installation that runs the SDK. Every id Moss
creates is a random UUID. Moss never reads hardware serial numbers or MAC addresses.

| Where the SDK runs | Device id |
| - | - |
| Node.js, Python, Elixir, C | A random UUID in `.moss/.moss-device-id` in the user's home directory, created on first use |
| iOS (Swift) | The app's `identifierForVendor` from iOS, or a random UUID kept in the Keychain on this device only when iOS doesn't provide one |
| Android (Kotlin) | `Settings.Secure.ANDROID_ID`, or a random UUID kept in the app's `filesDir/moss-device-id` when Android returns none |
| Browser | A random UUID in `localStorage` under `moss-device-id`, one per origin |

**Home directory.** The home directory is `$HOME`, else `%USERPROFILE%`, else the system's
home directory. The file survives restarts and SDK upgrades or reinstalls, because it lives in
the home directory and not in the package. Deleting it gives the device a new id. When the
home directory can't be found or written, each process uses a new random id.

**Cache directory.** A JavaScript, Python or Elixir client given a cache directory, as a
client option or on a load (`cachePath`, or `cache_path` in Python and Elixir), reports the id
in `.moss-device-id` inside that directory, and creates the file when it is missing. That id
lasts as long as the directory does. In C, a load given a cache directory reports the id from
that file when it is already there, but doesn't create it. The client still
creates the home-directory file, but doesn't report its id while a cache-directory id is in use.

**iOS.** iOS issues and resets `identifierForVendor` under its own rules. The Swift SDK also
sends Moss's own random id alongside it.

**Android.** Android scopes `ANDROID_ID` to the app's signing key, the user and the device, and resets it on a factory reset. Declare it under Device or other IDs in Play's Data safety form.

**Browser.** The id survives page reloads on the same origin and is cleared with the site's
data. When `localStorage` is missing or blocked, each page uses a new id, and telemetry is
still sent.

**Your own device id.** You can supply the device id yourself: `identity.deviceId` in the
JavaScript client options, or `moss_client_new_with_device_id` in C. Moss still sends its own
random id alongside yours. The Python, Swift, Android, Elixir and browser SDKs have no such option.

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(projectId, projectKey, {
  identity: { deviceId: installationId, userId: accountId },
})
```

**User id.** Only the JavaScript SDK (`@moss-js/moss`) has one: `identity.userId`, sent only
when you set it. Moss never creates a user id.

## Other data that leaves the device

Telemetry is not the only traffic. These operations send data to the Moss service because they
work with cloud indexes:

| When you | What is sent |
| - | - |
| Use a project key | The project id and key, exchanged for a short-lived access token at first use and again before it expires. With a custom authenticator, your authenticator supplies the token instead |
| Create an index, or add documents to a cloud index | Document ids, text, metadata, payloads and any embeddings you supply |
| Delete or fetch documents in a cloud index | Document ids |
| Create an index from files | The file contents and file names |
| Push a session | Every document in the session, with its id, text, metadata, payload and embedding |
| Load or refresh an index | The index name and project id. The index is downloaded to the device |
| Open a session | In Python and Elixir, and by default in Swift and C, the session name and project id, to load the cloud index with that name; when it exists, it is downloaded into the session. Opening a JavaScript session requests no index: its name goes only into usage telemetry, and the first index request is `session.loadIndex()` or `pushIndex()` |
| Load a built-in embedding model, cached or not | The model id and a one-time public key, sent to the Moss service for a short-lived key to the model. When the model isn't cached, it is also downloaded from `models.moss.link`. Loading fails while the Moss service can't be reached |
| Add a web source (JavaScript and Python) | The URL to crawl and the index name |

While idle, the browser SDK checks its access token every 30 seconds, and requests a new
one, from the project key or through your authenticator, only when it is about to expire.

**Queries never leave the device.** Every query runs on an index loaded into memory or on a
session, and its text is embedded on the device, in the browser too. There is no cloud query.
The native SDKs load a built-in model when they load an index that uses it. The browser SDK
loads it at the first text query, which then contacts the Moss service as the table above
describes.

## Related

> [card] [Privacy Policy](https://docs.moss.dev/docs/privacy)
>
> How Moss handles personal data.

> [card] [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md)
>
> Close clients and sessions so the final report is sent.
