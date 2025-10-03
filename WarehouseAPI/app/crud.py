from sqlalchemy.orm import Session
from . import models, schemas
import json
from sqlalchemy import text
from typing import List, Dict
from app.utils import verify_password

# def authenticate_user(db: Session, EmailId: str, Password: str):
#     return db.query(models.Users).filter(
#         models.Users.EmailId == EmailId,
#         models.Users.Password == Password
#     ).first()

def authenticate_user(db: Session, EmailId: str, Password: str):
    user = db.query(models.Users).filter(models.Users.EmailId == EmailId).first()
    if not user:
        return None
    if not verify_password(Password, user.Password):  # bcrypt check
        return None
    return user

def create_user(db: Session, users: schemas.UserCreate):
    db_user = models.User(**users.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session):
    return db.query(models.User).all()

def create_warehouse(db: Session, warehouse: schemas.WarehouseCreate):
    db_w = models.Warehouse(**warehouse.dict())
    db.add(db_w)
    db.commit()
    db.refresh(db_w)
    return db_w

def get_warehouses(db: Session):
    return db.query(models.Warehouse).all()

def create_inspection(db: Session, ins: schemas.InspectionCreate):
    db_ins = models.Inspection(
        warehouse_id=ins.warehouse_id,
        inspector_id=ins.inspector_id,
        manager_id=ins.manager_id,
        data=json.dumps(ins.data)
    )
    db.add(db_ins)
    db.commit()
    db.refresh(db_ins)
    return db_ins

def get_inspections(db: Session):
    return db.query(models.Inspection).all()

# API/crud.py


def get_inspection_counts(db: Session) -> Dict[str, int]:
    """
    Returns a dict with keys: total, pending, completed, failed.
    Note: you asked that 'Failed' map to rows with Status = 'In Progress'
    """
    sql = text("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN `Status` = 'Pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN `Status` = 'Completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN `Status` = 'In Progress' THEN 1 ELSE 0 END) AS inprogress
        FROM inspections
    """)
    row = db.execute(sql).mappings().first()
    # safety: convert to int and handle None
    return {
        "total": int(row["total"] or 0),
        "pending": int(row["pending"] or 0),
        "completed": int(row["completed"] or 0),
        "inprogress": int(row["inprogress"] or 0),
    }

def get_warehouses_count(db: Session) -> int:
    sql = text("SELECT COUNT(*) AS count FROM warehouses")
    row = db.execute(sql).mappings().first()
    return int(row["count"] or 0)

def get_inspectors_count(db: Session) -> int:
    sql = text("SELECT COUNT(*) AS count FROM users WHERE Role = 'Inspector'")
    row = db.execute(sql).mappings().first()
    return int(row["count"] or 0)

def get_managers_count(db: Session) -> int:
    sql = text("SELECT COUNT(*) AS count FROM users WHERE Role = 'Manager'")
    row = db.execute(sql).mappings().first()
    return int(row["count"] or 0)

def get_average_completed_percentage(db: Session) -> float:
    sql = text("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS completed
        FROM inspections
    """)
    row = db.execute(sql).mappings().first()
    total = int(row["total"] or 0)
    completed = int(row["completed"] or 0)
    if total == 0:
        return 0.0
    return round((completed / total) * 100, 2)

def get_warehouses_for_inspector(db: Session, inspector_id: int) -> List[Dict]:
    sql = text("""
        SELECT w.Id_Warehouse AS id, w.Warehouse_Name AS name, w.Location AS location
        FROM user_warehouse_map uw
        JOIN warehouses w ON uw.Warehouse_id = w.Id_Warehouse
        WHERE uw.User_id = :inspector_id
    """)
    rows = db.execute(sql, {"inspector_id": inspector_id}).mappings().all()
    return [{"id": r["id"], "name": r["name"], "location": r["location"]} for r in rows]

def get_all_commodities(db: Session):
    return db.query(models.Commoditymaster).all()