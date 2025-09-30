from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models import Seasons
from app.schemas.season import Season, SeasonCreate, SeasonUpdate
from .. import models
from ..models import Users
from ..dependencies import require_auth_token, get_db

router = APIRouter(prefix="/seasons", tags=["Seasons"])


# Get all seasons
@router.get("", response_model=List[Season])
def list_all(name: Optional[str] = Query(None), db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    q = db.query(Seasons)
    if name:
        q = q.filter(Seasons.Season_Name.ilike(f"%{name}%"))
    return q.all()


# Get season by ID
@router.get("/{season_id}", response_model=Season)
def get_by_id(season_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Seasons).filter(Seasons.IdSeason == season_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Season not found")
    return entity


# Create season
@router.post("", response_model=Season)
def create(payload: SeasonCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = Seasons(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


# Update season
@router.put("/{season_id}", response_model=Season)
def update(season_id: int, payload: SeasonUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Seasons).filter(Seasons.IdSeason == season_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Season not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(entity, key, value)
    db.commit()
    db.refresh(entity)
    return entity


# Delete season
@router.delete("/{season_id}")
def delete(season_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Seasons).filter(Seasons.IdSeason == season_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Season not found")
    db.delete(entity)
    db.commit()
    return {"detail": "Season deleted"}
