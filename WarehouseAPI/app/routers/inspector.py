from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from fastapi import Form

from ..database import SessionLocal
from ..models import Warehouses, UserWarehouseMap, Questions, Inspections, InspectionAnswers, Evidence, Users, Commoditymaster
from ..schemas.inspection import (
    InspectionCreateRequest,
    InspectionCreateResponse,
    InspectionAnswerCreate,
    InspectionWithAnswersCreate,
    InspectionCreateWithAnswersResponse,
)
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["Inspector"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/warehouses", response_model=List[dict])
def get_inspector_warehouses(inspector_id: int, db: Session = Depends(get_db)):
    q = (
        db.query(Warehouses)
        .join(UserWarehouseMap, UserWarehouseMap.Warehouse_id == Warehouses.Id_Warehouse)
        .filter(UserWarehouseMap.User_id == inspector_id)
    )
    warehouses = [
        {
            "Id_Warehouse": w.Id_Warehouse,
            "Warehouse_Name": w.Warehouse_Name,
            "Location": w.Location,
            "Code": w.Code,
            "Capacity": w.Capacity,
            "Latitude": float(w.Latitude) if w.Latitude is not None else None,
            "Longitude": float(w.Longitude) if w.Longitude is not None else None,
        }
        for w in q.all()
    ]
    return warehouses




@router.post("/inspections", response_model=InspectionCreateWithAnswersResponse)
def create_inspection(
    payload: InspectionWithAnswersCreate,
    db: Session = Depends(get_db),
):
    mapping = (
        db.query(UserWarehouseMap)
        .filter(
            UserWarehouseMap.User_id == payload.inspector_id,
            UserWarehouseMap.Warehouse_id == payload.warehouse_id,
        )
        .first()
    )
    if not mapping:
        raise HTTPException(status_code=400, detail="No manager mapping found for inspector and warehouse")

    entity = Inspections(
        Warehouse_Id=payload.warehouse_id,
        Inspector_Id=payload.inspector_id,
        Manager_Id=mapping.Manager_id,
        Status="Pending",
        Commodity_Id=payload.commodity_id,
        Season_Id=payload.Season_Id,
        Remarks=None,
    )
    db.add(entity)
    db.flush()  # get Id before commit to use in answers

    if payload.answers:
        answer_rows = [
            InspectionAnswers(
                inspection_id=entity.Id_Inspections,
                question_id=a.question_id,
                answer=a.answer,
                remarks=a.remarks,
            )
            for a in payload.answers
        ]
        db.bulk_save_objects(answer_rows)

    db.commit()
    db.refresh(entity)
    return {"inspection_id": entity.Id_Inspections, "saved_answers": len(payload.answers or [])}


@router.post("/inspection-answers/{inspection_id}")
def save_answers(
    inspection_id: int,
    answers: list[InspectionAnswerCreate],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role", "").lower() != "inspector":
        raise HTTPException(status_code=403, detail="Only inspectors can submit answers")
    if not db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first():
        raise HTTPException(status_code=404, detail="Inspection not found")
    records = [
        InspectionAnswers(
            inspection_id=inspection_id,
            question_id=item.question_id,
            answer=item.answer,
            remarks=item.remarks,
        )
        for item in answers
    ]
    db.bulk_save_objects(records)
    db.commit()
    return {"status": "success", "saved": len(records)}


# ...existing code...

@router.get("/inspections/{inspection_id}")
def get_inspection_detail(inspection_id: int, request: Request, db: Session = Depends(get_db)):
    entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # ...existing code...

    return {
        "inspection": {
            "id": entity.Id_Inspections,
            "warehouse": {"id": warehouse.Id_Warehouse, "name": warehouse.Warehouse_Name} if warehouse else None,
            "commodity": (
                {"id": commodity.IdCommodity, "name": commodity.Commodity_Name} if commodity else None
            ),
            "inspector": {
                "id": inspector.idusers if inspector else None,
                "username": inspector.UserName if inspector else None,
                "full_name": inspector.Full_Name if inspector else None,
            },
            "status": entity.Status,
            "manager_remarks": entity.Manager_Remarks,
            "Season_Id": entity.Season_Id,  # <-- Added Season_Id
            "SeasonName": season_name,
        },
        # ...existing code...
    }

@router.get("/inspectors/{inspector_id}/inspections")
def list_inspector_inspections(inspector_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Inspections)
        .filter(Inspections.Inspector_Id == inspector_id)
        .order_by(Inspections.Created_At.desc())
        .all()
    )
    result = []
    for i in rows:
        wh = db.query(Warehouses).filter(Warehouses.Id_Warehouse == i.Warehouse_Id).first()
        cm = db.query(Commoditymaster).filter(Commoditymaster.IdCommodity == i.Commodity_Id).first() if i.Commodity_Id else None
        ins = db.query(Users).filter(Users.idusers == i.Inspector_Id).first()
        result.append({
            "Id_Inspections": i.Id_Inspections,
            "warehouse": {"id": wh.Id_Warehouse, "name": wh.Warehouse_Name} if wh else None,
            "commodity": ({"id": cm.IdCommodity, "name": cm.Commodity_Name} if cm else None),
            "inspector": {
                "id": ins.idusers if ins else None,
                "username": ins.UserName if ins else None,
                "full_name": ins.Full_Name if ins else None,
            },
            "Created_At": i.Created_At,
            "Status": i.Status,
            "Manager_Remarks": i.Manager_Remarks,
            "Season_Id": i.Season_Id,
            "SeasonName": season_name,  # <-- Added Season_Id
        })
    return result

# ...existing code...


# @router.post("/inspections/{inspection_id}/evidence")
# def upload_evidence(
#     inspection_id: int,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
# ):
#     if not db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first():
#         raise HTTPException(status_code=404, detail="Inspection not found")
#     import os
#     uploads_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'uploads'))
#     os.makedirs(uploads_dir, exist_ok=True)
#     safe_name = f"{inspection_id}_" + file.filename
#     file_location = os.path.join(uploads_dir, safe_name)
#     with open(file_location, 'wb') as f:
#         f.write(file.file.read())
#     ev = Evidence(inspection_id=inspection_id, file_path=file_location, file_type=file.content_type)
#     db.add(ev)
#     db.commit()
#     db.refresh(ev)
#     return {"status": "success", "evidence_id": ev.id}


@router.post("/inspections/{inspection_id}/evidence")
def upload_evidence(
    inspection_id: int,
    file: UploadFile = File(...),
    question_id: int = Form(...),  # <-- Accept question_id from form data
    db: Session = Depends(get_db),
):
    if not db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first():
        raise HTTPException(status_code=404, detail="Inspection not found")
    import os
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'uploads'))
    os.makedirs(uploads_dir, exist_ok=True)
    safe_name = f"{inspection_id}_" + file.filename
    file_location = os.path.join(uploads_dir, safe_name)
    with open(file_location, 'wb') as f:
        f.write(file.file.read())
    ev = Evidence(
        inspection_id=inspection_id,
        question_id=question_id,  # <-- Store question_id in Evidence
        file_path=file_location,
        file_type=file.content_type
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {"status": "success", "evidence_id": ev.id}


