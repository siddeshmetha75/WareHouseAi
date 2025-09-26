from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app import models
from app.schemas.remark import Remark, RemarkCreate, RemarkUpdate

router = APIRouter(prefix="/remarks", tags=["Remarks"])


# Get all remarks
@router.get("/", response_model=list[Remark])
def get_remarks(db: Session = Depends(get_db)):
    return db.query(models.Remark).all()


# Get remark by id
@router.get("/{remark_id}", response_model=Remark)
def get_remark(remark_id: int, db: Session = Depends(get_db)):
    remark = db.query(models.Remark).filter(models.Remark.Id_Remark == remark_id).first()
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    return remark


# Create remark
@router.post("/", response_model=Remark)
def create_remark(remark: RemarkCreate, db: Session = Depends(get_db)):
    new_remark = models.Remark(**remark.model_dump())
    db.add(new_remark)
    db.commit()
    db.refresh(new_remark)
    return new_remark


# Update remark
@router.put("/{remark_id}", response_model=Remark)
def update_remark(remark_id: int, remark: RemarkUpdate, db: Session = Depends(get_db)):
    db_remark = db.query(models.Remark).filter(models.Remark.Id_Remark == remark_id).first()
    if not db_remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    for key, value in remark.model_dump(exclude_unset=True).items():
        setattr(db_remark, key, value)
    db.commit()
    db.refresh(db_remark)
    return db_remark


# Delete remark (hard delete, because no Is_Active column in table)
@router.delete("/{remark_id}")
def delete_remark(remark_id: int, db: Session = Depends(get_db)):
    db_remark = db.query(models.Remark).filter(models.Remark.Id_Remark == remark_id).first()
    if not db_remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    db.delete(db_remark)
    db.commit()
    return {"detail": "Remark deleted"}
