"use client"

import { MobileSidebar } from "./sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Shimmer } from "@/components/ui/shimmer"

export function Header() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard"
      case "/manager/inspections":
        return "Pending Inspections"
      case "/manager/reviewed":
        return "Reviewed Inspections"
      case "/manager/mappings":
        return "Inspector Mapping"
      case "/manager/inspectors":
        return "Inspectors"
      case "/inspector/dashboard":
        return "Inspector Dashboard"
      case "/inspector/inspections":
        return "My Inspections"
      case "/warehouses":
        return "Warehouses"
      case "/commodities":
        return "Commodities"
      case "/admin/users":
        return "Users"
      case "/admin/user-warehouse":
        return "User-Warehouse Map"
      case "/admin/warehouse-commodity":
        return "Warehouse-Commodity Map"
      default:
        return "Dashboard"
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-gray-100 shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <MobileSidebar />
        <div className="flex-1">
          {isLoading ? (
            <Shimmer className="h-6 w-48 bg-gray-200 rounded" />
          ) : (
            <h1 className="text-lg font-semibold md:text-xl text-gray-800">
              {getPageTitle()}
            </h1>
          )}
        </div>
      </div>
    </header>
  )
}
