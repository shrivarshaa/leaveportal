from fastapi.testclient import TestClient
from main import app, get_db
from models import User, LeaveRequest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import os

# Create a clean test database
TEST_DB_URL = "sqlite:///./test_analytics.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def setup_db():
    db = TestingSessionLocal()
    # Create mentor
    mentor = User(username="m1", email="m1@test.com", password="pwd", role="mentor")
    db.add(mentor)
    db.commit()
    db.refresh(mentor)

    # Create students
    s1 = User(username="s1", email="s1@test.com", password="pwd", role="student", sub_role="hosteller", days_absent=5, attendance_percentage=85)
    s2 = User(username="s2", email="s2@test.com", password="pwd", role="student", sub_role="dayscholar", days_absent=2, attendance_percentage=92)
    db.add_all([s1, s2])
    db.commit()

    # Create approved leaves
    l1 = LeaveRequest(student_id=s1.id, leave_type="casual", status="approved", start_date="2025-10-10", end_date="2025-10-12", mentor_id=mentor.id)
    l2 = LeaveRequest(student_id=s1.id, leave_type="sick", status="approved", start_date="2025-10-15", end_date="2025-10-16", mentor_id=mentor.id)
    l3 = LeaveRequest(student_id=s2.id, leave_type="medical", status="approved", start_date="2025-11-01", end_date="2025-11-05", mentor_id=mentor.id)
    db.add_all([l1, l2, l3])
    db.commit()

    return mentor.id, s1.id

if __name__ == "__main__":
    mentor_id, s1_id = setup_db()
    
    # Test Student Analytics
    res_student = client.get(f"/analytics/{s1_id}")
    print("Student Analytics Status:", res_student.status_code)
    print("Student Analytics Data:", res_student.json())

    # Test Mentor Analytics
    res_mentor = client.get(f"/analytics/{mentor_id}")
    print("Mentor Analytics Status:", res_mentor.status_code)
    print("Mentor Analytics Data:", res_mentor.json())

    # Cleanup
    os.remove("test_analytics.db")
