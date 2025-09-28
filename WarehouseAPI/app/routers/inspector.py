from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from fastapi import Form
from datetime import datetime
from ..database import SessionLocal
from ..models import Warehouses, UserWarehouseMap, Questions, Inspections, InspectionAnswers, Evidence, Users, Commoditymaster, Seasons, Managers

from ..schemas.inspection import (
    InspectionCreateRequest,
    InspectionCreateResponse,
    InspectionAnswerCreate,
    InspectionWithAnswersCreate,
    InspectionCreateWithAnswersResponse,
    InspectionUpdateRequest
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
    manager = db.query(Managers).filter(Managers.User_Id == mapping.Manager_id).first()
    if not manager:
        raise HTTPException(status_code=400, detail="Manager record not found")

    entity = Inspections(
        Warehouse_Id=payload.warehouse_id,
        Inspector_Id=payload.inspector_id,
        Manager_Id=manager.Id_Manager,
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
        cm = (
            db.query(Commoditymaster).filter(Commoditymaster.IdCommodity == i.Commodity_Id).first()
            if i.Commodity_Id else None
        )
        ins = db.query(Users).filter(Users.idusers == i.Inspector_Id).first()
        season = db.query(Seasons).filter(Seasons.IdSeason == i.Season_Id).first()
        season_name = season.Season_Name if season else None

        result.append({
            "Id_Inspections": i.Id_Inspections,
            "warehouse": {"id": wh.Id_Warehouse, "name": wh.Warehouse_Name} if wh else None,
            "commodity": {"id": cm.IdCommodity, "name": cm.Commodity_Name} if cm else None,
            "inspector": {
                "id": ins.idusers if ins else None,
                "username": ins.UserName if ins else None,
                "full_name": ins.Full_Name if ins else None,
            } if ins else None,
            "Created_At": i.Created_At,
            "Status": i.Status,
            "Manager_Remarks": i.Manager_Remarks,
            "Season_Id": i.Season_Id,
            "SeasonName": season_name,  # ✅ Now defined safely
        })
    return result


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


@router.delete("/inspections/{inspection_id}/evidence/{evidence_id}")
def delete_evidence(
    inspection_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
):
    # Ensure inspection exists
    if not db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first():
        raise HTTPException(status_code=404, detail="Inspection not found")

    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    if ev.inspection_id != inspection_id:
        raise HTTPException(status_code=400, detail="Evidence does not belong to this inspection")

    # Optionally remove file from disk (keep for now or implement safe delete)
    db.delete(ev)
    db.commit()
    return {"status": "success"}


@router.put("/inspections/{inspection_id}")
def update_inspection(
    inspection_id: int,
    payload: InspectionUpdateRequest,
    db: Session = Depends(get_db),
):
    inspection = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # Prevent any modification if manager already approved
    if inspection.Manager_Approved:
        raise HTTPException(status_code=403, detail="Cannot modify approved inspection")

    # Allow updating any of the allowed fields
    for field in ["Status", "Remarks", "Risk_Score", "Completed_At", "Manager_Approved", "Manager_Remarks"]:
        if getattr(payload, field, None) is not None:
            setattr(inspection, field, getattr(payload, field))

    # Update answers if provided
    if payload.answers:
        for ans in payload.answers:
            existing = db.query(InspectionAnswers).filter(
                InspectionAnswers.inspection_id == inspection_id,
                InspectionAnswers.question_id == ans.question_id
            ).first()
            if existing:
                existing.answer = ans.answer
                existing.remarks = ans.remarks
            else:
                new_ans = InspectionAnswers(
                    inspection_id=inspection_id,
                    question_id=ans.question_id,
                    answer=ans.answer,
                    remarks=ans.remarks
                )
                db.add(new_ans)

    db.commit()
    db.refresh(inspection)
    return {"status": "success", "inspection_id": inspection.Id_Inspections}
