from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app import models
from app.schemas.remark import Remark, RemarkCreate, RemarkUpdate

router = APIRouter(prefix="/remarks", tags=["Remarks"])


# Get all remarks
# Get all remarks (only active)
@router.get("/", response_model=list[Remark])
def get_remarks(db: Session = Depends(get_db)):
    return db.query(models.Remark).filter(models.Remark.Is_Active == 1).all()



@router.get("/{remark_id}", response_model=Remark)
def get_remark(remark_id: int, db: Session = Depends(get_db)):
    remark = db.query(models.Remark).filter(
        models.Remark.Id_Remark == remark_id,
        models.Remark.Is_Active == 1
    ).first()
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


# Soft Delete remark
@router.delete("/{remark_id}")
def delete_remark(remark_id: int, db: Session = Depends(get_db)):
    db_remark = db.query(models.Remark).filter(models.Remark.Id_Remark == remark_id).first()
    if not db_remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    db_remark.Is_Active = 0  # Soft delete
    db.commit()
    return {"detail": "Remark soft deleted"}

