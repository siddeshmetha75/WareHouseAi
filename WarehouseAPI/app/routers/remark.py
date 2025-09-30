from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.models import Inspections, Remark as RemarkModel
from app.schemas.remark import Remark, RemarkCreate, RemarkUpdate, InspectionWithRemarks
from .. import models
from ..models import Users
from ..dependencies import require_auth_token, get_db
router = APIRouter(prefix="/remarks", tags=["Remarks"])


# Get all remarks
# Get all remarks (only active)
@router.get("/", response_model=list[Remark])
def get_remarks(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return db.query(models.Remark).filter(models.Remark.Is_Active == 1).all()



@router.get("/{remark_id}", response_model=Remark)
def get_remark(remark_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    remark = db.query(models.Remark).filter(
        models.Remark.Id_Remark == remark_id,
        models.Remark.Is_Active == 1
    ).first()
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    return remark


# Create remark
@router.post("/", response_model=Remark)
def create_remark(remark: RemarkCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    new_remark = models.Remark(**remark.model_dump())
    db.add(new_remark)
    db.commit()
    db.refresh(new_remark)
    return new_remark


# Update remark
@router.put("/{remark_id}", response_model=Remark)
def update_remark(remark_id: int, remark: RemarkUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
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
def delete_remark(remark_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    db_remark = db.query(models.Remark).filter(models.Remark.Id_Remark == remark_id).first()
    if not db_remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    db_remark.Is_Active = 0  # Soft delete
    db.commit()
    return {"detail": "Remark soft deleted"}

@router.get("/by-inspection/{inspection_id}", response_model=InspectionWithRemarks)
def get_inspection_with_remarks(inspection_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    inspection = db.query(models.Inspections).filter(
        models.Inspections.Id_Inspections == inspection_id
    ).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # Fetch related remarks
    remarks = db.query(RemarkModel).filter(
        RemarkModel.InspectionsId == inspection_id,
        RemarkModel.Is_Active == 1
    ).all()

    # Attach remarks as sub-object
    return {
        "Id_Inspections": inspection.Id_Inspections,
        "Status": inspection.Status,
        "Remarks": inspection.Remarks,
        "remarks": remarks
    }