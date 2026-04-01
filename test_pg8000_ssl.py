import sqlalchemy
import ssl

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

url = "postgresql+pg8000://postgres.hodaapyjlfhngnrqyioh:Varshaa1326%23@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

try:
    engine = sqlalchemy.create_engine(url, connect_args={"ssl_context": ssl_context})
    connection = engine.connect()
    print("SUCCESS: pg8000 connected to Supabase pooler with SSL!")
    connection.close()
except Exception as e:
    import traceback
    traceback.print_exc()
