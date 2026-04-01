import sqlalchemy

# This URL deliberately excludes sslmode=require to see if pg8000 automatically handles it, or fails.
# Actually, let's include sslmode=require. Since SQLAlchemy 2.0+ it should pass it correctly to pg8000!
url = "postgresql+pg8000://postgres.hodaapyjlfhngnrqyioh:Varshaa1326%23@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

try:
    engine = sqlalchemy.create_engine(url)
    connection = engine.connect()
    print("SUCCESS: pg8000 connected to Supabase pooler with SSL!")
    connection.close()
except Exception as e:
    import traceback
    traceback.print_exc()
