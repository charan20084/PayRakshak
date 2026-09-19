from sqlalchemy import inspect, text
from app.database.connection import engine, is_postgres
from app.database.base import Base
import app.models  # register Transaction, RiskAnalysis, and DemoAccount

def init_database():
    print("1. Initializing database connection...")
    with engine.connect() as conn:
        if is_postgres:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS payrakshak;"))
            conn.commit()
            print("2. Schema 'payrakshak' verified/created on PostgreSQL.")
        else:
            print("2. Database engine verified.")

    print("3. Creating tables via SQLAlchemy Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if is_postgres:
        tables = inspector.get_table_names(schema="payrakshak")
    else:
        tables = inspector.get_table_names()

    print(f"4. Successfully verified tables: {tables}")
    assert "transactions" in tables, "Table 'transactions' not found"
    assert "risk_analyses" in tables, "Table 'risk_analyses' not found"
    print("DATABASE INITIALIZATION COMPLETED!")

if __name__ == "__main__":
    init_database()
