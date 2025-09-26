from pydantic import BaseModel
from typing import Optional


class RemarkBase(BaseModel):
    Manager_Id: int
    Question_Id: int
    Evidence_Id: int
    inspection_answer_Id: int
    Remarks: Optional[str] = None
    Condition: Optional[str] = None


class RemarkCreate(RemarkBase):
    pass


class RemarkUpdate(BaseModel):
    Manager_Id: Optional[int] = None
    Question_Id: Optional[int] = None
    Evidence_Id: Optional[int] = None
    inspection_answer_Id: Optional[int] = None
    Remarks: Optional[str] = None
    Condition: Optional[str] = None


class Remark(RemarkBase):
    Id_Remark: int

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2
