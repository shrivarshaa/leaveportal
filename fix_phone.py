from database import SessionLocal
from models import User

db = SessionLocal()
varshaa = db.query(User).filter(User.username == 'varshaa').first()
if varshaa:
    varshaa.parent_phone = '9486783749'
    db.commit()
    print("Fixed varshaa's phone!")
