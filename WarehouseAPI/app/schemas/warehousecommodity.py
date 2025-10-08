from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


# ✅ Base schema (shared attributes)
class WarehouseCommodityBase(BaseModel):
    CommodityMasterId: int
    SeasonId: int
    WarehouseId: int
    Manager_Id: int  # <-- Added this


# ✅ Schema for Create
class WarehouseCommodityCreate(WarehouseCommodityBase):
    pass


# ✅ Schema for Update
class WarehouseCommodityUpdate(BaseModel):
    CommodityMasterId: Optional[int] = None
    SeasonId: Optional[int] = None
    WarehouseId: Optional[int] = None
    Manager_Id: Optional[int] = None  # <-- Added this
    Is_Active: Optional[int] = 1


# ✅ Schema for Response
class WarehouseCommodityResponse(WarehouseCommodityBase):
    Idwarehouse_commodity: int
    Insert_Date: Optional[datetime]
    Is_Active: int
    WarehouseName: Optional[str] = None
    CommodityName: Optional[str] = None
    SeasonName: Optional[str] = None
    ManagerName: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
