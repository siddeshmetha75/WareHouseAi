from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.warehousecommodity import (
    WarehouseCommodityCreate,
    WarehouseCommodityUpdate,
    WarehouseCommodityResponse,
)
from app.models import WarehouseCommodity, Warehouses, Commoditymaster, Seasons, Users
from ..dependencies import require_auth_token, get_db

router = APIRouter(prefix="/warehousecommodity", tags=["Warehouse Commodity"])

# ✅ CREATE
@router.post("/", response_model=WarehouseCommodityResponse)
def create_warehouse_commodity(
    data: WarehouseCommodityCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    new_wc = WarehouseCommodity(
        CommodityMasterId=data.CommodityMasterId,
        SeasonId=data.SeasonId,
        WarehouseId=data.WarehouseId,
        Manager_Id=data.Manager_Id,
        InspectorId=data.InspectorId,  # ✅ Added
        Is_Active=1
    )
    db.add(new_wc)
    db.commit()
    db.refresh(new_wc)
    return new_wc


# ✅ READ (Get by ID)
@router.get("/{wc_id}", response_model=WarehouseCommodityResponse)
def get_warehouse_commodity(
    wc_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    wc = db.query(WarehouseCommodity).filter(WarehouseCommodity.Idwarehouse_commodity == wc_id).first()
    if not wc:
        raise HTTPException(status_code=404, detail="Warehouse Commodity not found")
    return wc


# ✅ UPDATE
@router.put("/{wc_id}", response_model=WarehouseCommodityResponse)
def update_warehouse_commodity(
    wc_id: int,
    data: WarehouseCommodityUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    wc = db.query(WarehouseCommodity).filter(WarehouseCommodity.Idwarehouse_commodity == wc_id).first()
    if not wc:
        raise HTTPException(status_code=404, detail="Warehouse Commodity not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(wc, key, value)

    db.commit()
    db.refresh(wc)
    return wc


# ✅ SOFT DELETE
@router.delete("/{wc_id}")
def soft_delete_warehouse_commodity(
    wc_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    wc = db.query(WarehouseCommodity).filter(WarehouseCommodity.Idwarehouse_commodity == wc_id).first()
    if not wc:
        raise HTTPException(status_code=404, detail="Warehouse Commodity not found")

    wc.Is_Active = 0
    db.commit()
    return {"message": f"WarehouseCommodity ID {wc_id} marked as inactive"}


# ✅ CUSTOM API: Get active records by WarehouseId
@router.get("/by-warehouse/{warehouse_id}", response_model=list[WarehouseCommodityResponse])
def get_active_by_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    manager_alias = Users.__table__.alias("manager")
    inspector_alias = Users.__table__.alias("inspector")

    results = (
        db.query(
            WarehouseCommodity,
            Warehouses.Warehouse_Name.label("WarehouseName"),
            Commoditymaster.Commodity_Name.label("CommodityName"),
            Seasons.Season_Name.label("SeasonName"),
            manager_alias.c.Full_Name.label("ManagerName"),
            inspector_alias.c.Full_Name.label("InspectorName"),
        )
        .join(Warehouses, WarehouseCommodity.WarehouseId == Warehouses.Id_Warehouse)
        .join(Commoditymaster, WarehouseCommodity.CommodityMasterId == Commoditymaster.IdCommodity)
        .join(Seasons, WarehouseCommodity.SeasonId == Seasons.IdSeason)
        .join(manager_alias, WarehouseCommodity.Manager_Id == manager_alias.c.idusers)
        .join(inspector_alias, WarehouseCommodity.InspectorId == inspector_alias.c.idusers)
        .filter(WarehouseCommodity.WarehouseId == warehouse_id, WarehouseCommodity.Is_Active == 1)
        .all()
    )

    response = []
    for wc, wname, cname, sname, mname, iname in results:
        item = WarehouseCommodityResponse.from_orm(wc)
        item.WarehouseName = wname
        item.CommodityName = cname
        item.SeasonName = sname
        item.ManagerName = mname
        item.InspectorName = iname
        response.append(item)

    return response


# ✅ CUSTOM API: Get by ManagerId
@router.get("/by-manager/{manager_id}", response_model=list[WarehouseCommodityResponse])
def get_by_manager(
    manager_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    manager_alias = Users.__table__.alias("manager")
    inspector_alias = Users.__table__.alias("inspector")

    results = (
        db.query(
            WarehouseCommodity,
            Warehouses.Warehouse_Name.label("WarehouseName"),
            Commoditymaster.Commodity_Name.label("CommodityName"),
            Seasons.Season_Name.label("SeasonName"),
            manager_alias.c.Full_Name.label("ManagerName"),
            inspector_alias.c.Full_Name.label("InspectorName"),
        )
        .join(Warehouses, WarehouseCommodity.WarehouseId == Warehouses.Id_Warehouse)
        .join(Commoditymaster, WarehouseCommodity.CommodityMasterId == Commoditymaster.IdCommodity)
        .join(Seasons, WarehouseCommodity.SeasonId == Seasons.IdSeason)
        .join(manager_alias, WarehouseCommodity.Manager_Id == manager_alias.c.idusers)
        .join(inspector_alias, WarehouseCommodity.InspectorId == inspector_alias.c.idusers)
        .filter(
            WarehouseCommodity.Manager_Id == manager_id,
            WarehouseCommodity.Is_Active == 1
        )
        .all()
    )

    response = []
    for wc, wname, cname, sname, mname, iname in results:
        item = WarehouseCommodityResponse.from_orm(wc)
        item.WarehouseName = wname
        item.CommodityName = cname
        item.SeasonName = sname
        item.ManagerName = mname
        item.InspectorName = iname
        response.append(item)

    return response


# ✅ NEW CUSTOM API: Get by InspectorId
@router.get("/by-inspector/{inspector_id}", response_model=list[WarehouseCommodityResponse])
def get_by_inspector(
    inspector_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_auth_token)
):
    manager_alias = Users.__table__.alias("manager")
    inspector_alias = Users.__table__.alias("inspector")

    results = (
        db.query(
            WarehouseCommodity,
            Warehouses.Warehouse_Name.label("WarehouseName"),
            Commoditymaster.Commodity_Name.label("CommodityName"),
            Seasons.Season_Name.label("SeasonName"),
            manager_alias.c.Full_Name.label("ManagerName"),
            inspector_alias.c.Full_Name.label("InspectorName"),
        )
        .join(Warehouses, WarehouseCommodity.WarehouseId == Warehouses.Id_Warehouse)
        .join(Commoditymaster, WarehouseCommodity.CommodityMasterId == Commoditymaster.IdCommodity)
        .join(Seasons, WarehouseCommodity.SeasonId == Seasons.IdSeason)
        .join(manager_alias, WarehouseCommodity.Manager_Id == manager_alias.c.idusers)
        .join(inspector_alias, WarehouseCommodity.InspectorId == inspector_alias.c.idusers)
        .filter(
            WarehouseCommodity.InspectorId == inspector_id,
            WarehouseCommodity.Is_Active == 1
        )
        .all()
    )

    response = []
    for wc, wname, cname, sname, mname, iname in results:
        item = WarehouseCommodityResponse.from_orm(wc)
        item.WarehouseName = wname
        item.CommodityName = cname
        item.SeasonName = sname
        item.ManagerName = mname
        item.InspectorName = iname
        response.append(item)

    return response
