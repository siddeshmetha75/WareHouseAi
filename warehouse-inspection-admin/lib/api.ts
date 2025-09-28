import type { DashboardStats } from "@/lib/types"
import type { Warehouse } from "@/lib/types"
import type { Commodity } from "@/lib/types"
import axios from "axios"

const api = axios.create({ baseURL: "http://127.0.0.1:8000" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("warehouse_auth_token")
  if (token) {
    config.headers = config.headers ?? {}
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { EmailId: email, Password: password })
  if (data?.token) localStorage.setItem("token", data.token)
  return data
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [inspectionsRes, warehousesRes, inspectorsRes, managersRes, averageRes] = await Promise.all([
    api.get("/inspections/counts"),
    api.get("/warehouses/count"),
    api.get("/inspectors/count"),
    api.get("/managers/count"),
    api.get("/inspections/average"),
  ])

  return {
    totalInspections: inspectionsRes.data.TotalInspections,
    pendingInspections: inspectionsRes.data.Pending,
    completedInspections: inspectionsRes.data.Completed,
    inProgressInspections: inspectionsRes.data.InProgress,
    totalWarehouses: warehousesRes.data.count,
    activeInspectors: inspectorsRes.data.count,
    activeManagers: managersRes.data.count,
    averageScore: averageRes.data.average,
    recentInspections: [],
  }
}

export async function fetchInspectorWarehouses(inspectorId: number): Promise<Warehouse[]> {
  const { data } = await api.get(`/api/warehouses`, { params: { inspector_id: inspectorId } })
  return data
}

export async function fetchCommodities(): Promise<Commodity[]> {
  const { data } = await api.get("/commodities")
  return data.map((c: any) => ({
    id: c.IdCommodity,
    Commodity_Name: c.Commodity_Name,
    Storage: c.CommodityStorage,
    Category: c.Category || "",
    Description: c.Description || "",
    Unit: c.Unit || "Kg",
    IsActive: true,
    CreatedAt: new Date().toISOString(),
  }))
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
  const { data } = await api.post(`/api/inspections`, payload)
  return data
}
//   return data
// }
export async function uploadEvidence(inspectionId: number, file: File, questionId: number) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("question_id", questionId.toString());
  return api.post(`/api/inspections/${inspectionId}/evidence`, formData);
}

export async function deleteEvidence(inspectionId: number, evidenceId: number) {
  await api.delete(`/api/inspections/${inspectionId}/evidence/${evidenceId}`)
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
    ((raw.per_answers as any[] | undefined)?.map((a) => ({
      question_id: a.question_id ?? a.Question_Id,
      question_text: a.question_text ?? a.Question_Text ?? "",
      answer: a.answer ?? null,
      // If remarks is an array of remark entries, collapse to string if needed
      remarks: Array.isArray(a.remarks)
        ? (a.remarks.find((r: any) => !!r?.manager_remarks)?.manager_remarks ?? null)
        : (a.manager_remarks ?? a.Remarks ?? a.remarks ?? null),
      evidence: (a.evidence || []).map((ev: any) => ({
        id: ev.id,
        file_url: toFileUrl(ev.file_path),
        file_type: ev.file_type,
      })),
    })) ?? [])

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
}

export interface CreateApiUser {
  UserName: string
  Full_Name?: string
  Role: string
  EmailId?: string
  Password: string
  Is_Active?: number
}

export interface UpdateApiUser {
  UserName?: string
  Full_Name?: string
  Role?: string
  EmailId?: string
  Password?: string
  Is_Active?: number
}

export async function getUsers(params?: { role?: string; active?: number }): Promise<ApiUser[]> {
  const { data } = await api.get<ApiUser[]>("/users/", { params })
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

export async function deleteUserAccount(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
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