from database import SessionLocal
from models import User, LeaveRequest

db = SessionLocal()

s = User(username="test_stu", email="stu@t.com", password="x", role="student", sub_role="hosteller", parent_phone="999")
p = User(username="test_par", email="par@t.com", password="x", role="parent", parent_phone="999")
db.add_all([s, p])
db.commit()
db.refresh(s)
db.refresh(p)

lr = LeaveRequest(student_id=s.id, leave_type="sick", start_date="2026-01-01", end_date="2026-01-02", reason="sick", status="pending_parent")
db.add(lr)
db.commit()
db.refresh(lr)

# Test query for parent
leaves = db.query(LeaveRequest).join(User, LeaveRequest.student_id == User.id).filter(
    (User.parent_phone == p.parent_phone) | (LeaveRequest.parent_id == p.id)
).all()

print("Found leaves for parent?", len(leaves))
if leaves:
    print("Leave status:", leaves[0].status)
    print("Leave student username:", leaves[0].student.username)

# cleanup
db.delete(lr)
db.delete(s)
db.delete(p)
db.commit()
