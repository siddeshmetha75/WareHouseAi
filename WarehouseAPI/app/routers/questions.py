from fastapi import APIRouter, Depends
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from ..database import SessionLocal
from ..models import Questions as Question
from ..schemas.question import QuestionReads
from ..schemas.question import QuestionRead, QuestionCreate, QuestionUpdate
from .. import models
from ..models import Users, Questions
from ..dependencies import require_auth_token, get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Questions"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


@router.get("/questions", response_model=List[QuestionReads])
def get_questions(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    try:
        rows = db.query(Question).all()
        return rows
    except Exception as exc:
        logger.exception("Failed to fetch questions: %s", exc)
        return []


# ✅ CREATE
@router.post("/", response_model=QuestionRead, status_code=status.HTTP_201_CREATED)
def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    new_question = Questions(
        text_=question.text,
        category=question.category,
        risk_weight=question.risk_weight
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question


# ✅ READ (ALL)
# @router.get("/", response_model=List[QuestionRead])
# def get_questionss(
#     db: Session = Depends(get_db),
#     current_user: Users = Depends(require_auth_token)
# ):
#     try:
#         return db.query(Questions).all()
#     except Exception as exc:
#         logger.exception("Failed to fetch questions: %s", exc)
#         return []


# ✅ READ (ONE)
@router.get("/{question_id}", response_model=QuestionRead)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    question = db.query(Questions).filter(Questions.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# ✅ UPDATE
@router.put("/{question_id}", response_model=QuestionRead)
def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    question = db.query(Questions).filter(Questions.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    for key, value in question_update.dict(exclude_unset=True).items():
        setattr(question, key if key != "text" else "text_", value)

    db.commit()
    db.refresh(question)
    return question


# ✅ DELETE
@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    question = db.query(Questions).filter(Questions.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
    return None