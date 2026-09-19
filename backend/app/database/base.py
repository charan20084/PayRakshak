import os
from sqlalchemy import MetaData
from sqlalchemy.orm import declarative_base

# When connecting to PostgreSQL / Supabase, isolate application tables
# within the 'payrakshak' schema to prevent collisions with existing public tables.
db_url = os.getenv("DATABASE_URL", "")
schema_name = "payrakshak" if "postgres" in db_url.lower() else None

metadata = MetaData(schema=schema_name)
Base = declarative_base(metadata=metadata)
