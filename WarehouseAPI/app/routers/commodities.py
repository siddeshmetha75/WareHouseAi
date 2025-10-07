from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import SessionLocal
from ..models import Commoditymaster as Commodity, Users
from ..schemas.commodity import CommodityCreate, CommodityUpdate, CommodityResponse
from ..dependencies import require_auth_token, get_db


router = APIRouter(prefix="/commodities", tags=["Commodities"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


@router.post("", response_model=CommodityResponse, status_code=status.HTTP_201_CREATED)
def create(payload: CommodityCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = Commodity(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity

@router.get("", response_model=List[CommodityResponse])
def list_all(
    name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    storage: Optional[str] = Query(None),
    active: Optional[int] = Query(None),
    db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)
):
    q = db.query(Commodity)
    if name:
        q = q.filter(Commodity.Commodity_Name.ilike(f"%{name}%"))
    if category:
        q = q.filter(Commodity.Category == category)
    if storage:
        q = q.filter(Commodity.CommodityStorage == storage)
    if active is not None:
        q = q.filter(Commodity.IsActive == active)
    return q.all()


@router.get("/{commodity_id}", response_model=CommodityResponse)
def get_by_id(commodity_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Commodity).filter(Commodity.IdCommodity == commodity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    return entity


@router.put("/{commodity_id}", response_model=CommodityResponse)
def update(commodity_id: int, payload: CommodityUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Commodity).filter(Commodity.IdCommodity == commodity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(entity, k, v)
    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/{commodity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(commodity_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Commodity).filter(Commodity.IdCommodity == commodity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    db.delete(entity)
    db.commit()
    return None


