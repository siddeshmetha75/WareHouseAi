from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..models import Users
from ..dependencies import require_auth_token, get_db

from ..database import SessionLocal
from ..models import UserWarehouseMap as UWModel, Users as UserModel, Warehouses as WarehouseModel
from ..schemas.user_warehouse import (
    UserWarehouseMapCreate,
    UserWarehouseMapUpdate,
    UserWarehouseMapResponse,
)

router = APIRouter(prefix="/user-warehouse", tags=["UserWarehouse"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


def _to_response(db: Session, record: UWModel) -> UserWarehouseMapResponse:
    #user = db.query(UserModel).filter(UserModel.idusers == record.User_id).first()
    mgr = db.query(UserModel).filter(UserModel.idusers == record.Manager_id).first()
    wh = db.query(WarehouseModel).filter(WarehouseModel.Id_Warehouse == record.Warehouse_id).first()
    return UserWarehouseMapResponse(
        Id_User_Warehouse_Map=record.Id_User_Warehouse_Map,
        #User_id=record.User_id,
        Warehouse_id=record.Warehouse_id,
        Manager_id=record.Manager_id,
        #UserName=user.UserName if user else None,
        #UserFullName=user.Full_Name if user else None,
        ManagerName=mgr.UserName if mgr else None,
        ManagerFullName=mgr.Full_Name if mgr else None,
        WarehouseName=wh.Warehouse_Name if wh else None,
    )


@router.get("/", response_model=List[UserWarehouseMapResponse])
def list_maps(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    records = db.query(UWModel).all()
    return [_to_response(db, r) for r in records]


@router.get("/{map_id}", response_model=UserWarehouseMapResponse)
def get_map(map_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    record = db.query(UWModel).filter(UWModel.Id_User_Warehouse_Map == map_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return _to_response(db, record)


@router.post("/", response_model=UserWarehouseMapResponse, status_code=status.HTTP_201_CREATED)
def create_map(payload: UserWarehouseMapCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    record = UWModel(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_response(db, record)


@router.put("/{map_id}", response_model=UserWarehouseMapResponse)
def update_map(map_id: int, payload: UserWarehouseMapUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    record = db.query(UWModel).filter(UWModel.Id_User_Warehouse_Map == map_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Mapping not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return _to_response(db, record)


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map(map_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    record = db.query(UWModel).filter(UWModel.Id_User_Warehouse_Map == map_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Mapping not found")
    db.delete(record)
    db.commit()
    return None
