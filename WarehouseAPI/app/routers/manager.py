from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import SessionLocal
#from ..models import Inspections, InspectionAnswers, Questions, UserWarehouseMap, Users, Warehouses, Commoditymaster, Evidence, Seasons, Remark
from ..models import Inspections, InspectionAnswers,Evidence, CommoditySeason, Questions, UserWarehouseMap, Users, Warehouses, Commoditymaster, Evidence, Seasons, Remark, Managers

from ..schemas.inspection import ApproveRequest
from sqlalchemy.orm import joinedload, contains_eager

router = APIRouter(prefix="/api", tags=["Manager"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/inspections")
def list_inspections(
    pending_only: bool = False,
    inspector_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Inspections)
    if pending_only:
        q = q.filter(Inspections.Status == "Pending")
    if inspector_id is not None:
        q = q.filter(Inspections.Inspector_Id == inspector_id)
    if status:
        # Support comma-separated status values
        status_list = [s.strip() for s in status.split(",")]
        q = q.filter(Inspections.Status.in_(status_list))

    rows = q.order_by(Inspections.Created_At.desc()).all()

    result = []
    for i in rows:
        wh = db.query(Warehouses).filter(Warehouses.Id_Warehouse == i.Warehouse_Id).first()
        cm = (
            db.query(Commoditymaster)
            .filter(Commoditymaster.IdCommodity == i.Commodity_Id)
            .first()
            if i.Commodity_Id
            else None
        )
        ins = db.query(Users).filter(Users.idusers == i.Inspector_Id).first()
        season = db.query(Seasons).filter(Seasons.IdSeason == i.Season_Id).first() if i.Season_Id else None

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
            "Remarks": i.Remarks,
            "Manager_Remarks": i.Manager_Remarks,
            "Season_Id": i.Season_Id,
            "SeasonName": season.Season_Name if season else None,
        })
    return result



@router.get("/inspection-answers/{inspection_id}")
def get_answers(inspection_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(InspectionAnswers, Questions)
        .join(Questions, Questions.id == InspectionAnswers.question_id)
        .filter(InspectionAnswers.inspection_id == inspection_id)
        .all()
    )
    return [
        {
            "question_id": ans.question_id,
            "question_text": q.text_,
            "answer": ans.answer,
            "remarks": ans.remarks,
        }
        for ans, q in rows
    ]


# @router.put("/inspections/{inspection_id}/review")
# def review_inspection(
#     inspection_id: int,
#     payload: dict,
#     db: Session = Depends(get_db),
# ):
#     entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
#     if not entity:
#         raise HTTPException(status_code=404, detail="Inspection not found")

#     status = payload.get("status")
#     remarks = payload.get("manager_remarks")
#     if status not in ("Accepted", "Rejected"):
#         raise HTTPException(status_code=400, detail="status must be 'Accepted' or 'Rejected'")

#     entity.Status = status
#     entity.Manager_Remarks = remarks
#     db.commit()
#     db.refresh(entity)
#     wh = db.query(Warehouses).filter(Warehouses.Id_Warehouse == entity.Warehouse_Id).first()
#     cm = db.query(Commoditymaster).filter(Commoditymaster.IdCommodity == entity.Commodity_Id).first() if entity.Commodity_Id else None
#     ins = db.query(Users).filter(Users.idusers == entity.Inspector_Id).first()
#     return {
#         "Id_Inspections": entity.Id_Inspections,
#         "warehouse": {"id": wh.Id_Warehouse, "name": wh.Warehouse_Name} if wh else None,
#         "commodity": ({"id": cm.IdCommodity, "name": cm.Commodity_Name} if cm else None),
#         "inspector": {
#             "id": ins.idusers if ins else None,
#             "username": ins.UserName if ins else None,
#             "full_name": ins.Full_Name if ins else None,
#         },
#         "Created_At": entity.Created_At,
#         "Status": entity.Status,
#         "Manager_Remarks": entity.Manager_Remarks,
#     }
@router.put("/inspections/{inspection_id}/review")
def review_inspection(
    inspection_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Inspection not found")

    status = payload.get("status")
    remarks = payload.get("manager_remarks")
    if status not in ("Accepted", "Rejected"):
        raise HTTPException(status_code=400, detail="status must be 'Accepted' or 'Rejected'")

    # Update inspection
    entity.Status = status
    entity.Manager_Remarks = remarks
    db.commit()
    db.refresh(entity)

    # Fetch related warehouse, commodity, inspector
    wh = db.query(Warehouses).filter(Warehouses.Id_Warehouse == entity.Warehouse_Id).first()
    cm = db.query(Commoditymaster).filter(Commoditymaster.IdCommodity == entity.Commodity_Id).first() if entity.Commodity_Id else None
    ins = db.query(Users).filter(Users.idusers == entity.Inspector_Id).first()

    # Fetch related remarks (map by question id)
    remarks_list = []
    inspection_answers = db.query(InspectionAnswers).filter(InspectionAnswers.inspection_id == inspection_id).all()
    for answer in inspection_answers:
        # Remark table links to question via Question_Id
        answer_remarks = db.query(Remark).filter(Remark.Question_Id == answer.question_id, Remark.Is_Active == 1).all()
        for r in answer_remarks:
            remarks_list.append({
                "question_id": r.Question_Id,
                "status": r.Status,
                "manager_remarks": r.Remarks
            })

    return {
        "Id_Inspections": entity.Id_Inspections,
        "warehouse": {"id": wh.Id_Warehouse, "name": wh.Warehouse_Name} if wh else None,
        "commodity": {"id": cm.IdCommodity, "name": cm.Commodity_Name} if cm else None,
        "inspector": {
            "id": ins.idusers if ins else None,
            "username": ins.UserName if ins else None,
            "full_name": ins.Full_Name if ins else None,
        },
        "Created_At": entity.Created_At,
        "Status": entity.Status,
        "Manager_Remarks": entity.Manager_Remarks,
        "per_answers": remarks_list
    }


@router.get("/managers/{manager_id}/inspectors")
def get_inspectors_under_manager(manager_id: int, db: Session = Depends(get_db)):
    sub = (
        db.query(UserWarehouseMap.User_id)
        .filter(UserWarehouseMap.Manager_id == manager_id)
        .distinct()
        .subquery()
    )
    rows = db.query(Users).filter(Users.idusers.in_(sub)).all()
    return [
        {
            "id": u.idusers,
            "UserName": u.UserName,
            "Full_Name": u.Full_Name,
            "EmailId": u.EmailId,
            "Role": u.Role,
        }
        for u in rows
    ]


@router.get("/managers/{manager_id}/inspections")
def get_manager_inspections(manager_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Inspections).filter(Inspections.Manager_Id == manager_id)
    if status:
        if status not in ("Pending", "Accepted", "Rejected"):
            raise HTTPException(status_code=400, detail="Invalid status")
        q = q.filter(Inspections.Status == status)
    rows = q.order_by(Inspections.Created_At.desc()).all()
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
        })
    return result


# @router.get("/inspections/{inspection_id}")
# def get_inspection_detail(inspection_id: int, request: Request, db: Session = Depends(get_db)):
#     entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
#     if not entity:
#         raise HTTPException(status_code=404, detail="Inspection not found")

#     answers = (
#         db.query(InspectionAnswers, Questions)
#         .join(Questions, Questions.id == InspectionAnswers.question_id)
#         .filter(InspectionAnswers.inspection_id == inspection_id)
#         .all()
#     )
#     evidence_rows = db.query(Evidence).filter(Evidence.inspection_id == inspection_id).all()

#     # Resolve human-readable names
#     warehouse = db.query(Warehouses).filter(Warehouses.Id_Warehouse == entity.Warehouse_Id).first()
#     commodity = (
#         db.query(Commoditymaster).filter(Commoditymaster.IdCommodity == entity.Commodity_Id).first()
#         if entity.Commodity_Id is not None
#         else None
#     )
#     inspector = db.query(Users).filter(Users.idusers == entity.Inspector_Id).first()
#     season = (
#         db.query(Seasons).filter(Seasons.IdSeason == entity.Season_Id).first()
#         if entity.Season_Id
#         else None
#     )

#     base_url = str(request.base_url).rstrip('/')

#     def to_file_url(path: str | None) -> str | None:
#         if not path:
#             return None
#         import os
#         file_name = os.path.basename(path)
#         return f"{base_url}/uploads/{file_name}"

#     return {
#         "inspection": {
#             "id": entity.Id_Inspections,
#             "warehouse": {"id": warehouse.Id_Warehouse, "name": warehouse.Warehouse_Name} if warehouse else None,
#             "commodity": (
#                 {"id": commodity.IdCommodity, "name": commodity.Commodity_Name} if commodity else None
#             ),
#             "inspector": {
#                 "id": inspector.idusers if inspector else None,
#                 "username": inspector.UserName if inspector else None,
#                 "full_name": inspector.Full_Name if inspector else None,
#             },
#             "status": entity.Status,
#             "manager_remarks": entity.Manager_Remarks,
#             "Season_Id": entity.Season_Id,
#             "SeasonName": season.Season_Name if season else None,
#         },
#         "answers": [
#             {
#                 "question_id": a.question_id,
#                 "question_text": q.text_,
#                 "answer": a.answer,
#                 "remarks": a.remarks,
#                 "evidence": [
#                     {
#                         "id": e.id,
#                         "file_url": to_file_url(e.file_path),
#                         "file_type": e.file_type,
#                     }
#                     for e in evidence_rows
#                     if e.question_id == a.question_id
#                 ],
#             }
#             for a, q in answers
#         ],
#         "evidence": [
#             {
#                 "id": e.id,
#                 "file_url": to_file_url(e.file_path),
#                 "file_type": e.file_type,
#             }
#             for e in evidence_rows
#         ],
#     }


@router.get("/inspections/{inspection_id}")
def get_inspection_details(inspection_id: int, db: Session = Depends(get_db)):

    # Fetch inspection with related objects using joinedload
    inspection = db.query(Inspections).options(
        joinedload(Inspections.warehouses),
        joinedload(Inspections.commoditymaster)
            .joinedload(Commoditymaster.commodity_season)
            .joinedload(CommoditySeason.seasons),
        joinedload(Inspections.users),
        #joinedload(Inspections.managers).joinedload(Users),
        joinedload(Inspections.managers).joinedload(Managers.users),

        joinedload(Inspections.inspection_answers)
            .joinedload(InspectionAnswers.question)
            .joinedload(Questions.remark),
        joinedload(Inspections.evidence)
    ).filter(Inspections.Id_Inspections == inspection_id).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # Season info
    season = db.query(Seasons).filter(Seasons.IdSeason == inspection.Season_Id).first()

    # Build per_answers list (answers + remarks + evidence per question)
    per_answers = []
    for ans in inspection.inspection_answers:
        question = ans.question
        if question:
            # Remarks for this question & inspection
            question_remarks = [
                {
                    "remark_id": r.Id_Remark,
                    "status": r.Status,
                    "manager_remarks": r.Remarks
                }
                for r in question.remark if r.InspectionsId == inspection.Id_Inspections
            ]

            # Evidence for this question
            question_evidence = [
                {
                    "id": ev.id,
                    "file_path": ev.file_path,
                    "file_type": ev.file_type,
                    "uploaded_at": ev.uploaded_at
                }
                for ev in inspection.evidence if ev.question_id == question.id
            ]

            per_answers.append({
                "question_id": question.id,
                "question_text": question.text_,
                "answer": ans.answer,
                "remarks": question_remarks,
                "evidence": question_evidence
            })

    # Build top-level evidence list
    evidence_list = [
        {
            "id": ev.id,
            "file_path": ev.file_path,
            "file_type": ev.file_type,
            "question_id": ev.question_id,
            "uploaded_at": ev.uploaded_at
        }
        for ev in inspection.evidence
    ]

    return {
        "Id_Inspections": inspection.Id_Inspections,
        "Status": inspection.Status,
        "Manager_Remarks": inspection.Manager_Remarks,
        "Created_At": inspection.Created_At,
        "Completed_At": inspection.Completed_At,
        "Warehouse": {
            "id": inspection.warehouses.Id_Warehouse,
            "name": inspection.warehouses.Warehouse_Name
        } if inspection.warehouses else None,
        "Commodity": {
            "id": inspection.commoditymaster.IdCommodity,
            "name": inspection.commoditymaster.Commodity_Name
        } if inspection.commoditymaster else None,
        "Inspector": {
            "id": inspection.users.idusers,
            "username": inspection.users.UserName,
            "full_name": inspection.users.Full_Name
        } if inspection.users else None,
        "Manager": {
            "id": inspection.managers.Id_Manager,
            "full_name": inspection.managers.users.Full_Name if inspection.managers.users else None
        } if inspection.managers else None,
        "Season": {
            "id": season.IdSeason if season else None,
            "name": season.Season_Name if season else None
        },
        "per_answers": per_answers,
        "evidence": evidence_list
    }
