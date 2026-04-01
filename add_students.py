import sys
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from database import Base, SQLALCHEMY_DATABASE_URL

def add_students():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    base_names = ["alex", "brandon", "charlie", "david", "ella", "fiona", "george", "hannah"]
    added = 0
    for name in base_names:
        if not db.query(User).filter(User.username == name).first():
            att = random.randint(60, 95)
            days_present = random.randint(50, 80)
            days_absent = random.randint(0, 15)
            u = User(
                username=name,
                email=f"{name}@test.com",
                password="pwd",
                role="student",
                sub_role=random.choice(["hosteller", "dayscholar"]),
                attendance_percentage=att,
                days_present=days_present,
                days_absent=days_absent
            )
            db.add(u)
            added += 1
            
    db.commit()
    print(f"Added {added} new students!")
    db.close()

if __name__ == "__main__":
    add_students()
