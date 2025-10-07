from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import SessionLocal
from ..models import Inspections
from app.models import Inspections, Seasons
from ..models import Inspections, Warehouses, Users, Managers, InspectionAnswers
from ..schemas.inspection import InspectionCreate, InspectionUpdate,InspectionDetailsResponse, InspectionResponse, InspectionSummaryRequest, InspectionSummaryResponse, InspectionGraphResponse, InspectionGraphItem, InspectionGraphCategory
import json
from .. import models
from ..models import Users
from datetime import datetime
from ..dependencies import require_auth_token, get_db

router = APIRouter(prefix="/inspectionsDetails", tags=["Inspections"])

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

@router.put("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(inspection_id: int, payload: InspectionUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    entity = db.query(Inspections).filter(Inspections.Id_Inspections == inspection_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Inspection not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(entity, k, v)

    # If Data contains answers JSON, upsert InspectionAnswers
    try:
        if payload.Data:
            answers = json.loads(payload.Data)
            if isinstance(answers, list):
                for a in answers:
                    qid = a.get("question_id")
                    if not isinstance(qid, int):
                        continue
                    ans_val = a.get("answer")
                    rem_val = a.get("remarks")
                    existing = db.query(InspectionAnswers).filter(
                        InspectionAnswers.inspection_id == inspection_id,
                        InspectionAnswers.question_id == qid,
                    ).first()
                    if existing:
                        existing.answer = ans_val
                        existing.remarks = rem_val
                    else:
                        db.add(InspectionAnswers(
                            inspection_id=inspection_id,
                            question_id=qid,
                            answer=ans_val,
                            remarks=rem_val,
                        ))
    except Exception:
        # If parsing fails, ignore silently to not block other updates
        pass

    db.commit()
    db.refresh(entity)
    return entity

@router.post("/summary", response_model=InspectionSummaryResponse)
def inspection_summary(request: InspectionSummaryRequest, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):

    query = db.query(Inspections)

    if request.FromDate:
        query = query.filter(Inspections.Created_At >= datetime.combine(request.FromDate, datetime.min.time()))
    if request.ToDate:
        query = query.filter(Inspections.Created_At <= datetime.combine(request.ToDate, datetime.max.time()))

    total_inspection_count = query.count()
    #in_progress = query.filter(Inspections.Status == 'In Progress').count()
    pending = query.filter(Inspections.Status == 'Pending').count()
    Accepted = query.filter(Inspections.Status == 'Accepted').count()
    rejected = query.filter(Inspections.Status == 'Rejected').count()

    # created_at_count = query.filter(
    #     Inspections.Created_At >= datetime.combine(request.FromDate or datetime.min.date(), datetime.min.time()),
    #     Inspections.Created_At <= datetime.combine(request.ToDate or datetime.max.date(), datetime.max.time())
    # ).count()

    return InspectionSummaryResponse(
        total_inspection_count=total_inspection_count,
        #in_progress=in_progress,
        pending=pending,
        Accepted=Accepted,
        rejected=rejected,
        #created_at_count=created_at_count
    )


@router.get("/inspection-graph", response_model=InspectionGraphResponse)
def get_inspection_graph(
    fromdate: Optional[datetime] = Query(None),
    todate: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
    , current_user: Users = Depends(require_auth_token)
):
    # Query with joinedload for related tables including Seasons
    inspections = (
        db.query(Inspections)
        .options(
            joinedload(Inspections.users),       # Inspector
            joinedload(Inspections.managers).joinedload(Managers.users),  # Manager
            joinedload(Inspections.warehouses),  # Warehouse
            joinedload(Inspections.commoditymaster)  # Commodity
        )
        .join(Seasons, Inspections.Season_Id == Seasons.IdSeason)  # Join Seasons
        .add_columns(Seasons.Season_Name)  # Include Season_Name in results
    )

    if fromdate:
        inspections = inspections.filter(Inspections.Created_At >= fromdate)
    if todate:
        inspections = inspections.filter(Inspections.Created_At <= todate)

    inspections = inspections.all()

    def map_inspection(i):
        inspection, season_name = i  # unpack tuple (inspection object, season_name)
        return InspectionGraphItem(
            Id_Inspections=inspection.Id_Inspections,
            Warehouse_Id=inspection.Warehouse_Id,
            WarehouseName=inspection.warehouses.Warehouse_Name if inspection.warehouses else None,
            Inspector_Id=inspection.Inspector_Id,
            InspectorName=inspection.users.Full_Name if inspection.users else None,
            Manager_Id=inspection.Manager_Id,
            ManagerName=inspection.managers.users.Full_Name if inspection.managers else None,
            Created_At=inspection.Created_At,
            Data=inspection.Data,
            Status=inspection.Status,
            Remarks=inspection.Remarks,
            Commodity_Id=inspection.Commodity_Id,
            CommodityName=inspection.commoditymaster.Commodity_Name if inspection.commoditymaster else None,
            Risk_Score=inspection.Risk_Score,
            Completed_At=inspection.Completed_At,
            Manager_Approved=inspection.Manager_Approved,
            Manager_Approved_At=inspection.Manager_Approved_At,
            Manager_Remarks=inspection.Manager_Remarks,
            Season_Id=inspection.Season_Id,
            SeasonName=season_name
        )

    #in_progress_items = [map_inspection(i) for i in inspections if i[0].Status == 'In Progress']
    pending_items = [map_inspection(i) for i in inspections if i[0].Status == 'Pending']
    accepted_items = [map_inspection(i) for i in inspections if i[0].Status == 'Accepted']
    rejected_items = [map_inspection(i) for i in inspections if i[0].Status == 'Rejected']

    response = InspectionGraphResponse(
        TotalInspectionCount=len(inspections),
        #InProgress=InspectionGraphCategory(Count=len(in_progress_items), Inspections=in_progress_items),
        Pending=InspectionGraphCategory(Count=len(pending_items), Inspections=pending_items),
        Accepted=InspectionGraphCategory(Count=len(accepted_items), Inspections=accepted_items),
        Rejected=InspectionGraphCategory(Count=len(rejected_items), Inspections=rejected_items)
    )

    return response