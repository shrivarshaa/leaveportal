from database import SessionLocal
from models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"User '{u.username}', Role: {u.role}, Parent Phone: '{u.parent_phone}'")
