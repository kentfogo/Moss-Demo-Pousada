<!-- Source: https://docs.moss.dev/docs/reference/android/getting-started.md -->
# Android SDK Overview

> On-device semantic search for Android with the Moss Android SDK.

The Moss Android SDK brings semantic search to Android apps. It is a Kotlin
library (`dev.usemoss.moss`) over the native `libmoss` runtime: an index loads
from Moss once and is then queried **on the device**, with no network call at
query time.

Model responses grounded in your indexes come from a separate client,
`MossInference`. See [Inference](https://docs.moss.dev/docs/inference/sdks/android.md).

## Requirements

* Android 7.0 (API 24) or later
* An arm64-v8a phone or emulator image. The SDK has no x86\_64 or 32-bit build.
* Kotlin, or Java with `org.jetbrains.kotlin:kotlin-stdlib` added to the app

## Install

The SDK ships as a file AAR on the `android-sdk-v<version>` releases of
[usemoss/moss](https://github.com/usemoss/moss/releases). Download it into your
app module:

```bash theme={null}
VERSION=0.31.0
mkdir -p app/libs
curl -fL -o app/libs/moss-android.aar \
  "https://github.com/usemoss/moss/releases/download/android-sdk-v${VERSION}/moss-android-${VERSION}.aar"
```

Then add it in `app/build.gradle.kts`:

```kotlin theme={null}
android {
    defaultConfig {
        minSdk = 24
        ndk { abiFilters += "arm64-v8a" }
    }
}

dependencies {
    implementation(files("libs/moss-android.aar"))
}
```

The AAR brings the `INTERNET` permission and the R8 rules the SDK needs.

> [!NOTE]
>
> The Android SDK is distributed only as a GitHub release AAR. It is not published
> to Maven Central. Add it to your app module: a library module that builds its
> own AAR cannot depend on a local AAR.

## Quick start

Every blocking call rejects the main thread with a `MossException`, so call them
from `Dispatchers.IO` (with `kotlinx-coroutines-android`) or a background
executor:

```kotlin theme={null}
withContext(Dispatchers.IO) {
    MossClient(context, projectId, projectKey).use { client ->
        client.loadIndex("faq")
        val result = client.query("faq", "how do I reset my password", QueryOptions(topK = 5))
        result.docs.forEach { println("${it.id} ${it.score}") }
    }
}
```

`loadIndex` downloads the index once and caches it in the app's cache directory,
and every query after that runs on the device. Querying an index that is not
loaded throws `MossException.NotFound`.

## Notes

* Keep one `MossClient` per process. A second one cannot start while another is
  live or still closing.
* On a device where the native library cannot load, such as an x86\_64 emulator
  image, every call throws `MossException`.
* `close()` returns at once and frees the native client in the background.
