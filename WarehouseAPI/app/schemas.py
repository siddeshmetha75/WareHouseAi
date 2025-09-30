from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: Optional[str]
    role: str
    email: Optional[str]

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: int
    active: bool
    class Config:
        orm_mode = True

class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str]
    code: Optional[str]

class WarehouseRead(WarehouseCreate):
    id: int
    class Config:
        orm_mode = True

class InspectionCreate(BaseModel):
    warehouse_id: int
    inspector_id: int
    data: dict
    manager_id: Optional[int]

class InspectionRead(BaseModel):
    id: int
    warehouse_id: int
    inspector_id: int
    manager_id: Optional[int]
    created_at: datetime
    status: str
    data: dict
    remarks: Optional[str]
    class Config:
        orm_mode = True

class MapCreate(BaseModel):
    user_id: int
    warehouse_id: int
    manager_id: Optional[int]

class MapRead(MapCreate):
    id: int
    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    EmailId: str
    Password: str
    custom_token: str

class LoginResponse(BaseModel):
    id: int
    UserName: str
    Role: str
    EmailId: str
    message: str
    class Config:
        orm_mode = True

class InspectionCounts(BaseModel):
    TotalInspections: int
    Pending: int
    Completed: int
    InProgress: int

class CountResponse(BaseModel):
    count: int

class AverageResponse(BaseModel):
    average: float

class WarehouseCard(BaseModel):
    id: int
    name: str
    location: str

class Commodity(BaseModel):
    IdCommodity: int
    Commodity_Name: str
    CommodityStorage: str

    class Config:
        orm_mode = True

        