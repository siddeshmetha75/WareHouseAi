from pydantic import BaseModel
from typing import Optional


class CommodityWarehouseMapBase(BaseModel):
    WarehouseId: int
    ManagerId: int
    InspectorId: int
    CommodityId: int
    SeasonId: int
    Is_Active: Optional[int] = 1


class CommodityWarehouseMapCreate(CommodityWarehouseMapBase):
    pass


class CommodityWarehouseMapUpdate(BaseModel):
    WarehouseId: Optional[int] = None
    ManagerId: Optional[int] = None
    InspectorId: Optional[int] = None
    CommodityId: Optional[int] = None
    SeasonId: Optional[int] = None
    Is_Active: Optional[int] = None


class CommodityWarehouseMap(CommodityWarehouseMapBase):
    Id_CommodityWarehouseMap: int

    class Config:
        from_attributes = True  # Pydantic v2
