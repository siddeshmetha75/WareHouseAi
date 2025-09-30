from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import SessionLocal
from ..schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse
from ..services import warehouse_service
from .. import models
from ..models import Users
from ..dependencies import require_auth_token, get_db


router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
@router.get("/", response_model=List[WarehouseResponse])
def list_all(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return warehouse_service.list_warehouses(db)

@router.post("/", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create(payload: WarehouseCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return warehouse_service.create_warehouse(db, payload)





# @router.get("/{warehouse_id}", response_model=WarehouseResponse)
# def get_by_id(warehouse_id: int, db: Session = Depends(get_db)):
#     entity = warehouse_service.get_warehouse(db, warehouse_id)
#     if entity is None:
#         raise HTTPException(status_code=404, detail="Warehouse not found")
#     return entity


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update(warehouse_id: int, payload: WarehouseUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = warehouse_service.update_warehouse(db, warehouse_id, payload)
    if entity is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return entity


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(warehouse_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    ok = warehouse_service.delete_warehouse(db, warehouse_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return None

@router.get("/by-manager/{manager_id}", response_model=List[WarehouseResponse])
def get_warehouses_by_manager(manager_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    # Get all warehouse mappings for this manager
    warehouse_maps = db.query(models.UserWarehouseMap).filter(
        models.UserWarehouseMap.Manager_id == manager_id
    ).all()

    if not warehouse_maps:
        raise HTTPException(status_code=404, detail="No warehouses found for this manager")

    # Extract all warehouse IDs
    warehouse_ids = [wm.Warehouse_id for wm in warehouse_maps]

    # Fetch warehouse details
    warehouses = db.query(models.Warehouses).filter(
        models.Warehouses.Id_Warehouse.in_(warehouse_ids)
    ).all()

    return warehouses