from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class InspectionBase(BaseModel):
    Id_Inspections: int
    Status: Optional[str]
    Created_At: Optional[datetime]
    Completed_At: Optional[datetime]
    Risk_Score: Optional[float]

    class Config:
        orm_mode = True


class WarehouseBase(BaseModel):
    Id_Warehouse: int
    Warehouse_Name: Optional[str]
    Location: Optional[str]
    Capacity: Optional[int]
    Latitude: Optional[float]
    Longitude: Optional[float]
    Inventory: Optional[str]
    inspections: List[InspectionBase] = []

    class Config:
        orm_mode = True


class InspectorBase(BaseModel):
    idusers: int
    UserName: Optional[str]
    Full_Name: Optional[str]
    EmailId: Optional[str]
    warehouses: List[WarehouseBase] = []
    inspections: List[InspectionBase] = []

    class Config:
        orm_mode = True


class ManagerBase(BaseModel):
    idusers: int
    UserName: Optional[str]
    Full_Name: Optional[str]
    EmailId: Optional[str]
    inspectors: List[InspectorBase] = []
    warehouses: List[WarehouseBase] = []
    inspections: List[InspectionBase] = []

    class Config:
        orm_mode = True


class AdminHierarchy(BaseModel):
    idusers: int
    UserName: Optional[str]
    Full_Name: Optional[str]
    EmailId: Optional[str]
    managers: List[ManagerBase] = []

    class Config:
        orm_mode = True
