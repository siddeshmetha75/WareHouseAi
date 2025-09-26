from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.hierarchy import AdminHierarchy, ManagerBase, InspectorBase, WarehouseBase, InspectionBase
from app.models import Users, Managers, Warehouses, Inspections
from app.database import get_db  # assuming you have get_db in database.py

router = APIRouter(prefix="/hierarchy", tags=["Hierarchy"])

# Utility to fetch inspector data
def get_inspector_details(db: Session, inspector: Users) -> InspectorBase:
    warehouses = [
        WarehouseBase(
            Id_Warehouse=w.Id_Warehouse,
            Warehouse_Name=w.Warehouse_Name,
            Location=w.Location,
            Capacity=w.Capacity,
            Latitude=float(w.Latitude) if w.Latitude else None,
            Longitude=float(w.Longitude) if w.Longitude else None,
            Inventory=w.Inventory,
            inspections=[
                InspectionBase(
                    Id_Inspections=i.Id_Inspections,
                    Status=i.Status,
                    Created_At=i.Created_At,
                    Completed_At=i.Completed_At,
                    Risk_Score=i.Risk_Score
                ) for i in w.inspections if i.Status
            ]
        )
        for w in inspector.user_warehouse_map
    ]
    
    inspections = [
        InspectionBase(
            Id_Inspections=i.Id_Inspections,
            Status=i.Status,
            Created_At=i.Created_At,
            Completed_At=i.Completed_At,
            Risk_Score=i.Risk_Score
        ) for i in inspector.inspections if i.Status
    ]

    return InspectorBase(
        idusers=inspector.idusers,
        UserName=inspector.UserName,
        Full_Name=inspector.Full_Name,
        EmailId=inspector.EmailId,
        warehouses=warehouses,
        inspections=inspections
    )


# Utility to fetch manager data
def get_manager_details(db: Session, manager: Users) -> ManagerBase:
    manager_obj = db.query(Managers).filter(Managers.User_Id == manager.idusers).first()
    if not manager_obj:
        raise HTTPException(status_code=404, detail="Manager not found")

    inspectors = [
        get_inspector_details(db, inspector.User)
        for inspector in manager_obj.user_warehouse_map
        if inspector.User.Role == "Inspector" and inspector.User.Is_Active == 1
    ]

    warehouses = [
        WarehouseBase(
            Id_Warehouse=w.Warehouse.Id_Warehouse,
            Warehouse_Name=w.Warehouse.Warehouse_Name,
            Location=w.Warehouse.Location,
            Capacity=w.Warehouse.Capacity,
            Latitude=float(w.Warehouse.Latitude) if w.Warehouse.Latitude else None,
            Longitude=float(w.Warehouse.Longitude) if w.Warehouse.Longitude else None,
            Inventory=w.Warehouse.Inventory,
            inspections=[
                InspectionBase(
                    Id_Inspections=i.Id_Inspections,
                    Status=i.Status,
                    Created_At=i.Created_At,
                    Completed_At=i.Completed_At,
                    Risk_Score=i.Risk_Score
                ) for i in w.Warehouse.inspections
            ]
        )
        for w in manager_obj.user_warehouse_map
    ]

    inspections = [
        InspectionBase(
            Id_Inspections=i.Id_Inspections,
            Status=i.Status,
            Created_At=i.Created_At,
            Completed_At=i.Completed_At,
            Risk_Score=i.Risk_Score
        ) for i in manager_obj.inspections
    ]

    return ManagerBase(
        idusers=manager.idusers,
        UserName=manager.UserName,
        Full_Name=manager.Full_Name,
        EmailId=manager.EmailId,
        inspectors=inspectors,
        warehouses=warehouses,
        inspections=inspections
    )


@router.get("/admin/{admin_id}", response_model=AdminHierarchy)
def get_admin_hierarchy(admin_id: int, db: Session = Depends(get_db)):
    admin = db.query(Users).filter(Users.idusers == admin_id, Users.Role == "Admin", Users.Is_Active == 1).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    managers = [
        get_manager_details(db, manager)
        for manager in db.query(Users).filter(Users.Role == "Manager", Users.Is_Active == 1).all()
    ]

    return AdminHierarchy(
        idusers=admin.idusers,
        UserName=admin.UserName,
        Full_Name=admin.Full_Name,
        EmailId=admin.EmailId,
        managers=managers
    )
