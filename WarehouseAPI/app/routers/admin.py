from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import SessionLocal
from ..models import Questions, Warehouses, Users
from ..schemas.question import QuestionRead
from ..schemas.warehouse import WarehouseCreate, WarehouseUpdate
from ..dependencies import require_auth_token, get_db

router = APIRouter(prefix="/api", tags=["Admin"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# Questions CRUD (admin-scoped paths to avoid conflict with public /api/questions)
@router.get("/admin/questions", response_model=List[QuestionRead])
def list_questions(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return db.query(Questions).all()


@router.post("/admin/questions", response_model=QuestionRead)
def create_question(payload: QuestionRead, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = Questions(text_=payload.text, category=payload.category, risk_weight=payload.risk_weight)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.put("/admin/questions/{qid}", response_model=QuestionRead)
def update_question(qid: int, payload: QuestionRead, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Questions).filter(Questions.id == qid).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Question not found")
    entity.text_ = payload.text
    entity.category = payload.category
    entity.risk_weight = payload.risk_weight
    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/admin/questions/{qid}")
def delete_question(qid: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Questions).filter(Questions.id == qid).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(entity)
    db.commit()
    return {"deleted": True}


# Warehouses CRUD
@router.get("/warehouses")
def list_warehouses(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return db.query(Warehouses).all()


@router.post("/warehouses")
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = Warehouses(
        Warehouse_Name=payload.Warehouse_Name,
        Location=payload.Location,
        Code=payload.Code,
        Capacity=payload.Capacity,
        Latitude=payload.Latitude,
        Longitude=payload.Longitude,
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.put("/warehouses/{wid}")
def update_warehouse(wid: int, payload: WarehouseUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Warehouses).filter(Warehouses.Id_Warehouse == wid).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity


