<!-- Source: https://docs.moss.dev/docs/integrations/data-connectors.md -->
# Data Connectors

> Sync rows from SQLite, MongoDB, MySQL, or Supabase into a Moss index.

Data connectors let you pull rows from a database and index them in Moss with a single `ingest()` call. Each connector is a self-contained pip package — install only what you need.

| Package | Source | Extra dependency |
| - | - | - |
| `moss-connector-sqlite` | SQLite | (stdlib `sqlite3`) |
| `moss-connector-mongodb` | MongoDB | `pymongo` |
| `moss-connector-mysql` | MySQL / MariaDB / PlanetScale | `pymysql` |
| `moss-connector-supabase` | Supabase (PostgREST) | `supabase` |

## How it works

You define a connector (the data source + a `mapper` function) and call `ingest()`. The mapper converts each row into a `DocumentInfo` object you control: choose which column becomes the searchable `text` and which become filterable `metadata`.

```python theme={null}
import asyncio
from moss import DocumentInfo
from moss_connector_sqlite import SQLiteConnector, ingest

async def main():
    source = SQLiteConnector(
        database="my.db",
        query="SELECT id, title, body FROM articles",
        mapper=lambda r: DocumentInfo(
            id=str(r["id"]),
            text=r["body"],
            metadata={"title": r["title"]},
        ),
    )

    result = await ingest(
        source,
        project_id="...",
        project_key="...",
        index_name="articles",
    )
    print(f"Indexed {result.doc_count} rows")

asyncio.run(main())
```

Use `auto_id=True` in `ingest()` when your mapper doesn't produce a stable primary key and you want Moss to generate UUID document IDs.

***

## SQLite

```bash theme={null}
pip install moss-connector-sqlite
```

```python theme={null}
import asyncio
from moss import DocumentInfo
from moss_connector_sqlite import SQLiteConnector, ingest

async def main():
    source = SQLiteConnector(
        database="./my.db",
        query="SELECT id, title, body FROM articles",
        mapper=lambda r: DocumentInfo(
            id=str(r["id"]),
            text=r["body"],
            metadata={"title": r["title"]},
        ),
    )
    result = await ingest(source, project_id="...", project_key="...", index_name="articles")
    print(f"copied {result.doc_count} rows")

asyncio.run(main())
```

***

## MongoDB

```bash theme={null}
pip install moss-connector-mongodb
```

```python theme={null}
import asyncio
from moss import DocumentInfo
from moss_connector_mongodb import MongoDBConnector, ingest

async def main():
    source = MongoDBConnector(
        uri="mongodb://localhost:27017",
        database="shop",
        collection="articles",
        mapper=lambda r: DocumentInfo(
            id=str(r["_id"]),   # bson.ObjectId → hex string
            text=r["body"],
            metadata={"title": r["title"]},
        ),
        filter={"status": "published"},                 # optional
        projection={"_id": 1, "title": 1, "body": 1},  # optional
    )
    result = await ingest(source, project_id="...", project_key="...", index_name="articles")
    print(f"copied {result.doc_count} rows")

asyncio.run(main())
```

***

## MySQL / MariaDB

```bash theme={null}
pip install moss-connector-mysql
```

```python theme={null}
import asyncio
from moss import DocumentInfo
from moss_connector_mysql import MySQLConnector, ingest

async def main():
    source = MySQLConnector(
        host="localhost",
        user="root",
        password="secret",
        database="mydb",
        query="SELECT id, title, body FROM articles",
        mapper=lambda row: DocumentInfo(
            id=str(row["id"]),
            text=row["body"],
            metadata={"title": row["title"]},
        ),
        port=3306,
    )
    result = await ingest(source, project_id="...", project_key="...", index_name="articles")
    print(f"copied {result.doc_count} rows")

asyncio.run(main())
```

***

## Supabase

```bash theme={null}
pip install moss-connector-supabase
```

```python theme={null}
import asyncio
from moss import DocumentInfo
from moss_connector_supabase import SupabaseConnector, ingest

async def main():
    source = SupabaseConnector(
        url="https://xxx.supabase.co",
        key="your-anon-or-service-key",
        table="articles",
        mapper=lambda row: DocumentInfo(
            id=str(row["id"]),
            text=row["body"],
            metadata={"title": row["title"]},
        ),
    )
    result = await ingest(source, project_id="...", project_key="...", index_name="articles")
    print(f"copied {result.doc_count} rows")

asyncio.run(main())
```

> [!NOTE]
>
> The Supabase connector reads rows as dicts via PostgREST. Your table needs at
> least one stringifiable column for `id` and one text column for `text`. All
> other columns are optional metadata.
