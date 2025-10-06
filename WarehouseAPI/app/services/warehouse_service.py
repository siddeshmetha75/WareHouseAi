from sqlalchemy.orm import Session
from typing import List, Optional

from ..models import Warehouses as Warehouse
from ..schemas.warehouse import WarehouseCreate, WarehouseUpdate


def create_warehouse(db: Session, payload: WarehouseCreate) -> Warehouse:
    entity = Warehouse(
        Warehouse_Name=payload.Warehouse_Name,
        Location=payload.Location,
        Code=payload.Code,
        Capacity=payload.Capacity,
        Latitude=payload.Latitude,
        Longitude=payload.Longitude,
        # Inventory is intentionally excluded as per requirements
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def list_warehouses(db: Session) -> List[Warehouse]:
    return db.query(Warehouse).all()


def get_warehouse(db: Session, warehouse_id: int) -> Optional[Warehouse]:
    return db.query(Warehouse).filter(Warehouse.Id_Warehouse == warehouse_id).first()


def update_warehouse(db: Session, warehouse_id: int, payload: WarehouseUpdate) -> Optional[Warehouse]:
    entity = get_warehouse(db, warehouse_id)
    if entity is None:
        return None
    
    # Update only the fields that are provided in the payload
    if payload.Warehouse_Name is not None:
        entity.Warehouse_Name = payload.Warehouse_Name
    if payload.Location is not None:
        entity.Location = payload.Location
    if payload.Code is not None:
        entity.Code = payload.Code
    if payload.Capacity is not None:
        entity.Capacity = payload.Capacity
    if payload.Latitude is not None:
        entity.Latitude = payload.Latitude
    if payload.Longitude is not None:
        entity.Longitude = payload.Longitude
    
    db.commit()
    db.refresh(entity)
    return entity


def delete_warehouse(db: Session, warehouse_id: int) -> bool:
    entity = get_warehouse(db, warehouse_id)
    if entity is None:
        return False
    db.delete(entity)
    db.commit()
    return True


