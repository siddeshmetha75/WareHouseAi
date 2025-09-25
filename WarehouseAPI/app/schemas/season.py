from pydantic import BaseModel
from typing import Optional


class SeasonBase(BaseModel):
    Season_Name: str


class SeasonCreate(SeasonBase):
    pass


class SeasonUpdate(BaseModel):
    Season_Name: Optional[str] = None


class SeasonResponse(SeasonBase):
    IdSeason: int

    class Config:
        orm_mode = True
