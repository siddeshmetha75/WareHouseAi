from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import SessionLocal
from ..models import Users as UserModel
from ..schemas.user import UserCreate, UserUpdate, UserResponse
from .. import models
from ..models import Users
from ..dependencies import require_auth_token, get_db


router = APIRouter(prefix="/users", tags=["Users"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

@router.get("/", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None),  # allow fetching all roles when omitted
    active: Optional[int] = Query(None),
    db: Session = Depends(get_db)
    , current_user: Users = Depends(require_auth_token)
):
    q = db.query(UserModel)


    if role:
        q = q.filter(UserModel.Role == role)
    if active is not None:
        q = q.filter(UserModel.Is_Active == active)
    return q.all()
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    user = db.query(UserModel).filter(UserModel.idusers == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    # Note: For demo, storing password as plain text matching schema; in production hash it.
    user = UserModel(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    user = db.query(UserModel).filter(UserModel.idusers == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    user = db.query(UserModel).filter(UserModel.idusers == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None

