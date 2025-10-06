from pydantic import BaseModel, Field
from typing import Optional


class QuestionReads(BaseModel):
    id: int
    # Map SQLAlchemy attribute 'text_' -> JSON field 'text'
    text: str = Field(validation_alias='text_', serialization_alias='text')
    category: str | None = None
    risk_weight: float | None = None

    class Config:
        from_attributes = True
        populate_by_name = True


class QuestionBase(BaseModel):
    text: str = Field(..., max_length=500)
    category: Optional[str] = None
    risk_weight: Optional[float] = 1.0


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    text: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    risk_weight: Optional[float] = None


class QuestionRead(QuestionBase):
    id: int

    # Map SQLAlchemy attribute `text_` -> JSON field `text`
    text: str = Field(validation_alias='text_', serialization_alias='text')

    class Config:
        from_attributes = True
        populate_by_name = True