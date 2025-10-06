from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, require_auth_token
from app.models import Users, Managers, Inspections, Warehouses, Commoditymaster, Seasons
from app.schemas.manager_dashboard import (
    ManagerDashboardResponse,
    InspectionSchema,
    TotalInspectionsSchema,
    WarehousesSchema,
    WarehouseSchema,
    InspectorsSchema,
    InspectorSchema
)

router = APIRouter(prefix="/manager", tags=["Manager Dashboard"])


@router.get("/dashboard", response_model=ManagerDashboardResponse)
def get_manager_dashboard(
    ManagerId: int = Query(..., description=""),
    db: Session = Depends(get_db), current_user: Users = Depends(require_auth_token)
):
    # Step 1: Validate that the user exists and is a Manager
    user = db.query(Users).filter(Users.idusers == ManagerId, Users.Role == "Manager").first()
    if not user:
        raise HTTPException(status_code=404, detail="Manager not found")

    # Step 2: Get manager table row corresponding to this UserId
    manager = db.query(Managers).filter(Managers.User_Id == ManagerId).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager record not found")

    # Step 3: Fetch inspections for this manager
    inspections_query = db.query(Inspections).filter(Inspections.Manager_Id == manager.Id_Manager).all()

    inspections_set = {}
    status_count = {"Pending": 0, "Completed": 0, "In Progress": 0, "Rejected": 0}

    for insp in inspections_query:
        # Fetch commodity name
        commodity_name = None
        if insp.Commodity_Id:
            commodity = db.query(Commoditymaster).filter(
                Commoditymaster.IdCommodity == insp.Commodity_Id
            ).first()
            if commodity:
                commodity_name = commodity.Commodity_Name

        # Fetch season name
        season_name = None
        if insp.Season_Id:
            season = db.query(Seasons).filter(
                Seasons.IdSeason == insp.Season_Id
            ).first()
            if season:
                season_name = season.Season_Name

        key = (
            insp.Created_At, insp.Data, insp.Status, insp.Remarks, insp.Commodity_Id,
            insp.Risk_Score, insp.Completed_At, insp.Manager_Approved,
            insp.Manager_Approved_At, insp.Manager_Remarks, insp.Season_Id
        )

        if key not in inspections_set:
            inspections_set[key] = InspectionSchema(
                Created_At=insp.Created_At,
                Data=insp.Data,
                Status=insp.Status,
                Remarks=insp.Remarks,
                Commodity_Id=insp.Commodity_Id,
                Commodity_Name=commodity_name,
                Risk_Score=insp.Risk_Score,
                Completed_At=insp.Completed_At,
                Manager_Approved=insp.Manager_Approved,
                Manager_Approved_At=insp.Manager_Approved_At,
                Manager_Remarks=insp.Manager_Remarks,
                Season_Id=insp.Season_Id,
                SeasonName=season_name
            )

        if insp.Status in status_count:
            status_count[insp.Status] += 1

    total_inspections = TotalInspectionsSchema(
        Inspections_Count=len(inspections_set),
        Inspections=list(inspections_set.values()),
        Pending=status_count["Pending"],
        Completed=status_count["Completed"],
        In_Progress=status_count["In Progress"],
        Rejected=status_count["Rejected"]
    )

    # Step 4: Fetch warehouses assigned to this manager
    warehouses_query = db.query(Warehouses).join(Users.user_warehouse_map).filter(
        Users.idusers == ManagerId
    ).all()

    warehouse_set = {}
    for w in warehouses_query:
        key = (w.Warehouse_Name, w.Location, w.Code, w.Capacity, w.Latitude, w.Longitude, w.Inventory)
        if key not in warehouse_set:
            warehouse_set[key] = WarehouseSchema(
                Warehouse_Name=w.Warehouse_Name,
                Location=w.Location,
                Code=w.Code,
                Capacity=w.Capacity,
                Latitude=float(w.Latitude) if w.Latitude else None,
                Longitude=float(w.Longitude) if w.Longitude else None,
                Inventory=w.Inventory
            )

    warehouses_data = WarehousesSchema(
        Warehouses_Count=len(warehouse_set),
        Warehouse_List=list(warehouse_set.values())
    )

    # Step 5: Fetch inspectors from inspections (distinct)
    inspector_ids = (
        db.query(Inspections.Inspector_Id)
        .filter(Inspections.Manager_Id == manager.Id_Manager)
        .distinct()
        .all()
    )
    inspector_ids = [i[0] for i in inspector_ids if i[0] is not None]

    inspectors = []
    for ins_id in inspector_ids:
        user = db.query(Users).filter(Users.idusers == ins_id).first()
        if user:
            inspectors.append(
                InspectorSchema(
                    Inspector_Name=user.Full_Name if user.Full_Name else f"Inspector-{user.idusers}"
                )
            )

    inspectors_data = InspectorsSchema(
        Inspectors_Count=len(inspectors),
        Inspector_List=inspectors
    )

    # ✅ Always return a valid ManagerDashboardResponse
    return ManagerDashboardResponse(
        Total_Inspections=total_inspections,
        Warehouses=warehouses_data,
        Inspectors=inspectors_data
    )
