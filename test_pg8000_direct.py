import sqlalchemy
import ssl

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

url = "postgresql+pg8000://postgres:Varshaa1326%23@db.hodaapyjlfhngnrqyioh.supabase.co:5432/postgres"

try:
    engine = sqlalchemy.create_engine(url, connect_args={"ssl_context": ssl_context})
    connection = engine.connect()
    print("SUCCESS: pg8000 connected to Supabase DIRECT DB with SSL!")
    connection.close()
except Exception as e:
    import traceback
    traceback.print_exc()
