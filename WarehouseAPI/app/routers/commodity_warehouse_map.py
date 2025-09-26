from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app import models
from app.schemas.commodity_warehouse_map import (
    CommodityWarehouseMap,
    CommodityWarehouseMapCreate,
    CommodityWarehouseMapUpdate,
    CommodityWarehouseMapResponse
)
from app.dependencies import get_db

router = APIRouter(prefix="/commodity-warehouse-map", tags=["CommodityWarehouseMap"])


@router.get("/", response_model=List[CommodityWarehouseMap])
def get_all_mappings(db: Session = Depends(get_db)):
    return db.query(models.CommodityWarehouseMap).filter(models.CommodityWarehouseMap.Is_Active == 1).all()



# Get mapping by id
@router.get("/{mapping_id}", response_model=CommodityWarehouseMap)
def get_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = db.query(models.CommodityWarehouseMap).filter(
        models.CommodityWarehouseMap.Id_CommodityWarehouseMap == mapping_id,
        models.CommodityWarehouseMap.Is_Active == 1
    ).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return mapping


# Create mapping
@router.post("/", response_model=CommodityWarehouseMap)
def create_mapping(mapping: CommodityWarehouseMapCreate, db: Session = Depends(get_db)):
    new_mapping = models.CommodityWarehouseMap(**mapping.model_dump())
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)
    return new_mapping


# Update mapping
@router.put("/{mapping_id}", response_model=CommodityWarehouseMap)
def update_mapping(mapping_id: int, mapping: CommodityWarehouseMapUpdate, db: Session = Depends(get_db)):
    db_mapping = db.query(models.CommodityWarehouseMap).filter(
        models.CommodityWarehouseMap.Id_CommodityWarehouseMap == mapping_id
    ).first()
    if not db_mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    for key, value in mapping.model_dump(exclude_unset=True).items():
        setattr(db_mapping, key, value)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping


# Soft Delete mapping
@router.delete("/{mapping_id}")
def delete_mapping(mapping_id: int, db: Session = Depends(get_db)):
    db_mapping = db.query(models.CommodityWarehouseMap).filter(
        models.CommodityWarehouseMap.Id_CommodityWarehouseMap == mapping_id
    ).first()
    if not db_mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    db_mapping.Is_Active = 0  # Soft delete
    db.commit()
    return {"detail": "Mapping soft deleted"}

@router.get("/filter/by-warehouse-inspector", response_model=List[CommodityWarehouseMapResponse])
def get_mappings_by_warehouse_and_inspector(
    warehouseId: int = Query(..., description="Warehouse Id"),
    inspectorId: int = Query(..., description="Inspector Id"),
    db: Session = Depends(get_db)
):
    mappings = (
        db.query(
            models.CommodityWarehouseMap.Id_CommodityWarehouseMap,
            models.CommodityWarehouseMap.WarehouseId,
            models.CommodityWarehouseMap.ManagerId,
            models.CommodityWarehouseMap.InspectorId,
            models.CommodityWarehouseMap.CommodityId,
            models.CommodityWarehouseMap.SeasonId,
            models.CommodityWarehouseMap.Is_Active,
            models.Commoditymaster.Commodity_Name.label("CommodityName"),
            models.Seasons.Season_Name.label("SeasonName"),
        )
        .join(models.Commoditymaster, models.CommodityWarehouseMap.CommodityId == models.Commoditymaster.IdCommodity)
        .join(models.Seasons, models.CommodityWarehouseMap.SeasonId == models.Seasons.IdSeason)
        .filter(
            models.CommodityWarehouseMap.WarehouseId == warehouseId,
            models.CommodityWarehouseMap.InspectorId == inspectorId,
            models.CommodityWarehouseMap.Is_Active == 1
        )
        .all()
    )

    if not mappings:
        raise HTTPException(status_code=404, detail="No mappings found")

    return mappings

