from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import SessionLocal
from ..models import Inspections
from app.models import Inspections, Seasons
from ..models import Inspections, Warehouses, Users, Managers
from ..schemas.inspection import InspectionCreate, InspectionUpdate,InspectionDetailsResponse, InspectionResponse

router = APIRouter(prefix="/inspectionsDetails", tags=["Inspections"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(payload: InspectionCreate, db: Session = Depends(get_db)):
    entity = Inspections(**payload.model_dump(), Created_At=datetime.now())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity

# @router.get("GetAllInspections", response_model=list[InspectionDetailsResponse])
# def get_inspection_details(db: Session = Depends(get_db)):
#     inspections = (
#         db.query(
#             Inspections.Id_Inspections,
#             Inspections.Warehouse_Id,
#             Warehouses.Warehouse_Name.label("Warehouse_Name"),
#             Inspections.Inspector_Id,
#             Users.UserName.label("Inspector_Name"),
#             Users.Role.label("Inspector_Role"),
#             Inspections.Manager_Id,
#             Managers.Manager_Name.label("Manager_Name"),  # <-- FIXED
#             Managers.Role.label("Manager_Role"),
#             Inspections.Created_At,
#             Inspections.Data,
#             Inspections.Status,
#             Inspections.Remarks,
#         )
#         .join(Warehouses, Inspections.Warehouse_Id == Warehouses.IdWarehouse)
#         .join(Users, Inspections.Inspector_Id == Users.id)
#         .join(Managers, Inspections.Manager_Id == Managers.id)
#         .all()
#     )
#     return inspections

# @router.get("", response_model=List[InspectionResponse])
# def list_inspections(db: Session = Depends(get_db)):
#     return db.query(Inspections).all()

@router.get("", response_model=List[InspectionResponse])
def list_inspections(db: Session = Depends(get_db)):
    inspections = (
        db.query(Inspections, Seasons.Season_Name)
        .join(Seasons, Inspections.Season_Id == Seasons.IdSeason)
        .all()
    )

    # Transform result to match InspectionResponse schema
    result = []
    for inspection, season_name in inspections:
        inspection_dict = inspection.__dict__.copy()
        inspection_dict["SeasonName"] = season_name
        result.append(inspection_dict)

    return result

@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return entity

@router.put("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(inspection_id: int, payload: InspectionUpdate, db: Session = Depends(get_db)):
    entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Inspection not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(entity, k, v)
    db.commit()
    db.refresh(entity)
    return entity

@router.delete("/{inspection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inspection(inspection_id: int, db: Session = Depends(get_db)):
    entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Inspection not found")
    db.delete(entity)
    db.commit()
    return None