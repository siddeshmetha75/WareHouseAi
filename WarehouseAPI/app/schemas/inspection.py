from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InspectionBase(BaseModel):
    Warehouse_Id: int
    Manager_Id: int
    Data: str
    Status: str
    Remarks: Optional[str] = None
    Season_Id : int

class InspectionCreate(InspectionBase):
    pass

class InspectionUpdate(BaseModel):
    Data: Optional[str] = None
    Status: Optional[str] = None
    Remarks: Optional[str] = None

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