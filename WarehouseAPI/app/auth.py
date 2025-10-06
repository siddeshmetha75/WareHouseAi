# app/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from .models import Users, AuthToken, CustomToken
from .dependencies import get_db
import secrets

security_scheme = HTTPBearer(auto_error=False)

def require_custom_token(custom_token: str, db: Session = Depends(get_db)):
    token_record = db.query(CustomToken).filter(CustomToken.Token == custom_token).first()
    if not token_record:
        raise HTTPException(status_code=401, detail="Invalid custom token")
    return token_record

def require_auth_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
                       db: Session = Depends(get_db)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Not authenticated")
    

    token_str = credentials.credentials
    token_record = db.query(AuthToken).filter(AuthToken.Token == token_str).first()
    if not token_record:
        raise HTTPException(status_code=401, detail="Invalid auth token")
    
    print("Insert_Date:", token_record.Insert_Date, "UTC now:", datetime.utcnow())

    # if token_record.Insert_Date + timedelta(hours=24) < datetime.utcnow():
    #     raise HTTPException(status_code=401, detail="Auth token expired")
    

    if token_record.Insert_Date + timedelta(hours=24) < datetime.now():
        raise HTTPException(status_code=401, detail="Auth token expired")

    user = db.query(Users).filter(Users.idusers == token_record.User_Id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def generate_auth_token(user_id: int, db: Session):
    token_str = secrets.token_urlsafe(32)
    auth_token = AuthToken(User_Id=user_id, Token=token_str)
    db.add(auth_token)
    db.commit()
    db.refresh(auth_token)
    return auth_token.Token
