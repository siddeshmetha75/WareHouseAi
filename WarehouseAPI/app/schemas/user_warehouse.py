from pydantic import BaseModel, Field
from typing import Optional

class UserWarehouseMapBase(BaseModel):
    User_id: int
    Warehouse_id: int
    Manager_id: int

class UserWarehouseMapCreate(UserWarehouseMapBase):
    pass

class UserWarehouseMapUpdate(BaseModel):
    User_id: Optional[int] = None
    Warehouse_id: Optional[int] = None
    Manager_id: Optional[int] = None

class UserWarehouseMapResponse(UserWarehouseMapBase):
    Id_User_Warehouse_Map: int
    # denormalized display fields
    UserName: Optional[str] = None
    UserFullName: Optional[str] = None
    ManagerName: Optional[str] = None
    ManagerFullName: Optional[str] = None
    WarehouseName: Optional[str] = None

    class Config:
        from_attributes = True
