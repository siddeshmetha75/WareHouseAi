# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session

# from app.models import Users, Warehouses
# from app.schemas.hierarchy import HierarchyResponse, ManagerSchema, UserSchema, WarehouseSchema
# from app.database import get_db

# router = APIRouter(prefix="/hierarchy", tags=["Hierarchy"])


# @router.get("/", response_model=HierarchyResponse)
# def get_user_hierarchy(email: str, db: Session = Depends(get_db)):
#     user = db.query(Users).filter(Users.EmailId == email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     # If Admin → fetch managers under admin, and inspectors under those managers
#     if user.Role == "Admin":
#         managers = db.query(Users).filter(Users.Role == "Manager", Users.UserId == user.idusers).all()
#         manager_data = []
#         for m in managers:
#             inspectors = db.query(Users).filter(Users.Role == "Inspector", Users.UserId == m.idusers).all()
#             manager_data.append(
#                 ManagerSchema(
#                     id=m.idusers,
#                     name=m.Full_Name,
#                     email=m.EmailId,
#                     role=m.Role,
#                     inspectors=[
#                         UserSchema(id=i.idusers, name=i.Full_Name, email=i.EmailId, role=i.Role)
#                         for i in inspectors
#                     ],
#                 )
#             )
#         return HierarchyResponse(role="Admin", managers=manager_data)

#     # If Manager → fetch inspectors under this manager
#     elif user.Role == "Manager":
#         inspectors = db.query(Users).filter(Users.Role == "Inspector", Users.UserId == user.idusers).all()
#         return HierarchyResponse(
#             role="Manager",
#             managers=[
#                 ManagerSchema(
#                     id=user.idusers,
#                     name=user.Full_Name,
#                     email=user.EmailId,
#                     role=user.Role,
#                     inspectors=[
#                         UserSchema(id=i.idusers, name=i.Full_Name, email=i.EmailId, role=i.Role)
#                         for i in inspectors
#                     ],
#                 )
#             ],
#         )

#     # If Inspector → no children
#     else:
#         return HierarchyResponse(role="Inspector", managers=[])

# @router.get("/manager-warehouses", response_model=list[WarehouseSchema])
# def get_manager_warehouses(user_id: int, db: Session = Depends(get_db)):
#     # find all warehouse mappings for this manager
#     mappings = db.query(UserWarehouseMap).filter(UserWarehouseMap.Manager_id == user_id).all()
#     if not mappings:
#         raise HTTPException(status_code=404, detail="No warehouses found for this manager")

#     warehouse_ids = [m.Warehouse_id for m in mappings]

#     warehouses = db.query(Warehouses).filter(Warehouses.Id_Warehouse.in_(warehouse_ids)).all()

#     return [
#         WarehouseSchema(
#             id=w.Id_Warehouse,
#             name=w.Warehouse_Name,
#             location=w.Location,
#             code=w.Code,
#             capacity=w.Capacity,
#             latitude=float(w.Latitude) if w.Latitude is not None else None,
#             longitude=float(w.Longitude) if w.Longitude is not None else None,
#             inventory=w.Inventory,
#         )
#         for w in warehouses
#     ]