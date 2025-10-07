from fastapi import FastAPI, Depends
from fastapi import HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from typing import List
from fastapi.staticfiles import StaticFiles
from .routers import crop_year as crop_year_router
from .routers import season as season_router
from .routers import hierarchy as hierarchy_router
from .routers import user_warehouse as user_warehouse_router
from .routers import manager_dashboard as manager_dashboard_router
from .models import CustomToken, AuthToken, Users
import datetime
from app.dependencies import require_auth_token, get_db
from app.routers import warehousecommodity as warehousecommodity_router

try:
    import jwt
except ImportError:
    jwt = None  # Allow startup without PyJWT; token generation below has a fallback
from .routers import commodity_warehouse_map as commodity_warehouse_map_router
from .routers import remark as remark_router
import os

app = FastAPI(title="Warehouse Inspection API")

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
app.include_router(warehousecommodity_router.router)
app.include_router(warehouse_router.router)
app.include_router(users_router.router)
app.include_router(commodities_router.router)
app.include_router(inspectionsDetails_router.router)
app.include_router(crop_year_router.router)
app.include_router(season_router.router)
app.include_router(commodity_warehouse_map_router.router)
app.include_router(hierarchy_router.router)
app.include_router(user_warehouse_router.router)
app.include_router(manager_dashboard_router.router)

app.include_router(inspector_router.router)
app.include_router(manager_router.router)
app.include_router(admin_router.router)
app.include_router(questions_router.router)
app.include_router(remark_router.router)
bearer_scheme = HTTPBearer(auto_error=False)

# app = FastAPI(title="Warehouse Inspection API")

# DB Dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
# @app.post("/auth/login", response_model=schemas.LoginResponse, tags=["Auth"])
# def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
#     user = crud.authenticate_user(db, request.EmailId, request.Password)
#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid email or password")
#     # Lightweight JWT token (unsigned dev token if PyJWT unavailable)
#     try:
#         import jwt  # type: ignore
#         token = jwt.encode({"sub": user.idusers, "role": user.Role}, "dev-secret", algorithm="HS256")
#     except Exception:
#         token = f"token-{user.idusers}"
#     return {
#         "id": user.idusers,
#         "UserName": user.UserName,
#         "Role": user.Role,
#         "EmailId": user.EmailId,
#         "message": "Login successful",
#         "token": token,
#     }
# @app.post("/auth/login")
# def login(
#     request: schemas.LoginRequest,
#     creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
#     db: Session = Depends(get_db),
# ):
#     # Step 1: Authenticate credentials
#     user = crud.authenticate_user(db, request.EmailId, request.Password)
#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid email or password")

#     # Step 2: Extract token from Authorization: Bearer <token>
#     if not creds or not creds.credentials:
#         raise HTTPException(status_code=401, detail="Missing authorization token")
#     custom_token = creds.credentials

#     # Step 3: Validate the token against CustomToken table
#     token_record = db.query(CustomToken).filter(CustomToken.Token == custom_token).first()
#     if not token_record:
#         raise HTTPException(status_code=401, detail="Invalid custom token")

#     # Step 4: Generate new auth token (JWT)
#     try:
#         token = jwt.encode(
#             {
#                 "sub": user.idusers,
#                 "role": user.Role,
#                 "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
#             },
#             "dev-secret",
#             algorithm="HS256",
#         )
#     except Exception:
#         token = f"token-{user.idusers}-{int(datetime.datetime.utcnow().timestamp())}"

#     # Step 5: Save/update in AuthToken table
#     existing_auth = db.query(AuthToken).filter(AuthToken.User_Id == user.idusers).first()
#     if existing_auth:
#         existing_auth.Token = token
#         existing_auth.Insert_Date = datetime.datetime.utcnow()
#     else:
#         db.add(AuthToken(User_Id=user.idusers, Token=token))

#     db.commit()

#     return {
#         "id": user.idusers,
#         "UserName": user.UserName,
#         "Role": user.Role,
#         "EmailId": user.EmailId,
#         "message": "Login successful",
#         "token": token,
#     }

@app.post("/auth/login")
def login(
    request: schemas.LoginRequest,
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
    , current_user: Users = Depends(require_auth_token)
):
    # Step 1: Authenticate email + password (hashed check)
    user = crud.authenticate_user(db, request.EmailId, request.Password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Step 2: Extract token from Authorization header
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    custom_token = creds.credentials

    # Step 3: Validate custom token against DB
    token_record = db.query(CustomToken).filter(CustomToken.Token == custom_token).first()
    if not token_record:
        raise HTTPException(status_code=401, detail="Invalid custom token")

    # Step 4: Generate new JWT token
    try:
        token = jwt.encode(
            {
                "sub": user.idusers,
                "role": user.Role,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            },
            "dev-secret",
            algorithm="HS256",
        )
    except Exception:
        token = f"token-{user.idusers}-{int(datetime.datetime.utcnow().timestamp())}"

    # Step 5: Save/update AuthToken table
    existing_auth = db.query(AuthToken).filter(AuthToken.User_Id == user.idusers).first()
    if existing_auth:
        existing_auth.Token = token
        existing_auth.Insert_Date = datetime.datetime.utcnow()
    else:
        db.add(AuthToken(User_Id=user.idusers, Token=token))

    db.commit()

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
def inspections_counts(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    counts = crud.get_inspection_counts(db)
    return {
        "TotalInspections": counts["total"],
        "Pending": counts["pending"],
        "Accepted": counts["Accepted"],
        "Rejected": counts["Rejected"],
    }

@app.get("/warehouses/count", response_model=schemas.CountResponse, tags=["Warehouses"])
def warehouses_count(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return {"count": crud.get_warehouses_count(db)}

@app.get("/inspectors/count", response_model=schemas.CountResponse, tags=["Users"])
def inspectors_count(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return {"count": crud.get_inspectors_count(db)}

@app.get("/managers/count", response_model=schemas.CountResponse, tags=["Users"])
def managers_count(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return {"count": crud.get_managers_count(db)}

@app.get("/inspections/average", response_model=schemas.AverageResponse, tags=["Inspections"])
def inspections_average(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    return {"average": crud.get_average_completed_percentage(db)}

@app.get("/inspectors/{inspector_id}/warehouses", response_model=List[schemas.WarehouseCard], tags=["Inspector"])
def inspector_warehouses(inspector_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    """
    Returns all warehouses assigned to this inspector.
    """
    return crud.get_warehouses_for_inspector(db, inspector_id)

@app.get("/commoditiess", response_model=list[schemas.Commodity], tags=["Commodities"])
def get_commodities(db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)):
    commodities = crud.get_all_commodities(db)
    return commodities
