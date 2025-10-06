from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from datetime import date

class InspectionBase(BaseModel):
    Warehouse_Id: int
    Manager_Id: int
    Data: Optional[str] = None
    Status: str
    Remarks: Optional[str] = None
    Season_Id : int

class InspectionCreate(InspectionBase):
    pass

class InspectionUpdate(BaseModel):
    Warehouse_Id: Optional[int] = None
    Manager_Id: Optional[int] = None
    Inspector_Id: Optional[int] = None
    Commodity_Id: Optional[int] = None
    Season_Id: Optional[int] = None
    Data: Optional[str] = None
    Status: Optional[str] = None
    Remarks: Optional[str] = None
    Risk_Score: Optional[float] = None
    Completed_At: Optional[datetime] = None
    Manager_Approved: Optional[bool] = None
    Manager_Approved_At: Optional[datetime] = None
    Manager_Remarks: Optional[str] = None


# ...existing code...

class InspectionResponse(InspectionBase):
    Id_Inspections: int
    Created_At: datetime
    Season_Id: int
    SeasonName: Optional[str] = None  # <-- Add this

class InspectionDetailsResponse(BaseModel):
    Id_Inspections: int
    Warehouse_Id: int
    Warehouse_Name: str
    Inspector_Id: int
    Inspector_Name: str
    Inspector_Role: str
    Manager_Id: int
    Manager_Name: str
    Manager_Role: str
    Created_At: datetime
    Data: str
    Status: str
    Remarks: Optional[str] = None
    Season_Id: int
    SeasonName: Optional[str] = None  # <-- Add this

    class Config:
        from_attributes = True

# ...existing code...


class InspectionCreateRequest(BaseModel):
    Warehouse_Id: int
    Manager_Id: int
    Commodity_Id: Optional[int] = None
    Remarks: Optional[str] = None
    Season_Id : int


class InspectionCreateResponse(BaseModel):
    inspection_id: int


class InspectionAnswerCreate(BaseModel):
    question_id: int
    answer: Optional[str] = None
    remarks: Optional[str] = None


class AnswerItem(BaseModel):
    question_id: int
    answer: Optional[str] = None
    remarks: Optional[str] = None


class InspectionWithAnswersCreate(BaseModel):
    warehouse_id: int
    commodity_id: int
    inspector_id: int
    Season_Id: int
    answers: list[InspectionAnswerCreate]

    class Config:
        extra = 'ignore'


class InspectionCreateWithAnswersResponse(BaseModel):
    inspection_id: int
    saved_answers: int

class QuestionResponse(BaseModel):
    id: int
    text: str
    category: Optional[str] = None
    risk_weight: Optional[float] = None

    class Config:
        from_attributes = True


class ApproveRequest(BaseModel):
    approved: bool
    remarks: Optional[str] = None

class InspectionUpdateRequest(BaseModel):
    Status: Optional[str]
    Remarks: Optional[str]
    Risk_Score: Optional[float]
    Manager_Approved: Optional[int]
    Manager_Remarks: Optional[str]
    Completed_At: Optional[datetime]
    answers: Optional[list["InspectionAnswerCreate"]]

class InspectionSummaryRequest(BaseModel):
    FromDate: Optional[date] = None
    ToDate: Optional[date] = None

class InspectionSummaryResponse(BaseModel):
    total_inspection_count: int
    in_progress: int
    pending: int
    rejected: int
    completed: int
    created_at_count: int

class InspectionGraphItem(BaseModel):
    Id_Inspections: Optional[int]
    Warehouse_Id: Optional[int]
    WarehouseName: Optional[str]
    Inspector_Id: Optional[int]
    InspectorName: Optional[str]
    Manager_Id: Optional[int]
    ManagerName: Optional[str]
    Created_At: Optional[datetime]
    Data: Optional[str]
    Status: Optional[str]
    Remarks: Optional[str]
    Commodity_Id: Optional[int]
    CommodityName: Optional[str]
    Risk_Score: Optional[float]
    Completed_At: Optional[datetime]
    Manager_Approved: Optional[int]
    Manager_Approved_At: Optional[datetime]
    Manager_Remarks: Optional[str]
    Season_Id: Optional[int]
    SeasonName: Optional[str]

class InspectionGraphCategory(BaseModel):
    Count: Optional[int]
    Inspections: List[InspectionGraphItem]

class InspectionGraphResponse(BaseModel):
    TotalInspectionCount: Optional[int]
    InProgress: InspectionGraphCategory
    Pending: InspectionGraphCategory
    Completed: InspectionGraphCategory
    Rejected: InspectionGraphCategory