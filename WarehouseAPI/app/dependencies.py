# app/dependencies.py
from sqlalchemy.orm import Session
from .database import SessionLocal
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import AuthToken, Users


bearer_scheme = HTTPBearer(auto_error=True)

def get_db():
    """
    FastAPI dependency to get a DB session.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_auth_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Users:
    """
    FastAPI dependency to protect endpoints using auth token.
    Reads token from Authorization: Bearer <token>
    """
    token = credentials.credentials
    auth_record = db.query(AuthToken).filter(AuthToken.Token == token).first()
    if not auth_record:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(Users).filter(Users.idusers == auth_record.User_Id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user