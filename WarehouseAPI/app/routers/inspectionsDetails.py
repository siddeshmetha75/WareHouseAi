from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import SessionLocal
from ..models import Inspections
from app.models import Inspections, Seasons
from ..models import Inspections, Warehouses, Users, Managers, InspectionAnswers
from ..schemas.inspection import InspectionCreate, InspectionUpdate,InspectionDetailsResponse, InspectionResponse
import json

router = APIRouter(prefix="/inspectionsDetails", tags=["Inspections"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.put("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(inspection_id: int, payload: InspectionUpdate, db: Session = Depends(get_db)):
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