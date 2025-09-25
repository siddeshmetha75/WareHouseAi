from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import SessionLocal
from ..models import Seasons as SeasonsModel
from ..schemas.season import SeasonCreate, SeasonUpdate, SeasonResponse

router = APIRouter(prefix="/seasons", tags=["Seasons"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[SeasonResponse])
def list_seasons(db: Session = Depends(get_db)):
    items = db.query(SeasonsModel).all()
    return items


@router.get("/{season_id}", response_model=SeasonResponse)
def get_season(season_id: int, db: Session = Depends(get_db)):
    item = db.query(SeasonsModel).filter(SeasonsModel.IdSeason == season_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Season not found")
    return item


@router.post("/", response_model=SeasonResponse, status_code=status.HTTP_201_CREATED)
def create_season(payload: SeasonCreate, db: Session = Depends(get_db)):
    entity = SeasonsModel(**payload.dict())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.put("/{season_id}", response_model=SeasonResponse)
def update_season(season_id: int, payload: SeasonUpdate, db: Session = Depends(get_db)):
    entity = db.query(SeasonsModel).filter(SeasonsModel.IdSeason == season_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Season not found")

    for var, value in payload.dict(exclude_unset=True).items():
        setattr(entity, var, value)

    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/{season_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_season(season_id: int, db: Session = Depends(get_db)):
    entity = db.query(SeasonsModel).filter(SeasonsModel.IdSeason == season_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Season not found")

    # Hard delete (Seasons model has no Is_Active column)
    db.delete(entity)
    db.commit()
    return None
