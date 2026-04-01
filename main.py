from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional
import models, schemas, shutil, os, datetime, string, random
from sms_service import send_leave_sms, send_otp_sms, send_silent_leave_sms
from database import engine, get_db
from sqlalchemy import func

PENDING_OTPS = {}

def generate_otp():
    return "".join(random.choices(string.digits, k=4))

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/login", response_model=schemas.UserResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        func.lower(models.User.email) == func.lower(user.email), 
        models.User.password == user.password
    ).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return db_user

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (func.lower(models.User.username) == func.lower(user.username)) | 
        (func.lower(models.User.email) == func.lower(user.email))
    ).first()
    if db_user:
        if db_user.email.lower() == user.email.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Simple validation for sub_roles
    if user.role == "student" and user.sub_role not in ["hosteller", "dayscholar"]:
        raise HTTPException(status_code=400, detail="Student must be either a hosteller or a dayscholar")
        
    new_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password,
        role=user.role,
        sub_role=user.sub_role if user.role == "student" else None,
        parent_phone=user.parent_phone if user.role in ["student", "parent"] else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/leave", response_model=schemas.LeaveRequestResponse)
async def create_leave(
    background_tasks: BackgroundTasks,
    student_id: int = Form(...),
    leave_type: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    reason: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    def send_sms(phone, message):
        print(f"\n--- [SMS SENT to {phone}] ---")
        print(f"Message: {message}")
        print("----------------------------\n")

    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="Reason for leave is required")

    lt_lower = leave_type.lower()
    
    if lt_lower == "emergency":
        statusStr = "pending_warden"
    else:
        statusStr = "pending_otp"

    attachment_path = None
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"proof_{student_id}_{int(datetime.datetime.now().timestamp())}{file_ext}"
        upload_path = os.path.join("static", "uploads", file_name)
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attachment_path = f"/uploads/{file_name}"

    db_leave = models.LeaveRequest(
        student_id=student_id,
        leave_type=lt_lower,
        start_date=start_date,
        end_date=end_date,
        reason=reason,
        status=statusStr,
        attachment_path=attachment_path
    )
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)

    if statusStr == "pending_otp":
        otp = generate_otp()
        PENDING_OTPS[db_leave.id] = otp
        print(f"\n[SECURITY LOG] Generated Parent OTP for {student.username}: {otp}\n")
        
        with open("latest_otp.txt", "w") as f:
            f.write(f"The most recent Leave OTP for {student.username} is: {otp}\n")
        
        background_tasks.add_task(
            send_otp_sms,
            student_name=student.username,
            otp_code=otp
        )
    else:
        background_tasks.add_task(
            send_leave_sms,
            student_name=student.username,
            start_date=start_date,
            end_date=end_date,
            reason=reason
        )

    return db_leave

@app.post("/leave/{leave_id}/verify_otp", response_model=schemas.LeaveRequestResponse)
async def verify_otp(
    leave_id: int, 
    user_id: int = Form(...), 
    otp: str = Form(...), 
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave or leave.student_id != user_id:
        raise HTTPException(status_code=404, detail="Leave not found")
        
    if leave.status != "pending_otp":
        raise HTTPException(status_code=400, detail="Leave is not pending OTP")
        
    expected_otp = PENDING_OTPS.get(leave_id)
    if not expected_otp or expected_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Promote status past parent to actual approver
    leave_type = leave.leave_type.lower()
    if leave_type == "casual":
        leave.status = "pending_mentor"
    elif leave_type == "od":
        leave.status = "pending_incharge"
    elif leave_type == "medical":
        leave.status = "pending_mentor"
    elif leave_type in ["emergency", "sick"]:
        leave.status = "pending_warden"
    else:
        leave.status = "pending_mentor"
        
    db.commit()
    db.refresh(leave)
    
    # Remove OTP from memory
    if leave_id in PENDING_OTPS:
        del PENDING_OTPS[leave_id]
    
    # Notify faculty since leave is officially submitted
    student = db.query(models.User).filter(models.User.id == user_id).first()
    background_tasks.add_task(
        send_leave_sms,
        student_name=student.username,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason
    )
    
    return leave

@app.get("/leaves", response_model=list[schemas.LeaveRequestResponse])
def get_leaves(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid user")

    if user.role == "student":
        return db.query(models.LeaveRequest).filter(
            models.LeaveRequest.student_id == user.id,
            models.LeaveRequest.status != "cancelled"
        ).order_by(models.LeaveRequest.id.desc()).all()
    elif user.role == "mentor":
        return db.query(models.LeaveRequest).filter(
            (models.LeaveRequest.status == "pending_mentor") | (models.LeaveRequest.mentor_id == user.id)
        ).order_by(models.LeaveRequest.id.desc()).all()
    elif user.role == "incharge":
        return db.query(models.LeaveRequest).filter(
            (models.LeaveRequest.status == "pending_incharge") | (models.LeaveRequest.incharge_id == user.id)
        ).order_by(models.LeaveRequest.id.desc()).all()
    elif user.role == "warden":
        return db.query(models.LeaveRequest).filter(
            (models.LeaveRequest.status == "pending_warden") | (models.LeaveRequest.warden_id == user.id)
        ).order_by(models.LeaveRequest.id.desc()).all()
    elif user.role == "parent":
        # Parents see leaves for students that have their phone number
        return db.query(models.LeaveRequest).join(models.User, models.LeaveRequest.student_id == models.User.id).filter(
            (models.User.parent_phone == user.parent_phone) | (models.LeaveRequest.parent_id == user.id)
        ).order_by(models.LeaveRequest.id.desc()).all()
    
    return []

@app.put("/leave/{leave_id}/action", response_model=schemas.LeaveRequestResponse)
def leave_action(leave_id: int, user_id: int, action: str, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    
    if not user or not leave:
        raise HTTPException(status_code=404, detail="Not found")
        
    if remarks:
        leave.reason = f"{leave.reason}\n\n[Parent Remarks]: {remarks}"

    if action == "reject":
        leave.status = "rejected"
        # Track who rejected
        if user.role == "mentor": leave.mentor_id = user.id
        elif user.role == "incharge": leave.incharge_id = user.id
        elif user.role == "warden": leave.warden_id = user.id
        elif user.role == "parent": leave.parent_id = user.id
    elif action == "cancel":
        if user.role == "student" and user.id == leave.student_id and leave.status.startswith("pending_"):
            db.delete(leave)
            db.commit()
            return {"id": leave.id, "student_id": leave.student_id, "leave_type": leave.leave_type, "start_date": leave.start_date, "end_date": leave.end_date, "reason": leave.reason, "status": "deleted", "created_at": leave.created_at}
        else:
            raise HTTPException(status_code=400, detail="Cannot cancel this leave")
    elif action == "approve":
        # Role-based approval logic
        leave_type = leave.leave_type.lower()
        if user.role == "parent" and leave.status == "pending_parent":
            # Parent approves -> moves to actual initial authority
            leave.parent_id = user.id
            if leave_type == "casual":
                leave.status = "pending_mentor"
            elif leave_type == "od":
                leave.status = "pending_incharge"
            elif leave_type == "medical":
                leave.status = "pending_mentor"
            elif leave_type in ["emergency", "sick"]:
                leave.status = "pending_warden"
        elif user.role == "incharge" and leave.status == "pending_incharge":
            # Incharge approves OD -> goes to Mentor
            leave.status = "pending_mentor"
            leave.incharge_id = user.id
        elif user.role == "mentor" and leave.status == "pending_mentor":
            # Mentor approves Casual or OD
            leave.mentor_id = user.id
            if leave.student.sub_role == "hosteller":
                # For hostellers, Casual out or OD goes to Warden next
                if leave_type in ["casual", "od", "medical"]:
                    leave.status = "pending_warden"
            else:
                # For dayscholars, Mentor is final for Casual. For OD, does it go to Warden? 
                # According to rules: Day scholar doesn't need warden. OD: Incharge -> Mentor.
                # So if Day scholar, Mentor is the final approval for both Casual and OD.
                leave.status = "approved"
        elif user.role == "warden" and leave.status == "pending_warden":
            # Warden is final approval for everything that reaches them
            leave.status = "approved"
            leave.warden_id = user.id
        else:
            raise HTTPException(status_code=400, detail="Not authorized to approve this leave at this stage")
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()
    db.refresh(leave)
    return leave

@app.get("/analytics/{user_id}")
def get_analytics(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid user")

    from collections import defaultdict
    import datetime

    # Common function to calculate monthly trends
    def calculate_trends(leaves_list):
        trends = defaultdict(int)
        for lv in leaves_list:
            if lv.start_date:
                try:
                    # start_date format could be 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM'
                    dt = datetime.datetime.fromisoformat(lv.start_date)
                    month_name = dt.strftime("%B %Y")
                    trends[month_name] += 1
                except:
                    pass
        # sort by month? For now just return the dict
        return dict(trends)

    if user.role == "student":
        leaves = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.student_id == user.id,
            models.LeaveRequest.status == "approved"
        ).all()
        
        total_absent = 0
        for lv in leaves:
            if lv.leave_type != "od":
                try:
                    if "T" in lv.start_date:
                        start_dt = datetime.datetime.fromisoformat(lv.start_date.replace(" ", "T"))
                        end_dt = datetime.datetime.fromisoformat(lv.end_date.replace(" ", "T"))
                    else:
                        start_dt = datetime.datetime.strptime(lv.start_date, "%Y-%m-%d")
                        end_dt = datetime.datetime.strptime(lv.end_date, "%Y-%m-%d")
                    days_taken = (end_dt.date() - start_dt.date()).days + 1
                    if days_taken > 0:
                        total_absent += days_taken
                except Exception:
                    total_absent += 1
                    
        total_days = user.days_present + total_absent
        att_pct = int((user.days_present / total_days) * 100) if total_days > 0 else 100

        return {
            "total_leaves": len(leaves),
            "monthly_trends": calculate_trends(leaves),
            "attendance_impact": {
                "days_present": user.days_present,
                "days_absent": total_absent,
                "attendance_percentage": att_pct
            }
        }
    else:
        # Faculty / Approver view
        # Gather all leaves this user can see or has actioned, or simply all leaves if they are high level.
        # But for accurate stats, let's fetch students they manage. 
        # For simplicity based on current schema, we fetch leaves based on role logic:
        visible_students = []
        if user.role == "mentor":
            # Mentor logic usually based on department or assignment, but currently we just see leaves where mentor_id is set or pending_mentor.
            # To show meaningful stats, we will fetch all students the mentor has approved leaves for, or we can just fetch ALL students for the demo?
            # Let's fetch all users who have submitted leaves to this mentor + currently pending.
            # Actually, to show class patterns, we need to gather all approved leaves for students that mentor interacted with.
            leaves = db.query(models.LeaveRequest).filter(
                (models.LeaveRequest.mentor_id == user.id) | (models.LeaveRequest.status == "pending_mentor")
            ).all()
        elif user.role == "incharge":
            leaves = db.query(models.LeaveRequest).filter(
                (models.LeaveRequest.incharge_id == user.id) | (models.LeaveRequest.status == "pending_incharge")
            ).all()
        elif user.role == "warden":
            leaves = db.query(models.LeaveRequest).filter(
                (models.LeaveRequest.warden_id == user.id) | (models.LeaveRequest.status == "pending_warden")
            ).all()
        elif user.role == "parent":
            leaves = db.query(models.LeaveRequest).join(models.User, models.LeaveRequest.student_id == models.User.id).filter(
                (models.User.parent_phone == user.parent_phone) | (models.LeaveRequest.parent_id == user.id)
            ).all()
        else:
            leaves = []

        approved_leaves = [l for l in leaves if l.status == "approved"]
        
        # Calculate Frequent Absentees purely from approved leaves
        student_absent_map = defaultdict(int)
        for l in approved_leaves:
            if l.leave_type != "od":
                try:
                    if "T" in l.start_date:
                        start_dt = datetime.datetime.fromisoformat(l.start_date.replace(" ", "T"))
                        end_dt = datetime.datetime.fromisoformat(l.end_date.replace(" ", "T"))
                    else:
                        start_dt = datetime.datetime.strptime(l.start_date, "%Y-%m-%d")
                        end_dt = datetime.datetime.strptime(l.end_date, "%Y-%m-%d")
                    days_taken = (end_dt.date() - start_dt.date()).days + 1
                    if days_taken > 0:
                        student_absent_map[l.student_id] += days_taken
                except Exception:
                    student_absent_map[l.student_id] += 1
        
        # We find unique students in our leave list
        student_ids = list(set([l.student_id for l in leaves]))
        students = db.query(models.User).filter(models.User.id.in_(student_ids)).all()
        
        absentees_list = []
        for s in students:
            comp_absent = student_absent_map.get(s.id, 0)
            t_days = s.days_present + comp_absent
            att_pct = int((s.days_present / t_days) * 100) if t_days > 0 else 100
            
            absentees_list.append({
                "id": s.id, 
                "username": s.username, 
                "sub_role": s.sub_role, 
                "days_absent": comp_absent, 
                "attendance_percentage": att_pct
            })
            
        # Sort students by dynamic computed absent days descending
        frequent_absentees = sorted(absentees_list, key=lambda x: x["days_absent"], reverse=True)[:5]
        
        # Calculate class patterns (hosteller vs dayscholar) from approved leaves
        class_patterns = {"hosteller": 0, "dayscholar": 0}
        for l in approved_leaves:
            if l.student and l.student.sub_role:
                sub_role = l.student.sub_role.lower()
                if sub_role in class_patterns:
                    class_patterns[sub_role] += 1
                else:
                    class_patterns[sub_role] = 1

        return {
            "total_leaves": len(approved_leaves),
            "monthly_trends": calculate_trends(approved_leaves),
            "frequent_absentees": frequent_absentees,
            "class_patterns": class_patterns
        }

@app.get("/managed_students/{user_id}", response_model=list[schemas.UserResponse])
def get_managed_students(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.role == "student":
        raise HTTPException(status_code=400, detail="Invalid user or role")
    students = db.query(models.User).filter(models.User.role == "student").order_by(models.User.attendance_percentage.asc()).all()
    return students

@app.post("/mark_absent")
def mark_absent(background_tasks: BackgroundTasks, student_id: int = Form(...), db: Session = Depends(get_db)):
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student or student.role != "student":
        raise HTTPException(status_code=400, detail="Student not found")
    
    student.days_absent += 1
    total_days = student.days_present + student.days_absent
    if total_days > 0:
        student.attendance_percentage = int((student.days_present / total_days) * 100)
    
    db.commit()
    
    # Real Twilio SMS for Silent Leave Detection
    background_tasks.add_task(
        send_silent_leave_sms,
        student_name=student.username
    )
    
    # Local terminal log for demo
    print(f"\n--- [SILENT LEAVE SMS TASKED to {student.username}] ---")
        
    return {"message": "Success", "attendance_percentage": student.attendance_percentage}

# Absolute path to the static directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(BASE_DIR, "static")

app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
