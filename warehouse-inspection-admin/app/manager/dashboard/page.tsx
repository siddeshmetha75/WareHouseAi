"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users,
  PlusCircle,
  FileText,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Loader2,
  Settings,
  BarChart2,
  Calendar,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Inspection {
  Id_Inspections: number;
  warehouse: {
    id: number;
    name: string;
  };
  commodity: {
    id: number;
    name: string;
  } | null;
  inspector: {
    id: number;
    username: string;
    full_name: string;
  };
  Created_At: string;
  Status: string;
  Remarks: string | null;
  Manager_Remarks: string | null;
  Season_Id: number;
  SeasonName: string;
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [pendingInspections, setPendingInspections] = useState<Inspection[]>([])
  const [processedInspections, setProcessedInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInspections = async (endpoint: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch data');
      }

      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [pending, processed] = await Promise.all([
          fetchInspections('inspections?pending_only=true'),
          fetchInspections('inspections?status=Accepted,Rejected')
        ]);

        setPendingInspections(pending);
        setProcessedInspections(processed);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [])

  // Calculate statistics
  const stats = {
    pendingReviews: pendingInspections.length,
    acceptedInspections: processedInspections.filter(i => i.Status === 'Accepted').length,
    rejectedInspections: processedInspections.filter(i => i.Status === 'Rejected').length,
    totalInspections: pendingInspections.length + processedInspections.length
  };

  // Combine and sort all inspections by date for recent activity
  const allInspections = [...pendingInspections, ...processedInspections]
    .sort((a, b) => new Date(b.Created_At).getTime() - new Date(a.Created_At).getTime());

  // Format recent activity from all inspections
  const recentActivity = allInspections.slice(0, 5).map(inspection => ({
    id: inspection.Id_Inspections,
    type: 'inspection',
    title: 'Inspection Submitted',
    description: `${inspection.warehouse.name} - ${inspection.commodity?.name || 'No Commodity'}`,
    timestamp: new Date(inspection.Created_At).toLocaleString(),
    icon: inspection.Status === 'Accepted' ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      inspection.Status === 'Rejected' ?
      <XCircle className="h-5 w-5 text-red-500" /> :
      <ClipboardCheck className="h-5 w-5 text-blue-500" />
  }));
  
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || 'Manager'}
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/manager/inspections">
            <ListChecks className="mr-2 h-4 w-4" />
            View All Inspections
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Reviews
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                <p className="text-xs text-muted-foreground">
                  Waiting for your review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Accepted
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.acceptedInspections}</div>
                <p className="text-xs text-muted-foreground">
                  Completed inspections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rejected
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejectedInspections}</div>
                <p className="text-xs text-muted-foreground">
                  Needs revision
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total
                </CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInspections}</div>
                <p className="text-xs text-muted-foreground">
                  All time inspections
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest inspection updates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mt-1"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <XCircle className="mx-auto h-8 w-8 text-red-400" />
                <p className="mt-2 text-sm text-red-600">Failed to load activity</p>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="pt-1">
                      {activity.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <ClipboardCheck className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks and quick links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover:bg-green-50 hover:text-green-700 transition-colors"
              asChild
            >
              <Link href="/manager/inspections">
                <ClipboardCheck className="h-4 w-4" />
                Review Pending
                {stats.pendingReviews > 0 && (
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {stats.pendingReviews} new
                  </span>
                )}
              </Link>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              asChild
            >
              <Link href="/manager/inspectors">
                <Users className="h-4 w-4" />
                View Inspectors
              </Link>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              asChild
            >
              <Link href="/manager/reports">
                <FileText className="h-4 w-4" />
                Generate Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
