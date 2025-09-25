from pydantic import BaseModel
from typing import Optional
import datetime


class CropYearBase(BaseModel):
    Season_Id: int
    Commodity_Id: int
    CropYearName: Optional[str] = None


class CropYearCreate(CropYearBase):
    pass


class CropYearUpdate(BaseModel):
    Season_Id: Optional[int] = None
    Commodity_Id: Optional[int] = None
    CropYearName: Optional[str] = None
    Is_Active: Optional[int] = None


class CropYearResponse(CropYearBase):
    IdCrop_year: int
    Created_At: Optional[datetime.datetime] = None
    Is_Active: Optional[int] = None

    class Config:
        orm_mode = True
