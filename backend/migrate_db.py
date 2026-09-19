import pymysql
from app.database.connection import engine
from app.database.base import Base
import app.models

def migrate():
    # 1. Create any missing tables (e.g. demo_accounts)
    Base.metadata.create_all(bind=engine)
    print("Base.metadata.create_all executed.")

    # 2. Add missing columns if MySQL table was created with older schema
    try:
        from app.core.config import settings
        # parse credentials from DATABASE_URL or environment
        import re
        m = re.search(r"://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)", settings.DATABASE_URL)
        if m:
            user, password, host, port, dbname = m.group(1), m.group(2), m.group(3), m.group(4) or 3306, m.group(5)
            # unquote if needed
            from urllib.parse import unquote
            password = unquote(password)
            conn = pymysql.connect(
                host=host,
                user=user,
                password=password,
                port=int(port),
                database=dbname
            )
            cursor = conn.cursor()

            # Check status column on transactions
            cursor.execute("SHOW COLUMNS FROM transactions LIKE 'status';")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE transactions ADD COLUMN status VARCHAR(50) DEFAULT 'ANALYZED';")
                print("Column 'status' added to 'transactions'.")
            else:
                print("Column 'status' already exists on 'transactions'.")

            # Check ai_analysis on risk_analyses
            cursor.execute("SHOW COLUMNS FROM risk_analyses LIKE 'ai_analysis';")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE risk_analyses ADD COLUMN ai_analysis JSON NULL;")
                print("Column 'ai_analysis' added to 'risk_analyses'.")

            conn.commit()
            conn.close()
    except Exception as exc:
        print(f"Direct column check notice: {exc}")

if __name__ == "__main__":
    migrate()
