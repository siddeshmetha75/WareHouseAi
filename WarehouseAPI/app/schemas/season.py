from pydantic import BaseModel

# Shared schema
class SeasonBase(BaseModel):
    Season_Name: str

# Create schema
class SeasonCreate(SeasonBase):
    pass

# Update schema
class SeasonUpdate(SeasonBase):
    pass

# Response schema
class Season(SeasonBase):
    IdSeason: int

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2
