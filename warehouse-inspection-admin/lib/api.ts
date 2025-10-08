import type { DashboardStats, Warehouse, Commodity } from "@/lib/types"
import api from "./api-client"

export type { Warehouse, Commodity } from "@/lib/types"

export async function login(email: string, password: string, customToken: string = "MyCustomToken") {
  try {
    const { data } = await api.post(
      "/auth/login",
      { EmailId: email, Password: password },
      { headers: { Authorization: `Bearer ${customToken}` } }
    )
    if (data?.token) {
      localStorage.setItem("token", data.token)
    }
    return data
  } catch (error: any) {
    // Enhanced error handling for login
    if (error.response?.status === 401) {
      throw new Error("Invalid email or password. Please check your credentials and try again.")
    } else if (error.response?.status === 404) {
      throw new Error("No account found with this email address.")
    } else if (error.response?.status === 403) {
      throw new Error("Your account has been disabled. Please contact support.")
    } else if (error.response?.status >= 500) {
      throw new Error("Server error. Please try again later.")
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Request timeout. Please check your internet connection and try again.")
    } else if (!error.response) {
      throw new Error("Network error. Please check your internet connection and try again.")
    } else {
      throw new Error(error.response?.data?.message || "Login failed. Please try again.")
    }
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const [inspectionsRes, warehousesRes, inspectorsRes, managersRes, averageRes] = await Promise.all([
      api.get("/inspections/counts").catch(() => ({ data: { TotalInspections: 0, Pending: 0, Accepted: 0, Rejected: 0 } })),
      api.get("/warehouses/count").catch(() => ({ data: { count: 0 } })),
      api.get("/inspectors/count").catch(() => ({ data: { count: 0 } })),
      api.get("/managers/count").catch(() => ({ data: { count: 0 } })),
      api.get("/inspections/average").catch(() => ({ data: { average: 0 } })),
    ])

    const totalInspections = inspectionsRes.data?.TotalInspections ?? 0
    const pendingInspections = inspectionsRes.data?.Pending ?? 0
    const completedInspections = inspectionsRes.data?.Accepted ?? 0
    const inProgressInspections = inspectionsRes.data?.Rejected ?? 0
    const totalWarehouses = warehousesRes.data?.count ?? 0
    const activeInspectors = inspectorsRes.data?.count ?? 0
    const activeManagers = managersRes.data?.count ?? 0
    const averageScore = averageRes.data?.average ?? 0

    return {
      totalInspections,
      pendingInspections,
      completedInspections,
      inProgressInspections,
      totalWarehouses,
      activeInspectors,
      activeManagers,
      averageScore,
      recentInspections: [],
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values in case of error
    return {
      totalInspections: 0,
      pendingInspections: 0,
      completedInspections: 0,
      inProgressInspections: 0,
      totalWarehouses: 0,
      activeInspectors: 0,
      activeManagers: 0,
      averageScore: 0,
      recentInspections: [],
    }
  }
}

export async function fetchInspectorWarehouses(inspectorId: number): Promise<ApiWarehouse[]> {
  try {
    console.log('Fetching warehouses for inspector ID:', inspectorId)

    // Try to get warehouses directly assigned to inspector via user-warehouse mapping
    const userWarehouseMaps = await getUserWarehouseMaps()
    console.log('User warehouse maps:', userWarehouseMaps)

    const inspectorMappings = userWarehouseMaps.filter(mapping => mapping.User_id === inspectorId)
    console.log('Inspector mappings found:', inspectorMappings.length)

    if (inspectorMappings.length > 0) {
      const warehouseIds = inspectorMappings.map(mapping => mapping.Warehouse_id)
      console.log('Warehouse IDs from user mappings:', warehouseIds)

      // Get all warehouses and filter by IDs instead of calling getWarehouse individually
      const allWarehouses = await getWarehouses()
      const warehouses = allWarehouses.filter(warehouse =>
        warehouseIds.includes(warehouse.Id_Warehouse)
      )
      console.log('Warehouses from user mappings:', warehouses)
      return warehouses
    }

    // Fallback: Get warehouses through commodity-warehouse mappings
    const mappings = await getAllCommodityWarehouseMaps()
    console.log('All commodity warehouse mappings:', mappings)

    const inspectorMappings2 = mappings.filter(mapping => mapping.InspectorId === inspectorId)
    console.log('Inspector commodity mappings found:', inspectorMappings2.length)

    const warehouseIds2 = [...new Set(inspectorMappings2.map(mapping => mapping.WarehouseId))]
    console.log('Warehouse IDs from commodity mappings:', warehouseIds2)

    if (warehouseIds2.length === 0) {
      console.log('No warehouses found for inspector ID:', inspectorId)
      return [] // No warehouses assigned to this inspector
    }

    // Get all warehouses and filter by IDs
    const allWarehouses2 = await getWarehouses()
    const warehouses2 = allWarehouses2.filter(warehouse =>
      warehouseIds2.includes(warehouse.Id_Warehouse)
    )
    console.log('Warehouses from commodity mappings:', warehouses2)

    return warehouses2
  } catch (error) {
    console.error('Error fetching inspector warehouses:', error)
    throw new Error('Failed to load assigned warehouses')
  }
}

// Questions / Inspections
export interface ApiQuestion {
  id: number
  text: string
  category?: string | null
  risk_weight?: number | null
}

export async function getQuestions(): Promise<ApiQuestion[]> {
  const { data } = await api.get<ApiQuestion[]>("/api/questions")
  // Map backend field text_ -> text if necessary
  return data.map((q: any) => ({ id: q.id, text: q.text ?? q.text_ ?? "", category: q.category, risk_weight: q.risk_weight }))
}

export async function createInspectionWithAnswers(payload: {
  warehouse_id: number
  commodity_id: number
  inspector_id: number
  Season_Id?: number
  answers: Array<{ question_id: number; answer?: string; remarks?: string }>
}): Promise<{ inspection_id: number; saved_answers: number }> {
  // Map to backend-expected PascalCase keys
  const mapped = {
    // PascalCase
    WarehouseId: payload.warehouse_id,
    CommodityId: payload.commodity_id,
    InspectorId: payload.inspector_id,
    ...(payload.Season_Id ? { Season_Id: payload.Season_Id, SeasonId: payload.Season_Id } : {}),
    Answers: payload.answers.map((a) => ({
      Question_Id: a.question_id,
      Answer: a.answer ?? "",
      Remarks: a.remarks ?? "",
    })),
    // snake_case duplicates for compatibility
    warehouse_id: payload.warehouse_id,
    commodity_id: payload.commodity_id,
    inspector_id: payload.inspector_id,
    ...(payload.Season_Id ? { season_id: payload.Season_Id } : {}),
    answers: payload.answers.map((a) => ({
      question_id: a.question_id,
      answer: a.answer ?? "",
      remarks: a.remarks ?? "",
    })),
  }
  const { data } = await api.post(`/api/inspections`, mapped)
  // Normalize to expected shape
  return {
    inspection_id: data?.inspection_id ?? data?.Id_Inspections ?? data?.id,
    saved_answers: data?.saved_answers ?? payload.answers.length,
  }
}

export interface EvidenceUploadResponse {
  id: number
  file_url: string
  file_type: string
  question_id: number
  inspection_id: number
}

export async function uploadEvidence(inspectionId: number, file: File, questionId: number): Promise<EvidenceUploadResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("questionId", questionId.toString())
  formData.append("QuestionId", questionId.toString())
  formData.append("question_id", questionId.toString())
  
  // Provide file_type if backend validates it
  if (file.type) formData.append("file_type", file.type)
  
  const { data } = await api.post(`/api/inspections/${inspectionId}/evidence`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return data
}

export async function deleteEvidence(inspectionId: number, evidenceId: number): Promise<void> {
  try {
    await api.delete(`/api/inspections/${inspectionId}/evidence/${evidenceId}`)
  } catch (error) {
    console.error('Failed to delete evidence:', error)
    throw new Error('Failed to delete evidence. Please try again.')
  }
}

// Commodity-Warehouse mappings for inspector and warehouse
export interface ApiCommodityWarehouseMap {
  Id_CommodityWarehouseMap: number
  WarehouseId: number
  ManagerId: number
  InspectorId: number
  CommodityId: number
  SeasonId: number
  Is_Active: number
  CommodityName: string
  SeasonName: string
}

export async function getCommodityWarehouseMappings(warehouseId: number, inspectorId: number): Promise<ApiCommodityWarehouseMap[]> {
  const { data } = await api.get<ApiCommodityWarehouseMap[]>(
    "/commodity-warehouse-map/filter/by-warehouse-inspector",
    { params: { warehouseId, inspectorId } }
  )
  return data
}

export interface ApiEntityRef { id?: number | null; name?: string | null }
export interface ApiInspectorRef { id?: number | null; username?: string | null; full_name?: string | null }
export interface ApiInspectionSummary {
  Id_Inspections: number
  warehouse?: ApiEntityRef | null
  commodity?: ApiEntityRef | null
  inspector?: ApiInspectorRef | null
  Created_At: string
  Status: string
  Remarks?: string
  Manager_Remarks?: string
}

export async function listInspections(params?: { pending_only?: boolean; inspector_id?: number; status?: string }) {
  const { data } = await api.get<ApiInspectionSummary[]>(`/api/inspections`, { params })
  return data
}

export async function getInspectionDetail(inspectionId: number) {
  const { data } = await api.get(`/api/inspections/${inspectionId}`)
  const raw: any = data

  // Fetch manager remarks separately
  let managerRemarks: any[] = []
  try {
    const remarksResponse = await api.get(`/remarks/by-inspection/${inspectionId}`)
    managerRemarks = remarksResponse.data.remarks || []
  } catch (error) {
    // If remarks endpoint fails, continue with empty array
    console.warn('Failed to fetch manager remarks:', error)
  }

  // Build inspection object expected by UI
  const inspection = {
    id: raw.Id_Inspections ?? raw.id,
    warehouse: raw.warehouse ?? raw.Warehouse ?? null,
    commodity: raw.commodity ?? raw.Commodity ?? null,
    inspector: raw.inspector ?? raw.Inspector ?? null,
    status: (raw.status ?? raw.Status ?? "").toString(),
    manager_remarks: raw.manager_remarks ?? raw.Manager_Remarks ?? null,
    Season_Id: raw.Season?.id ?? raw.Season_Id ?? null,
    SeasonName: raw.Season?.name ?? raw.SeasonName ?? null,
  } as {
    id: number
    warehouse?: ApiEntityRef | null
    commodity?: ApiEntityRef | null
    inspector?: ApiInspectorRef | null
    status: "Pending" | "Accepted" | "Rejected" | string
    manager_remarks?: string | null
    Season_Id?: number | null
    SeasonName?: string | null
  }

  // Helper to convert backend file_path to public file_url
  const toFileUrl = (file_path?: string | null) => {
    if (!file_path) return undefined
    try {
      const name = file_path.split(/\\|\//).pop() || ""
      return `http://127.0.0.1:8000/uploads/${encodeURIComponent(name)}`
    } catch {
      return undefined
    }
  }

  // Build answers array from per_answers if UI-style answers missing
  const answers = (raw.answers as any[] | undefined) ??
    ((raw.per_answers as any[] | undefined)?.map((a) => {
      // Find manager remarks for this question
      const questionManagerRemarks = managerRemarks.find((r) => r.Question_Id === (a.question_id ?? a.Question_Id))
      
      // Extract inspector remarks - completely ignore any manager remarks from main API
      let inspectorRemarks = null
      let originalRemarks = null
      
      // Primary source: a.remarks as string (original inspector remarks)
      if (typeof a.remarks === 'string') {
        inspectorRemarks = a.remarks
        originalRemarks = a.remarks
      } 
      // Secondary source: a.remarks as object with Remarks/remarks property
      else if (typeof a.remarks === 'object' && a.remarks !== null && !Array.isArray(a.remarks)) {
        inspectorRemarks = a.remarks.Remarks || a.remarks.remarks || null
        originalRemarks = a.remarks
      }
      // Tertiary source: look for inspector remarks in dedicated fields
      else if (a.inspector_remarks || a.Inspector_Remarks) {
        inspectorRemarks = a.inspector_remarks || a.Inspector_Remarks || null
        originalRemarks = a.remarks
      }
      // If a.remarks is an array, it's manager remarks from backend - ignore it for inspector remarks
      else if (Array.isArray(a.remarks)) {
        // Look for inspector remarks in other fields, but NOT in a.remarks array
        inspectorRemarks = a.inspector_remarks || a.Inspector_Remarks || a.original_remarks || null
        originalRemarks = null // Don't show manager remarks array in "Additional Remarks"
      }
      // Final fallback
      else {
        inspectorRemarks = a.inspector_remarks || a.Inspector_Remarks || a.original_remarks || null
        originalRemarks = a.remarks
      }
      
      return {
        question_id: a.question_id ?? a.Question_Id,
        question_text: a.question_text ?? a.Question_Text ?? "",
        answer: a.answer ?? null,
        // Extract inspector remarks from various possible fields
        inspector_remarks: inspectorRemarks,
        // Also preserve the original remarks field for additional display
        remarks: originalRemarks,
        // Map manager remarks from remarks table (this takes precedence over a.remarks array)
        manager_remarks: questionManagerRemarks ? [{
          status: questionManagerRemarks.Status,
          manager_remarks: questionManagerRemarks.Remarks
        }] : [],
        evidence: (a.evidence || []).map((ev: any) => ({
          id: ev.id,
          file_url: toFileUrl(ev.file_path),
          file_type: ev.file_type,
        })),
      }
    }) ?? [])

  // Build top-level evidence array
  const evidence = ((raw.evidence as any[] | undefined) ?? []).map((ev) => ({
    id: ev.id,
    file_url: toFileUrl(ev.file_path),
    file_type: ev.file_type,
  }))

  return { inspection, answers, evidence }
}

export async function reviewInspection(
  inspectionId: number,
  payload: { status: "Accepted" | "Rejected"; manager_remarks?: string }
) {
  const { data } = await api.put(`/api/inspections/${inspectionId}/review`, payload)
  return data
}

// Manager per-question remark
export interface CreateRemarkPayload {
  Question_Id: number
  Remarks?: string
  Status?: string
  InspectionsId?: number
}

export async function createRemark(payload: CreateRemarkPayload) {
  const { data } = await api.post(`/remarks/`, payload)
  return data
}

export interface InspectionRemarksResponse {
  Id_Inspections: number
  Status: string
  Remarks: string | null
  remarks: Array<{
    Question_Id: number
    Remarks: string | null
    Status: string | null
    Id_Remark: number
    InspectionsId: number
  }>
}

export async function getInspectionRemarks(inspectionId: number): Promise<InspectionRemarksResponse> {
  const { data } = await api.get(`/remarks/by-inspection/${inspectionId}`)
  return data as InspectionRemarksResponse
}

export async function updateRemark(remarkId: number, payload: Partial<CreateRemarkPayload>) {
  const { data } = await api.put(`/remarks/${remarkId}`, payload)
  return data
}

// Update inspection details (answers/remarks/status) for editing flow
export async function updateInspectionDetails(
  inspectionId: number,
  payload: any
) {
  const { data } = await api.put(`/inspectionsDetails/${inspectionId}`, payload)
  return data
}

export async function getManagerInspectors(managerId: number) {
  const { data } = await api.get(`/api/managers/${managerId}/inspectors`)
  return data as Array<{ id: number; UserName?: string; Full_Name?: string; EmailId?: string; Role?: string }>
}

export async function getManagerInspections(managerId: number, status?: "Pending" | "Accepted" | "Rejected") {
  const { data } = await api.get(`/api/managers/${managerId}/inspections`, { params: { status } })
  return data as ApiInspectionSummary[]
}

export interface ApiWarehouse {
  Id_Warehouse: number
  Warehouse_Name: string
  Location: string | null
  Code: string | null
  Capacity?: number | null
  Latitude?: number | null
  Longitude?: number | null
  Inventory?: string | null
}

export interface CreateApiWarehouse {
  Warehouse_Name: string
  Location?: string
  Code?: string
  Capacity?: number
  Latitude?: number
  Longitude?: number
  Inventory?: string
}

export async function getWarehouses(): Promise<ApiWarehouse[]> {
  const { data } = await api.get<ApiWarehouse[]>("/warehouses")
  return data
}

export async function getWarehouse(id: number): Promise<ApiWarehouse> {
  const { data } = await api.get<ApiWarehouse>(`/warehouses/${id}`)
  return data
}

export async function createWarehouse(payload: CreateApiWarehouse): Promise<ApiWarehouse> {
  const { data } = await api.post<ApiWarehouse>("/warehouses", payload)
  return data
}

export async function updateWarehouse(id: number, payload: CreateApiWarehouse): Promise<ApiWarehouse> {
  const { data } = await api.put<ApiWarehouse>(`/warehouses/${id}`, payload)
  return data
}

export async function deleteWarehouse(id: number): Promise<void> {
  await api.delete(`/warehouses/${id}`)
}

export interface ApiUser {
  idusers: number
  UserName: string
  Full_Name: string | null
  Role: string
  EmailId: string | null
  Is_Active: number | null
  UserId?: number | null
  Password?: string | null
}

export interface CreateApiUser {
  UserName: string
  Full_Name?: string
  Role: string
  EmailId?: string
  Password: string
  Is_Active?: number
  UserId?: number
}

export interface UpdateApiUser {
  UserName?: string
  Full_Name?: string
  Role?: string
  EmailId?: string
  Password?: string
  Is_Active?: number
  UserId?: number
}

export async function getUsers(params?: { role?: string; active?: number }): Promise<ApiUser[]> {
  const { data } = await api.get<ApiUser[]>("/users/", { params })
  return data
}

export async function getUser(id: number): Promise<ApiUser> {
  const { data } = await api.get<ApiUser>(`/users/${id}`)
  return data
}

export async function createUser(payload: CreateApiUser): Promise<ApiUser> {
  const { data } = await api.post<ApiUser>("/users/", payload)
  return data
}

export async function updateUser(id: number, payload: UpdateApiUser): Promise<ApiUser> {
  const { data } = await api.put<ApiUser>(`/users/${id}`, payload)
  return data
}

// User-Warehouse mapping
export interface ApiUserWarehouseMap {
  Id_User_Warehouse_Map: number
  User_id?: number  // Optional since not in database model
  Warehouse_id: number
  Manager_id: number
  UserName?: string | null
  UserFullName?: string | null
  ManagerName?: string | null
  ManagerFullName?: string | null
  WarehouseName?: string | null
}

export interface CreateUserWarehouseMap {
  User_id?: number  // Optional for manager-warehouse mappings
  Warehouse_id: number
  Manager_id: number
}

export interface UpdateUserWarehouseMap {
  User_id?: number
  Warehouse_id?: number
  Manager_id?: number
}

export async function getUserWarehouseMaps(): Promise<ApiUserWarehouseMap[]> {
  const { data } = await api.get<ApiUserWarehouseMap[]>("/user-warehouse/")
  return data
}

export async function createUserWarehouseMap(payload: CreateUserWarehouseMap): Promise<ApiUserWarehouseMap> {
  const { data } = await api.post<ApiUserWarehouseMap>("/user-warehouse/", payload)
  return data
}

export async function updateUserWarehouseMap(id: number, payload: UpdateUserWarehouseMap): Promise<ApiUserWarehouseMap> {
  const { data } = await api.put<ApiUserWarehouseMap>(`/user-warehouse/${id}`, payload)
  return data
}

export async function deleteUserWarehouseMap(id: number): Promise<void> {
  await api.delete(`/user-warehouse/${id}`)
}

export async function deleteUserAccount(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}

// Alias matching existing imports in UI
export async function deleteUser(id: number): Promise<void> {
  return deleteUserAccount(id)
}

export interface ApiCommodity {
  IdCommodity: number
  Commodity_Name: string
  CommodityStorage: string | null
  Category?: string | null
  Description?: string | null
  IsActive?: number | null
  CreatedAt?: string | null
}

export interface CreateApiCommodity {
  Commodity_Name: string
  CommodityStorage?: string
  Category?: string
  Description?: string
  IsActive?: number
}

export interface UpdateApiCommodity extends Partial<CreateApiCommodity> {}

export async function getCommodities(params?: { name?: string; category?: string; storage?: string; active?: number }): Promise<ApiCommodity[]> {
  const { data } = await api.get<ApiCommodity[]>("/commodities", { params })
  return data
}

export async function createCommodity(payload: CreateApiCommodity): Promise<ApiCommodity> {
  const { data } = await api.post<ApiCommodity>("/commodities", payload)
  return data
}

export async function updateCommodity(id: number, payload: UpdateApiCommodity): Promise<ApiCommodity> {
  const { data } = await api.put<ApiCommodity>(`/commodities/${id}`, payload)
  return data
}
export async function deleteCommodity(id: number): Promise<void> {
  await api.delete(`/commodities/${id}`)
}

// Seasons
export interface ApiSeason {
  IdSeason: number
  Season_Name: string
}

export async function getSeasons(): Promise<ApiSeason[]> {
  const { data } = await api.get<ApiSeason[]>(`/seasons`)
  return data
}

// Warehouse Commodity Mappings for Manager
export interface CreateWarehouseCommodityPayload {
  CommodityMasterId: number
  SeasonId: number
  WarehouseId: number
  Manager_Id: number
}

export interface ApiWarehouseCommodity {
  CommodityMasterId: number
  SeasonId: number
  WarehouseId: number
  Manager_Id: number
  Idwarehouse_commodity: number
  Insert_Date: string
  Is_Active: number
  WarehouseName: string
  CommodityName: string
  SeasonName: string
  ManagerName: string
}

export async function getWarehousesByManager(managerId: number): Promise<ApiWarehouse[]> {
  const { data } = await api.get<ApiWarehouse[]>(`/warehouses/by-manager/${managerId}`)
  return data
}

export async function createWarehouseCommodity(payload: CreateWarehouseCommodityPayload): Promise<ApiWarehouseCommodity> {
  const { data } = await api.post<ApiWarehouseCommodity>('/warehousecommodity/', payload)
  return data
}

export async function getWarehouseCommodities(): Promise<ApiWarehouseCommodity[]> {
  const { data } = await api.get<ApiWarehouseCommodity[]>('/warehousecommodity/')
  return data
}

export interface CreateCommodityWarehouseMapPayload {
  WarehouseId: number
  ManagerId: number
  InspectorId: number
  CommodityId: number
  SeasonId: number
  Is_Active?: number
}

// Commodity-Warehouse Map CRUD (manager-inspector mapping with commodity & season)
export interface ApiCommodityWarehouseMapAll {
  Id_CommodityWarehouseMap: number
  WarehouseId: number
  ManagerId: number
  InspectorId: number
  CommodityId: number
  SeasonId: number
  Is_Active: number | null
}

export async function getAllCommodityWarehouseMaps(): Promise<ApiCommodityWarehouseMapAll[]> {
  const { data } = await api.get<ApiCommodityWarehouseMapAll[]>(`/commodity-warehouse-map/`)
  return data
}

export async function deleteCommodityWarehouseMap(id: number): Promise<void> {
  await api.delete(`/commodity-warehouse-map/${id}`)
}

export async function updateCommodityWarehouseMap(
  id: number,
  payload: Partial<CreateCommodityWarehouseMapPayload>
): Promise<ApiCommodityWarehouseMapAll> {
  const { data } = await api.put<ApiCommodityWarehouseMapAll>(`/commodity-warehouse-map/${id}`, payload)
  return data
}