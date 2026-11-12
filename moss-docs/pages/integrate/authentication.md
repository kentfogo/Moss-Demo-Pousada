<!-- Source: https://docs.moss.dev/docs/integrate/authentication.md -->
# Moss SDK authentication

> Configure project credentials for the Moss SDKs

For SDK access, export your Moss project credentials in the shell.

```bash theme={null}
export MOSS_PROJECT_ID=your_project_id
export MOSS_PROJECT_KEY=your_project_key
```

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
```

```python Python theme={null}
import os
from moss import MossClient

client = MossClient(os.getenv('MOSS_PROJECT_ID'), os.getenv('MOSS_PROJECT_KEY'))
```

## Managing project keys

Create keys on the project's **API Keys** page in the [Moss Portal](https://portal.usemoss.dev). New projects start with no key.

* **Shown once.** A key is displayed only at creation. Store it in a secret manager right away. If you lose it, create a new one.
* **Rotate with overlap.** Create a new key, move your clients to it, then delete the old one. A project can hold several keys at once, so nothing goes down during the switch.
* **Delete revokes.** Deleting a key blocks new tokens right away. Tokens already issued with it stop working within about 20 seconds.

Any org member can see the list of keys. Org owners, admins, and the project owner can create and delete them.

You can also manage keys from the terminal with the [Moss CLI](https://docs.moss.dev/docs/integrations/moss-cli.md#log-in-and-manage-keys): `moss login`, then `moss keys create`, `list` or `delete`.

## Session authentication

Project credentials are validated when a session is opened: `client.session(...)` raises if they're invalid. For long-lived sessions, tokens are cached and auto-refreshed, so you stay authenticated without re-supplying credentials. See [Sessions](https://docs.moss.dev/docs/integrate/sessions.md).
