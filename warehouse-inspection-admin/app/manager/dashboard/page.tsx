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

  // Combine and sort all inspections by priority (Pending first) and then by date (newest first)
  const allInspections = [...pendingInspections, ...processedInspections]
    .sort((a, b) => {
      // First sort by status (Pending comes first)
      if (a.Status === 'Pending' && b.Status !== 'Pending') return -1;
      if (a.Status !== 'Pending' && b.Status === 'Pending') return 1;
      
      // Then sort by date (newest first)
      return new Date(b.Created_At).getTime() - new Date(a.Created_At).getTime();
    });

  // Format recent activity from all inspections
  const recentActivity = allInspections.slice(0, 5).map(inspection => ({
    id: inspection.Id_Inspections,
    type: 'inspection',
    title: 'Inspection Submitted',
    description: (
      <div className="space-y-1">
        <div className="font-medium">
          {inspection.warehouse.name} - {inspection.commodity?.name || 'No Commodity'}
        </div>
      </div>
    ),
    timestamp: new Date(inspection.Created_At).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    status: inspection.Status,
    icon: inspection.Status === 'Accepted' ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      inspection.Status === 'Rejected' ?
      <XCircle className="h-5 w-5 text-red-500" /> :
      <ClipboardCheck className="h-5 w-5 text-yellow-500" />
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

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {/* Pending Inspections Card */}
        <Card className="border-l-4 border-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center">
              <ClipboardCheck className="h-4 w-4 mr-2 text-yellow-600" />
              Pending Reviews
              {pendingInspections.length > 0 && (
                <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pendingInspections.length} pending
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mt-1"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingInspections.length > 0 ? (
              <div className="space-y-3">
                {pendingInspections.slice(0, 3).map((inspection) => (
                  <a
                    key={inspection.Id_Inspections}
                    href={`/manager/inspections/${inspection.Id_Inspections}`}
                    className="block p-3 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    <p className="text-sm font-medium mb-1">
                      {inspection.warehouse.name} - {inspection.commodity?.name || 'No Commodity'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                      <span className="whitespace-nowrap">
                        {new Date(inspection.Created_At).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </a>
                ))}
                {pendingInspections.length > 3 && (
                  <div className="text-center mt-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/manager/inspections?status=pending">
                        View all pending ({pendingInspections.length})
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
                <p className="mt-2 text-sm text-gray-600">No pending reviews</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accepted Inspections Card */}
        <Card className="border-l-4 border-green-500 hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => window.location.href = '/manager/inspections?status=accepted'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              Accepted
              {processedInspections.filter(i => i.Status === 'Accepted').length > 0 && (
                <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {processedInspections.filter(i => i.Status === 'Accepted').length} total
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mt-1"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : processedInspections.filter(i => i.Status === 'Accepted').length > 0 ? (
              <div className="space-y-3">
                {processedInspections
                  .filter(i => i.Status === 'Accepted')
                  .slice(0, 3)
                  .map((inspection) => (
                    <div 
                      key={inspection.Id_Inspections} 
                      className="p-3 rounded-lg hover:bg-green-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/manager/inspections/${inspection.Id_Inspections}`;
                      }}
                    >
                      <p className="text-sm font-medium mb-1">
                        {inspection.warehouse.name} - {inspection.commodity?.name || 'No Commodity'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          Accepted
                        </span>
                        <span className="whitespace-nowrap">
                          {new Date(inspection.Created_At).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                {processedInspections.filter(i => i.Status === 'Accepted').length > 3 && (
                  <div className="text-center mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      <Link href="/manager/inspections?status=accepted">
                        View all accepted
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No accepted inspections</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rejected Inspections Card */}
        <Card className="border-l-4 border-red-500 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = '/manager/inspections?status=rejected'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Rejected
              {processedInspections.filter(i => i.Status === 'Rejected').length > 0 && (
                <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {processedInspections.filter(i => i.Status === 'Rejected').length} total
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mt-1"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : processedInspections.filter(i => i.Status === 'Rejected').length > 0 ? (
              <div className="space-y-3">
                {processedInspections
                  .filter(i => i.Status === 'Rejected')
                  .slice(0, 3)
                  .map((inspection) => (
                    <div 
                      key={inspection.Id_Inspections} 
                      className="p-3 rounded-lg hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/manager/inspections/${inspection.Id_Inspections}`;
                      }}
                    >
                      <p className="text-sm font-medium mb-1">
                        {inspection.warehouse.name} - {inspection.commodity?.name || 'No Commodity'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                        <span className="whitespace-nowrap">
                          {new Date(inspection.Created_At).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                {processedInspections.filter(i => i.Status === 'Rejected').length > 3 && (
                  <div className="text-center mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Link href="/manager/inspections?status=rejected">
                        View all rejected
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No rejected inspections</p>
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
              {/* <Link href="/manager/reports">
                <FileText className="h-4 w-4" />
                Generate Report
              </Link> */}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
