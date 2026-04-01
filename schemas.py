from pydantic import BaseModel
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    email: str
    password: str
    role: str
    sub_role: Optional[str] = None
    parent_phone: Optional[str] = None

class UserResponse(UserBase):
    id: int
    email: Optional[str] = None
    role: str
    sub_role: Optional[str] = None
    attendance_percentage: int
    days_present: int
    days_absent: int
    parent_phone: Optional[str] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

# Leave Request Schemas
class LeaveRequestBase(BaseModel):
    leave_type: str
    start_date: str
    end_date: str
    reason: str

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    student_id: int
    status: str
    attachment_path: Optional[str] = None
    created_at: str
    student: UserResponse
    mentor_id: Optional[int] = None
    incharge_id: Optional[int] = None
    warden_id: Optional[int] = None
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True
