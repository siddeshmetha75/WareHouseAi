// TypeScript types for Warehouse Inspection Admin Panel

export type UserRole = "Admin" | "Inspector" | "Manager"

export type InspectionStatus = "Pending" | "In Progress" | "Completed" | "Failed"

export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

export type InspectionResponse = "Pass" | "Fail" | "N/A"

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: UserRole
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Warehouse {
  id: number
  name: string
  location: string
  address?: string
  managerId?: number
  manager?: User
  capacityTons: number
  currentStockTons: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Commodity {
  id: number
  Commodity_Name: string
  Category?: string
  Description?: string
  Unit: string
  IsActive: boolean
  CreatedAt: string
  Storage?: string
}

export interface InspectionChecklist {
  id: number
  name: string
  description?: string
  commodityId?: number
  commodity?: Commodity
  isActive: boolean
  createdAt: string
  items?: ChecklistItem[]
}

export interface ChecklistItem {
  id: number
  checklistId: number
  itemText: string
  riskLevel: RiskLevel
  isRequired: boolean
  orderIndex: number
  createdAt: string
}

export interface Inspection {
  id: number
  warehouseId: number
  warehouse?: Warehouse
  commodityId: number
  commodity?: Commodity
  inspectorId: number
  inspector?: User
  checklistId: number
  checklist?: InspectionChecklist
  inspectionDate: string
  status: InspectionStatus
  overallScore?: number
  notes?: string
  createdAt: string
  updatedAt: string
  responses?: InspectionResponseData[]
  files?: InspectionFile[]
}

export interface InspectionResponseData {
  id: number
  inspectionId: number
  checklistItemId: number
  checklistItem?: ChecklistItem
  response: InspectionResponse
  notes?: string
  evidenceFiles?: string[]
  createdAt: string
}

export interface InspectionFile {
  id: number
  inspectionId: number
  fileName: string
  filePath: string
  fileType?: string
  fileSize?: number
  uploadedBy: number
  uploader?: User
  createdAt: string
}

// Dashboard statistics types
export interface DashboardStats {
  totalInspections: number
  pendingInspections: number
  completedInspections: number
  inProgressInspections: number
  totalWarehouses: number
  activeInspectors: number
  activeManagers: number
  averageScore: number
  recentInspections: Inspection[]
}

// Form types
export interface CreateUserForm {
  username: string
  email: string
  password: string
  fullName: string
  role: UserRole
  phone?: string
  isActive?: boolean
  supervisorId?: number
}

export interface CreateWarehouseForm {
  name: string
  location: string
  address?: string
  managerId?: number
  capacityTons: number
}

export interface CreateInspectionForm {
  warehouseId: number
  commodityId: number
  checklistId: number
  inspectionDate: string
  notes?: string
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
