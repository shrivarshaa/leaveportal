from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)  # In a real app, hash this
    role = Column(String)      # student, mentor, incharge, warden
    sub_role = Column(String) # hosteller, dayscholar (for students)
    parent_phone = Column(String, nullable=True) # For students to track their parent's SMS contact
    attendance_percentage = Column(Integer, default=100)
    days_present = Column(Integer, default=85)
    days_absent = Column(Integer, default=0)

    # Relationships
    leaves = relationship("LeaveRequest", foreign_keys="[LeaveRequest.student_id]", back_populates="student")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    leave_type = Column(String) # casual, od, emergency, sick
    start_date = Column(String)
    end_date = Column(String)
    reason = Column(Text)
    status = Column(String) # pending_incharge, pending_mentor, pending_warden, approved, rejected
    attachment_path = Column(String, nullable=True)
    created_at = Column(String, default=lambda: datetime.datetime.now().isoformat())

    # Tracking who actioned the leave
    incharge_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    warden_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    student = relationship("User", foreign_keys=[student_id], back_populates="leaves")
    mentor = relationship("User", foreign_keys=[mentor_id])
    incharge = relationship("User", foreign_keys=[incharge_id])
    warden = relationship("User", foreign_keys=[warden_id])
    parent = relationship("User", foreign_keys=[parent_id])
