# from typing import List, Optional
# from pydantic import BaseModel


# class UserSchema(BaseModel):
#     id: int
#     name: Optional[str]
#     email: Optional[str]
#     role: str

#     class Config:
#         orm_mode = True


# class ManagerSchema(UserSchema):
#     inspectors: List[UserSchema] = []


# class HierarchyResponse(BaseModel):
#     role: str
#     managers: List[ManagerSchema] = []

# class WarehouseSchema(BaseModel):
#     id: int
#     name: Optional[str]
#     location: Optional[str]
#     code: Optional[str]
#     capacity: Optional[int]
#     latitude: Optional[float]
#     longitude: Optional[float]
#     inventory: Optional[str]

#     class Config:
#         orm_mode = True