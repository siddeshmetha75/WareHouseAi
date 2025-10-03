from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class InspectionSchema(BaseModel):
    Created_At: Optional[datetime]
    Data: Optional[str]
    Status: Optional[str]
    Remarks: Optional[str]
    Commodity_Id: Optional[int]
    Commodity_Name: Optional[str]    # <- new
    Risk_Score: Optional[float]
    Completed_At: Optional[datetime]
    Manager_Approved: Optional[int]
    Manager_Approved_At: Optional[datetime]
    Manager_Remarks: Optional[str]
    Season_Id: Optional[int]
    SeasonName: Optional[str]        # <- new


class TotalInspectionsSchema(BaseModel):
    Inspections_Count: int
    Inspections: List[InspectionSchema]
    Pending: int
    Completed: int
    In_Progress: int
    Rejected: int

class WarehouseSchema(BaseModel):
    Warehouse_Name: Optional[str]
    Location: Optional[str]
    Code: Optional[str]
    Capacity: Optional[int]
    Latitude: Optional[float]
    Longitude: Optional[float]
    Inventory: Optional[str]

class WarehousesSchema(BaseModel):
    Warehouses_Count: int
    Warehouse_List: List[WarehouseSchema]

class InspectorSchema(BaseModel):
    Inspector_Name: Optional[str]

class InspectorsSchema(BaseModel):
    Inspectors_Count: int
    Inspector_List: List[InspectorSchema]

class ManagerDashboardResponse(BaseModel):
    Total_Inspections: TotalInspectionsSchema
    Warehouses: WarehousesSchema
    Inspectors: InspectorsSchema
