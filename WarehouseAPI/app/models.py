from typing import Optional
import datetime
import decimal

from sqlalchemy import DECIMAL, DateTime, Enum, Float, ForeignKeyConstraint, Index, Integer, String, TIMESTAMP, Text, text
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class Commoditymaster(Base):
    __tablename__ = 'commoditymaster'

    IdCommodity: Mapped[int] = mapped_column(Integer, primary_key=True)
    Commodity_Name: Mapped[Optional[str]] = mapped_column(String(45))
    CommodityStorage: Mapped[Optional[str]] = mapped_column(String(45))
    Description: Mapped[Optional[str]] = mapped_column(String(255))
    IsActive: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("'1'"))
    CreatedAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    Category: Mapped[Optional[str]] = mapped_column(String(45))

    commodity_season: Mapped[list['CommoditySeason']] = relationship('CommoditySeason', back_populates='commoditymaster')
    commodity_warehouse_map: Mapped[list['CommodityWarehouseMap']] = relationship('CommodityWarehouseMap', back_populates='commoditymaster')
    crop_year: Mapped[list['CropYear']] = relationship('CropYear', back_populates='commoditymaster')
    warehouse_commodity: Mapped[list['WarehouseCommodity']] = relationship('WarehouseCommodity', back_populates='commoditymaster')
    inspections: Mapped[list['Inspections']] = relationship('Inspections', back_populates='commoditymaster')


class CustomToken(Base):
    __tablename__ = 'custom_token'

    IdCustomToken: Mapped[int] = mapped_column(Integer, primary_key=True)
    Token: Mapped[Optional[str]] = mapped_column(String(5000))


class Questions(Base):
    __tablename__ = 'questions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text_: Mapped[str] = mapped_column('text', String(500), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    risk_weight: Mapped[Optional[float]] = mapped_column(Float, server_default=text("'1'"))

    remark: Mapped[list['Remark']] = relationship('Remark', back_populates='questions')
    evidence: Mapped[list['Evidence']] = relationship('Evidence', back_populates='question')
    inspection_answers: Mapped[list['InspectionAnswers']] = relationship('InspectionAnswers', back_populates='question')


class Seasons(Base):
    __tablename__ = 'seasons'

    IdSeason: Mapped[int] = mapped_column(Integer, primary_key=True)
    Season_Name: Mapped[str] = mapped_column(Enum('Rabi', 'Kharif', 'Zaid'), nullable=False)

    commodity_season: Mapped[list['CommoditySeason']] = relationship('CommoditySeason', back_populates='seasons')
    commodity_warehouse_map: Mapped[list['CommodityWarehouseMap']] = relationship('CommodityWarehouseMap', back_populates='seasons')
    crop_year: Mapped[list['CropYear']] = relationship('CropYear', back_populates='seasons')
    warehouse_commodity: Mapped[list['WarehouseCommodity']] = relationship('WarehouseCommodity', back_populates='seasons')


class Users(Base):
    __tablename__ = 'users'

    idusers: Mapped[int] = mapped_column(Integer, primary_key=True)
    UserName: Mapped[Optional[str]] = mapped_column(String(45))
    Full_Name: Mapped[Optional[str]] = mapped_column(String(45))
    Role: Mapped[Optional[str]] = mapped_column(String(45))
    EmailId: Mapped[Optional[str]] = mapped_column(String(45))
    Password: Mapped[Optional[str]] = mapped_column(String(4000))
    Is_Active: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("'1'"))
    UserId: Mapped[Optional[int]] = mapped_column(Integer)

    auth_token: Mapped[list['AuthToken']] = relationship('AuthToken', back_populates='users')
    commodity_warehouse_map: Mapped[list['CommodityWarehouseMap']] = relationship('CommodityWarehouseMap', foreign_keys='[CommodityWarehouseMap.InspectorId]', back_populates='users')
    commodity_warehouse_map_: Mapped[list['CommodityWarehouseMap']] = relationship('CommodityWarehouseMap', foreign_keys='[CommodityWarehouseMap.ManagerId]', back_populates='users_')
    managers: Mapped[list['Managers']] = relationship('Managers', back_populates='users')
    user_warehouse_map: Mapped[list['UserWarehouseMap']] = relationship('UserWarehouseMap', back_populates='Manager')
    inspections: Mapped[list['Inspections']] = relationship('Inspections', back_populates='users')


class Warehouses(Base):
    __tablename__ = 'warehouses'

    Id_Warehouse: Mapped[int] = mapped_column(Integer, primary_key=True)
    Warehouse_Name: Mapped[Optional[str]] = mapped_column(String(45))
    Location: Mapped[Optional[str]] = mapped_column(String(45))
    Code: Mapped[Optional[str]] = mapped_column(String(45))
    Capacity: Mapped[Optional[int]] = mapped_column(Integer)
    Latitude: Mapped[Optional[decimal.Decimal]] = mapped_column(DECIMAL(10, 6))
    Longitude: Mapped[Optional[decimal.Decimal]] = mapped_column(DECIMAL(10, 6))
    Inventory: Mapped[Optional[str]] = mapped_column(String(45))

    commodity_warehouse_map: Mapped[list['CommodityWarehouseMap']] = relationship('CommodityWarehouseMap', back_populates='warehouses')
    user_warehouse_map: Mapped[list['UserWarehouseMap']] = relationship('UserWarehouseMap', back_populates='Warehouse')
    warehouse_commodity: Mapped[list['WarehouseCommodity']] = relationship('WarehouseCommodity', back_populates='warehouses')
    inspections: Mapped[list['Inspections']] = relationship('Inspections', back_populates='warehouses')


class AuthToken(Base):
    __tablename__ = 'auth_token'
    __table_args__ = (
        ForeignKeyConstraint(['User_Id'], ['users.idusers'], name='fk_userId_token'),
        Index('fk_userId_token_idx', 'User_Id')
    )

    IdAuthToken: Mapped[int] = mapped_column(Integer, primary_key=True)
    User_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Token: Mapped[Optional[str]] = mapped_column(String(5000))
    Insert_Date: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    users: Mapped['Users'] = relationship('Users', back_populates='auth_token')


class CommoditySeason(Base):
    __tablename__ = 'commodity_season'
    __table_args__ = (
        ForeignKeyConstraint(['Commodity_Id'], ['commoditymaster.IdCommodity'], name='commodity_season_ibfk_1'),
        ForeignKeyConstraint(['Season_Id'], ['seasons.IdSeason'], name='commodity_season_ibfk_2'),
        Index('Commodity_Id', 'Commodity_Id'),
        Index('Season_Id', 'Season_Id')
    )

    Id: Mapped[int] = mapped_column(Integer, primary_key=True)
    Commodity_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Season_Id: Mapped[int] = mapped_column(Integer, nullable=False)

    commoditymaster: Mapped['Commoditymaster'] = relationship('Commoditymaster', back_populates='commodity_season')
    seasons: Mapped['Seasons'] = relationship('Seasons', back_populates='commodity_season')


class CommodityWarehouseMap(Base):
    __tablename__ = 'commodity_warehouse_map'
    __table_args__ = (
        ForeignKeyConstraint(['CommodityId'], ['commoditymaster.IdCommodity'], name='fk_CommodityId'),
        ForeignKeyConstraint(['InspectorId'], ['users.idusers'], name='fk_InspectorId'),
        ForeignKeyConstraint(['ManagerId'], ['users.idusers'], name='fk_Manager_Id'),
        ForeignKeyConstraint(['SeasonId'], ['seasons.IdSeason'], name='fk_SeasonId'),
        ForeignKeyConstraint(['WarehouseId'], ['warehouses.Id_Warehouse'], name='fk_WarehouseId'),
        Index('fk_CommodityId_idx', 'CommodityId'),
        Index('fk_InspectorId_idx', 'InspectorId'),
        Index('fk_ManagerId_idx', 'ManagerId'),
        Index('fk_SeasonId_idx', 'SeasonId'),
        Index('fk_WarehouseId_idx', 'WarehouseId')
    )

    Id_CommodityWarehouseMap: Mapped[int] = mapped_column(Integer, primary_key=True)
    WarehouseId: Mapped[int] = mapped_column(Integer, nullable=False)
    ManagerId: Mapped[int] = mapped_column(Integer, nullable=False)
    InspectorId: Mapped[int] = mapped_column(Integer, nullable=False)
    CommodityId: Mapped[int] = mapped_column(Integer, nullable=False)
    SeasonId: Mapped[int] = mapped_column(Integer, nullable=False)
    Is_Active: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("'1'"))

    commoditymaster: Mapped['Commoditymaster'] = relationship('Commoditymaster', back_populates='commodity_warehouse_map')
    users: Mapped['Users'] = relationship('Users', foreign_keys=[InspectorId], back_populates='commodity_warehouse_map')
    users_: Mapped['Users'] = relationship('Users', foreign_keys=[ManagerId], back_populates='commodity_warehouse_map_')
    seasons: Mapped['Seasons'] = relationship('Seasons', back_populates='commodity_warehouse_map')
    warehouses: Mapped['Warehouses'] = relationship('Warehouses', back_populates='commodity_warehouse_map')


class CropYear(Base):
    __tablename__ = 'crop_year'
    __table_args__ = (
        ForeignKeyConstraint(['Commodity_Id'], ['commoditymaster.IdCommodity'], name='fk_IdCommodityMaster_CommodityId'),
        ForeignKeyConstraint(['Season_Id'], ['seasons.IdSeason'], name='fk_IdSeason_SeasonId'),
        Index('fk_IdCommodityMaster_CommodityId_idx', 'Commodity_Id'),
        Index('fk_IdSeason_SeasonId_idx', 'Season_Id')
    )

    IdCrop_year: Mapped[int] = mapped_column(Integer, primary_key=True)
    Season_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Commodity_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    CropYearName: Mapped[Optional[str]] = mapped_column(String(45))
    Created_At: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    Is_Active: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("'1'"))

    commoditymaster: Mapped['Commoditymaster'] = relationship('Commoditymaster', back_populates='crop_year')
    seasons: Mapped['Seasons'] = relationship('Seasons', back_populates='crop_year')


class Managers(Base):
    __tablename__ = 'managers'
    __table_args__ = (
        ForeignKeyConstraint(['User_Id'], ['users.idusers'], name='fk_userId_Users'),
        Index('fk_userId_Users_idx', 'User_Id')
    )

    Id_Manager: Mapped[int] = mapped_column(Integer, primary_key=True)
    User_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Department: Mapped[Optional[str]] = mapped_column(String(45))

    users: Mapped['Users'] = relationship('Users', back_populates='managers')
    inspections: Mapped[list['Inspections']] = relationship('Inspections', back_populates='managers')


class Remark(Base):
    __tablename__ = 'remark'
    __table_args__ = (
        ForeignKeyConstraint(['Question_Id'], ['questions.id'], name='fk_questionId_IdQuestion'),
        Index('fk_InspectionId__idx', 'InspectionsId'),
        Index('fk_questionId_IdQuestion_idx', 'Question_Id')
    )

    Id_Remark: Mapped[int] = mapped_column(Integer, primary_key=True)
    Question_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    InspectionsId: Mapped[int] = mapped_column(Integer, nullable=False)
    Remarks: Mapped[Optional[str]] = mapped_column(String(45))
    Status: Mapped[Optional[str]] = mapped_column(String(45))
    Is_Active: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("'1'"))

    questions: Mapped['Questions'] = relationship('Questions', back_populates='remark')


class UserWarehouseMap(Base):
    __tablename__ = 'user_warehouse_map'
    __table_args__ = (
        ForeignKeyConstraint(['Manager_id'], ['users.idusers'], name='fk_managerId_IdManager'),
        ForeignKeyConstraint(['Warehouse_id'], ['warehouses.Id_Warehouse'], name='fk_warehouse_id'),
        Index('fk_managerId_IdManager_idx', 'Manager_id'),
        Index('fk_warehouse_id_idx', 'Warehouse_id')
    )

    Id_User_Warehouse_Map: Mapped[int] = mapped_column(Integer, primary_key=True)
    Warehouse_id: Mapped[int] = mapped_column(Integer, nullable=False)
    Manager_id: Mapped[int] = mapped_column(Integer, nullable=False)

    Manager: Mapped['Users'] = relationship('Users', back_populates='user_warehouse_map')
    Warehouse: Mapped['Warehouses'] = relationship('Warehouses', back_populates='user_warehouse_map')


class WarehouseCommodity(Base):
    __tablename__ = 'warehouse_commodity'
    __table_args__ = (
        ForeignKeyConstraint(['CommodityMasterId'], ['commoditymaster.IdCommodity'], name='fk_commodityIdd'),
        ForeignKeyConstraint(['SeasonId'], ['seasons.IdSeason'], name='fk_SeasonIdd'),
        ForeignKeyConstraint(['WarehouseId'], ['warehouses.Id_Warehouse'], name='fk_WarehouseIdd'),
        Index('fk_ManagerIdd_idx', 'Manager_Id'),
        Index('fk_SeasonId_idx', 'SeasonId'),
        Index('fk_WarehouseId_idx', 'WarehouseId'),
        Index('fk_commodityId_idx', 'CommodityMasterId')
    )

    Idwarehouse_commodity: Mapped[int] = mapped_column(Integer, primary_key=True)
    CommodityMasterId: Mapped[int] = mapped_column(Integer, nullable=False)
    SeasonId: Mapped[int] = mapped_column(Integer, nullable=False)
    WarehouseId: Mapped[int] = mapped_column(Integer, nullable=False)
    Manager_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Insert_Date: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    Is_Active: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("'1'"))

    commoditymaster: Mapped['Commoditymaster'] = relationship('Commoditymaster', back_populates='warehouse_commodity')
    seasons: Mapped['Seasons'] = relationship('Seasons', back_populates='warehouse_commodity')
    warehouses: Mapped['Warehouses'] = relationship('Warehouses', back_populates='warehouse_commodity')


class Inspections(Base):
    __tablename__ = 'inspections'
    __table_args__ = (
        ForeignKeyConstraint(['Commodity_Id'], ['commoditymaster.IdCommodity'], name='inspections_ibfk_1'),
        ForeignKeyConstraint(['Inspector_Id'], ['users.idusers'], name='fk_inspectorId_IdUser'),
        ForeignKeyConstraint(['Manager_Id'], ['managers.Id_Manager'], name='fk_managerId'),
        ForeignKeyConstraint(['Warehouse_Id'], ['warehouses.Id_Warehouse'], name='fk_warehouseId_Idwarehouse'),
        Index('Commodity_Id', 'Commodity_Id'),
        Index('fk_SeasonId_IdSeason_idx', 'Season_Id'),
        Index('fk_inspectorId_IdUser_idx', 'Inspector_Id'),
        Index('fk_managerId_IdManager_idx', 'Manager_Id'),
        Index('fk_warehouseId_Idwarehouse_idx', 'Warehouse_Id')
    )

    Id_Inspections: Mapped[int] = mapped_column(Integer, primary_key=True)
    Warehouse_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Inspector_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Manager_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Season_Id: Mapped[int] = mapped_column(Integer, nullable=False)
    Created_At: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    Data: Mapped[Optional[str]] = mapped_column(String(9000))
    Status: Mapped[Optional[str]] = mapped_column(String(45))
    Remarks: Mapped[Optional[str]] = mapped_column(String(45))
    Commodity_Id: Mapped[Optional[int]] = mapped_column(Integer)
    Risk_Score: Mapped[Optional[float]] = mapped_column(Float, server_default=text("'0'"))
    Completed_At: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    Manager_Approved: Mapped[Optional[int]] = mapped_column(TINYINT(1), server_default=text("'0'"))
    Manager_Approved_At: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    Manager_Remarks: Mapped[Optional[str]] = mapped_column(Text)

    commoditymaster: Mapped[Optional['Commoditymaster']] = relationship('Commoditymaster', back_populates='inspections')
    users: Mapped['Users'] = relationship('Users', back_populates='inspections')
    managers: Mapped['Managers'] = relationship('Managers', back_populates='inspections')
    warehouses: Mapped['Warehouses'] = relationship('Warehouses', back_populates='inspections')
    evidence: Mapped[list['Evidence']] = relationship('Evidence', back_populates='inspection')
    inspection_answers: Mapped[list['InspectionAnswers']] = relationship('InspectionAnswers', back_populates='inspection')


class Evidence(Base):
    __tablename__ = 'evidence'
    __table_args__ = (
        ForeignKeyConstraint(['inspection_id'], ['inspections.Id_Inspections'], name='fk_evidence_inspection'),
        ForeignKeyConstraint(['question_id'], ['questions.id'], name='fk_evidence_question'),
        Index('fk_evidence_question', 'question_id'),
        Index('idx_evidence_inspection_id', 'inspection_id')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inspection_id: Mapped[int] = mapped_column(Integer, nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    question_id: Mapped[Optional[int]] = mapped_column(Integer)
    file_type: Mapped[Optional[str]] = mapped_column(String(100))
    uploaded_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    inspection: Mapped['Inspections'] = relationship('Inspections', back_populates='evidence')
    question: Mapped[Optional['Questions']] = relationship('Questions', back_populates='evidence')


class InspectionAnswers(Base):
    __tablename__ = 'inspection_answers'
    __table_args__ = (
        ForeignKeyConstraint(['inspection_id'], ['inspections.Id_Inspections'], ondelete='CASCADE', name='inspection_answers_ibfk_1'),
        ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE', name='inspection_answers_ibfk_2'),
        Index('inspection_id', 'inspection_id'),
        Index('question_id', 'question_id')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inspection_id: Mapped[int] = mapped_column(Integer, nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(String(255))
    remarks: Mapped[Optional[str]] = mapped_column(Text)

    inspection: Mapped['Inspections'] = relationship('Inspections', back_populates='inspection_answers')
    question: Mapped['Questions'] = relationship('Questions', back_populates='inspection_answers')
