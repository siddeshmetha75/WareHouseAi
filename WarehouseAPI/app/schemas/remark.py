# app/schemas/remark.py

from pydantic import BaseModel
from typing import Optional, List


class RemarkBase(BaseModel):
    Question_Id: int
    Remarks: Optional[str] = None
    Status: Optional[str] = None


class RemarkCreate(RemarkBase):
    InspectionsId: int   # ✅ Required when creating a remark


class RemarkUpdate(BaseModel):
    Question_Id: Optional[int] = None
    Remarks: Optional[str] = None
    Status: Optional[str] = None


class Remark(RemarkBase):
    Id_Remark: int
    InspectionsId: int   # ✅ So it shows which inspection this remark belongs to

    class Config:
        from_attributes = True


# ---------- NEW ----------
class InspectionWithRemarks(BaseModel):
    Id_Inspections: int
    Status: Optional[str] = None
    Remarks: Optional[str] = None

    # Sub-object: list of remarks for this inspection
    remarks: List[Remark] = []

    class Config:
        from_attributes = True
