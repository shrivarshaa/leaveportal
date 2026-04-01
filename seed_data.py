import datetime
from models import User, LeaveRequest
from database import Base, engine, SessionLocal

def seed_data():
    db = SessionLocal()
    
    # Find varshaa
    varshaa = db.query(User).filter(User.username == "varshaa").first()
    
    if not varshaa:
        print("User varshaa not found. Creating varshaa...")
        varshaa = User(
            username="varshaa",
            email="varshaa@test.com",
            password="pwd",
            role="student",
            sub_role="hosteller",
            parent_phone="+919486783749",
            attendance_percentage=100,
            days_present=85,
            days_absent=0
        )
        db.add(varshaa)
        db.commit()
        db.refresh(varshaa)

    # Some past dates for trends
    now = datetime.datetime.now()
    jan_date = (now.replace(month=1, day=15)).isoformat()
    feb_date = (now.replace(month=2, day=10)).isoformat()
    mar_date = (now.replace(month=3, day=5)).isoformat()

    # Create approved leaves for varshaa
    leaves = [
        LeaveRequest(
            student_id=varshaa.id,
            leave_type="casual",
            start_date=jan_date,
            end_date=(now.replace(month=1, day=16)).isoformat(),
            reason="Family function",
            status="approved"
        ),
        LeaveRequest(
            student_id=varshaa.id,
            leave_type="sick",
            start_date=feb_date,
            end_date=(now.replace(month=2, day=12)).isoformat(),
            reason="Fever and cold",
            status="approved"
        ),
        LeaveRequest(
            student_id=varshaa.id,
            leave_type="od",
            start_date=mar_date,
            end_date=(now.replace(month=3, day=6)).isoformat(),
            reason="College Symposium",
            status="approved"
        )
    ]
    
    # Remove existing demo leaves to avoid duplicates if run multiple times
    db.query(LeaveRequest).filter(LeaveRequest.student_id == varshaa.id, LeaveRequest.status == "approved").delete()
    
    db.add_all(leaves)
    
    # Update varshaa attendance
    varshaa.days_absent = 5
    varshaa.attendance_percentage = 88
    
    # Create another student and mentor to populate faculty view
    demo_mentor = db.query(User).filter(User.username == "demomentor").first()
    if not demo_mentor:
        demo_mentor = User(
            username="demomentor",
            email="mentor@test.com",
            password="pwd",
            role="mentor"
        )
        db.add(demo_mentor)
        db.commit()
        db.refresh(demo_mentor)
        
    # Create parent demo user
    demo_parent = db.query(User).filter(User.username == "parent123").first()
    if not demo_parent:
        demo_parent = User(
            username="parent123",
            email="parent@test.com",
            password="pwd",
            role="parent",
            parent_phone="+919486783749"
        )
        db.add(demo_parent)
        db.commit()
        db.refresh(demo_parent)
        
    demo_dayscholar = db.query(User).filter(User.username == "dayscholar1").first()
    if not demo_dayscholar:
        demo_dayscholar = User(
            username="dayscholar1",
            email="ds1@test.com",
            password="pwd",
            role="student",
            sub_role="dayscholar",
            attendance_percentage=72,
            days_present=60,
            days_absent=12
        )
        db.add(demo_dayscholar)
        db.commit()
        db.refresh(demo_dayscholar)
        
    # Give leaves to dayscholar and set mentor_id for faculty dashboard
    more_leaves = [
        LeaveRequest(
            student_id=demo_dayscholar.id,
            leave_type="medical",
            start_date=feb_date,
            end_date=(now.replace(month=2, day=15)).isoformat(),
            reason="Surgery",
            status="approved",
            mentor_id=demo_mentor.id
        ),
        LeaveRequest(
            student_id=varshaa.id,
            leave_type="casual",
            start_date=jan_date,
            end_date=jan_date,
            reason="Event",
            status="approved",
            mentor_id=demo_mentor.id
        )
    ]
    db.add_all(more_leaves)

    db.commit()
    print("Mock data seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_data()
