import pymysql
from urllib.parse import quote_plus
from sqlalchemy import inspect
from app.database.connection import engine
from app.database.base import Base
import app.models  # register Transaction and RiskAnalysis

def init_database():
    raw_password = "Charan@2008"
    print("1. Connecting to MySQL server...")
    conn = pymysql.connect(host="localhost", user="root", password=raw_password)
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS payrakshak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print("2. Database 'payrakshak' verified/created.")
    conn.close()

    print("3. Creating tables via SQLAlchemy Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"4. Successfully created tables: {tables}")
    assert "transactions" in tables, "Table 'transactions' not found"
    assert "risk_analyses" in tables, "Table 'risk_analyses' not found"
    print("PHASE 1 DATABASE INITIALIZATION COMPLETED!")

if __name__ == "__main__":
    init_database()
