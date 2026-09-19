from sqlalchemy import text
from app.database.connection import engine, is_postgres
from app.database.base import Base
import app.models

def migrate():
    print("Executing Base.metadata.create_all...")
    with engine.connect() as conn:
        if is_postgres:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS payrakshak;"))
            conn.commit()
    Base.metadata.create_all(bind=engine)
    print("Base.metadata.create_all executed successfully.")

    try:
        with engine.connect() as conn:
            if is_postgres:
                # Ensure demo account exists in payrakshak schema
                conn.execute(text("""
                    INSERT INTO payrakshak.demo_accounts (account_number, account_holder, balance, currency)
                    VALUES ('4471', 'Rahul Sharma', 200000.0, 'INR')
                    ON CONFLICT (account_number) DO NOTHING;
                """))
                conn.commit()
                print("Demo account verified in Supabase PostgreSQL.")
            else:
                conn.execute(text("""
                    INSERT IGNORE INTO demo_accounts (account_number, account_holder, balance, currency)
                    VALUES ('4471', 'Rahul Sharma', 200000.0, 'INR');
                """))
                conn.commit()
                print("Demo account verified in MySQL.")
    except Exception as exc:
        print(f"Migration post-check notice: {exc}")

if __name__ == "__main__":
    migrate()
