from pydantic import BaseModel
from typing import Optional


class RemarkBase(BaseModel):
    
    Question_Id: int
    
    
    Remarks: Optional[str] = None
    Status: Optional[str] = None


class RemarkCreate(RemarkBase):
    pass


class RemarkUpdate(BaseModel):
    Question_Id: Optional[int] = None
    Remarks: Optional[str] = None
    Status: Optional[str] = None


class Remark(RemarkBase):
    Id_Remark: int

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2
