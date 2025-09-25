from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import SessionLocal
from ..models import CropYear as CropYearModel
from ..schemas.crop_year import CropYearCreate, CropYearUpdate, CropYearResponse

router = APIRouter(prefix="/crop_year", tags=["CropYear"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[CropYearResponse])
def list_crop_years(db: Session = Depends(get_db)):
    items = db.query(CropYearModel).filter(CropYearModel.Is_Active == 1).all()
    return items


@router.get("/{crop_year_id}", response_model=CropYearResponse)
def get_crop_year(crop_year_id: int, db: Session = Depends(get_db)):
    item = db.query(CropYearModel).filter(
        CropYearModel.IdCrop_year == crop_year_id,
        CropYearModel.Is_Active == 1
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="CropYear not found")
    return item


@router.post("/", response_model=CropYearResponse, status_code=status.HTTP_201_CREATED)
def create_crop_year(payload: CropYearCreate, db: Session = Depends(get_db)):
    entity = CropYearModel(**payload.dict())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.put("/{crop_year_id}", response_model=CropYearResponse)
def update_crop_year(crop_year_id: int, payload: CropYearUpdate, db: Session = Depends(get_db)):
    entity = db.query(CropYearModel).filter(CropYearModel.IdCrop_year == crop_year_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="CropYear not found")

    for var, value in payload.dict(exclude_unset=True).items():
        setattr(entity, var, value)

    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/{crop_year_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_crop_year(crop_year_id: int, db: Session = Depends(get_db)):
    entity = db.query(CropYearModel).filter(CropYearModel.IdCrop_year == crop_year_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="CropYear not found")

    # Soft delete by setting Is_Active to 0
    entity.Is_Active = 0
    db.add(entity)
    db.commit()
    return None
