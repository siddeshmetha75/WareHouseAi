from sqlalchemy.orm import Session
from app.database import SessionLocal

# Dependency: get DB session for FastAPI routes
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
