import traceback
import sys
import os

os.environ["VERCEL"] = "1"

try:
    import database
    database.Base.metadata.create_all(bind=database.engine)
    print("Success: Tables created!")
except Exception as e:
    print("FAILED TO CONNECT:")
    traceback.print_exc()
