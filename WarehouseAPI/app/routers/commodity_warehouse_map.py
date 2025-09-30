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


def _upsert_user_warehouse_map(db: Session, *, inspector_id: int, manager_id: int, warehouse_id: int) -> None:
    """Ensure a corresponding user_warehouse_map row exists and is up-to-date.
    Strategy:
    - Try to find an existing row for (User_id, Warehouse_id). If found, update Manager_id.
    - Else create a new row with given triplet.
    """
    uw = (
        db.query(models.UserWarehouseMap)
        .filter(
            models.UserWarehouseMap.User_id == inspector_id,
            models.UserWarehouseMap.Warehouse_id == warehouse_id,
        )
        .first()
    )
    if uw:
        # Update manager if changed
        if uw.Manager_id != manager_id:
            uw.Manager_id = manager_id
            db.add(uw)
            db.commit()
            db.refresh(uw)
    else:
        # Create new link
        new_uw = models.UserWarehouseMap(
            User_id=inspector_id,
            Warehouse_id=warehouse_id,
            Manager_id=manager_id,
        )
        db.add(new_uw)
        db.commit()
        db.refresh(new_uw)


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
    # Duplicate check for active mapping with same tuple
    exists = (
        db.query(models.CommodityWarehouseMap)
        .filter(
            models.CommodityWarehouseMap.WarehouseId == mapping.WarehouseId,
            models.CommodityWarehouseMap.ManagerId == mapping.ManagerId,
            models.CommodityWarehouseMap.InspectorId == mapping.InspectorId,
            models.CommodityWarehouseMap.CommodityId == mapping.CommodityId,
            models.CommodityWarehouseMap.SeasonId == mapping.SeasonId,
            models.CommodityWarehouseMap.Is_Active == 1,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Mapping already exists")

    new_mapping = models.CommodityWarehouseMap(**mapping.model_dump())
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)

    # Sync user_warehouse_map for Inspector ↔ Warehouse under Manager
    try:
        _upsert_user_warehouse_map(
            db,
            inspector_id=new_mapping.InspectorId,
            manager_id=new_mapping.ManagerId,
            warehouse_id=new_mapping.WarehouseId,
        )
    except Exception:
        # Do not fail the main operation; mapping created successfully
        pass

    return new_mapping


# Update mapping
@router.put("/{mapping_id}", response_model=CommodityWarehouseMap)
def update_mapping(mapping_id: int, mapping: CommodityWarehouseMapUpdate, db: Session = Depends(get_db)):
    db_mapping = db.query(models.CommodityWarehouseMap).filter(
        models.CommodityWarehouseMap.Id_CommodityWarehouseMap == mapping_id
    ).first()
    if not db_mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    # Build prospective values for duplicate detection
    prospective = {
        "WarehouseId": mapping.WarehouseId if mapping.WarehouseId is not None else db_mapping.WarehouseId,
        "ManagerId": mapping.ManagerId if mapping.ManagerId is not None else db_mapping.ManagerId,
        "InspectorId": mapping.InspectorId if mapping.InspectorId is not None else db_mapping.InspectorId,
        "CommodityId": mapping.CommodityId if mapping.CommodityId is not None else db_mapping.CommodityId,
        "SeasonId": mapping.SeasonId if mapping.SeasonId is not None else db_mapping.SeasonId,
    }

    # Duplicate check ignoring current record
    dup = (
        db.query(models.CommodityWarehouseMap)
        .filter(
            models.CommodityWarehouseMap.WarehouseId == prospective["WarehouseId"],
            models.CommodityWarehouseMap.ManagerId == prospective["ManagerId"],
            models.CommodityWarehouseMap.InspectorId == prospective["InspectorId"],
            models.CommodityWarehouseMap.CommodityId == prospective["CommodityId"],
            models.CommodityWarehouseMap.SeasonId == prospective["SeasonId"],
            models.CommodityWarehouseMap.Is_Active == 1,
            models.CommodityWarehouseMap.Id_CommodityWarehouseMap != mapping_id,
        )
        .first()
    )
    if dup:
        raise HTTPException(status_code=409, detail="Mapping already exists")

    # Apply updates
    for key, value in mapping.model_dump(exclude_unset=True).items():
        setattr(db_mapping, key, value)
    db.commit()
    db.refresh(db_mapping)

    # Sync user_warehouse_map after update
    try:
        _upsert_user_warehouse_map(
            db,
            inspector_id=db_mapping.InspectorId,
            manager_id=db_mapping.ManagerId,
            warehouse_id=db_mapping.WarehouseId,
        )
    except Exception:
        # Keep main update successful even if sync fails
        pass

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

    # After soft delete, if no other active mappings exist for this Inspector-Warehouse-Manager,
    # remove the corresponding user_warehouse_map link as well.
    try:
        remaining = (
            db.query(models.CommodityWarehouseMap)
            .filter(
                models.CommodityWarehouseMap.WarehouseId == db_mapping.WarehouseId,
                models.CommodityWarehouseMap.InspectorId == db_mapping.InspectorId,
                models.CommodityWarehouseMap.ManagerId == db_mapping.ManagerId,
                models.CommodityWarehouseMap.Is_Active == 1,
            )
            .count()
        )

        if remaining == 0:
            links = (
                db.query(models.UserWarehouseMap)
                .filter(
                    models.UserWarehouseMap.Warehouse_id == db_mapping.WarehouseId,
                    models.UserWarehouseMap.User_id == db_mapping.InspectorId,
                    models.UserWarehouseMap.Manager_id == db_mapping.ManagerId,
                )
                .all()
            )
            for link in links:
                db.delete(link)
            if links:
                db.commit()
    except Exception:
        # Keep delete successful even if sync cleanup fails
        pass

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

