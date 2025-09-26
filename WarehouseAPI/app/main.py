from fastapi import FastAPI, Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .routers import warehouse as warehouse_router
from .routers import users as users_router
from .routers import commodities as commodities_router
from .routers import inspectionsDetails as inspectionsDetails_router
from .routers import inspector as inspector_router
from .routers import manager as manager_router
from .routers import admin as admin_router
from .routers import questions as questions_router
from . import crud, schemas
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from fastapi.staticfiles import StaticFiles
from .routers import crop_year as crop_year_router
from .routers import season as season_router
from .routers import commodity_warehouse_map as commodity_warehouse_map_router
from .routers import remark as remark_router
import os


app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # or ["*"] for all
    allow_credentials=True,
    allow_methods=["*"],       # allows GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],       # allows Authorization, Content-Type, etc.
)
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(warehouse_router.router)
app.include_router(users_router.router)
app.include_router(commodities_router.router)
app.include_router(inspectionsDetails_router.router)
app.include_router(crop_year_router.router)
app.include_router(season_router.router)
app.include_router(commodity_warehouse_map_router.router)

app.include_router(inspector_router.router)
app.include_router(manager_router.router)
app.include_router(admin_router.router)
app.include_router(questions_router.router)
app.include_router(remark_router.router)
Base.metadata.create_all(bind=engine)

# app = FastAPI(title="Warehouse Inspection API")

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.post("/auth/login", response_model=schemas.LoginResponse, tags=["Auth"])
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, request.EmailId, request.Password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Lightweight JWT token (unsigned dev token if PyJWT unavailable)
    try:
        import jwt  # type: ignore
        token = jwt.encode({"sub": user.idusers, "role": user.Role}, "dev-secret", algorithm="HS256")
    except Exception:
        token = f"token-{user.idusers}"
    return {
        "id": user.idusers,
        "UserName": user.UserName,
        "Role": user.Role,
        "EmailId": user.EmailId,
        "message": "Login successful",
        "token": token,
    }

# Mount uploads directory as static for serving evidence files
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
if os.path.isdir(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/inspections/counts", response_model=schemas.InspectionCounts, tags=["Inspections"])
def inspections_counts(db: Session = Depends(get_db)):
    counts = crud.get_inspection_counts(db)
    return {
        "TotalInspections": counts["total"],
        "Pending": counts["pending"],
        "Completed": counts["completed"],
        "InProgress": counts["inprogress"],
    }

@app.get("/warehouses/count", response_model=schemas.CountResponse, tags=["Warehouses"])
def warehouses_count(db: Session = Depends(get_db)):
    return {"count": crud.get_warehouses_count(db)}

@app.get("/inspectors/count", response_model=schemas.CountResponse, tags=["Users"])
def inspectors_count(db: Session = Depends(get_db)):
    return {"count": crud.get_inspectors_count(db)}

@app.get("/managers/count", response_model=schemas.CountResponse, tags=["Users"])
def managers_count(db: Session = Depends(get_db)):
    return {"count": crud.get_managers_count(db)}

@app.get("/inspections/average", response_model=schemas.AverageResponse, tags=["Inspections"])
def inspections_average(db: Session = Depends(get_db)):
    return {"average": crud.get_average_completed_percentage(db)}

@app.get("/inspectors/{inspector_id}/warehouses", response_model=List[schemas.WarehouseCard], tags=["Inspector"])
def inspector_warehouses(inspector_id: int, db: Session = Depends(get_db)):
    """
    Returns all warehouses assigned to this inspector.
    """
    return crud.get_warehouses_for_inspector(db, inspector_id)

@app.get("/commoditiess", response_model=list[schemas.Commodity], tags=["Commodities"])
def get_commodities(db: Session = Depends(get_db)):
    commodities = crud.get_all_commodities(db)
    return commodities
