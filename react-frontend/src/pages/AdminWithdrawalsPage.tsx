import { useEffect, useState } from "react"
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wallet
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/services/api"
import Layout from "@/components/Layout"

interface WithdrawalRequest {
  id: number;
  amount: number;
  phone_number: string;
  status: string;
  source: string;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  remarks: string | null;
  created_at: string;
  processed_at: string | null;
  marketer?: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
  };
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 })

  useEffect(() => {
    fetchWithdrawals()
  }, [currentPage, statusFilter])

  const fetchWithdrawals = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/admin/withdrawal_requests", {
        params: {
          status: statusFilter,
          page: currentPage,
          limit: 20
        }
      })
      
      let data: WithdrawalRequest[] = []
      let totalCount = 0
      
      if (Array.isArray(response.data)) {
        data = response.data as WithdrawalRequest[]
        totalCount = data.length
      } else if (response.data?.records) {
        data = response.data.records as WithdrawalRequest[]
        totalCount = response.data.totalRecords || data.length
      }
      
      setWithdrawals(data)
      setTotal(totalCount)
      setTotalPages(Math.ceil(totalCount / 20))
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error)
      toast.error("Failed to load withdrawal requests")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/withdrawal_requests", {
        params: { status: "pending", page: 1, limit: 1 }
      })
      const pending = response.data?.totalRecords || (Array.isArray(response.data) ? response.data.length : 0)
      
      const procResponse = await api.get("/admin/withdrawal_requests", {
        params: { status: "processing", page: 1, limit: 1 }
      })
      const processing = procResponse.data?.totalRecords || (Array.isArray(procResponse.data) ? procResponse.data.length : 0)
      
      const compResponse = await api.get("/admin/withdrawal_requests", {
        params: { status: "completed", page: 1, limit: 1 }
      })
      const completed = compResponse.data?.totalRecords || (Array.isArray(compResponse.data) ? compResponse.data.length : 0)
      
      const failResponse = await api.get("/admin/withdrawal_requests", {
        params: { status: "failed", page: 1, limit: 1 }
      })
      const failed = failResponse.data?.totalRecords || (Array.isArray(failResponse.data) ? failResponse.data.length : 0)
      
      setStats({ pending, processing, completed, failed })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const processWithdrawal = async (id: number, action: "approve" | "reject") => {
    setIsProcessing(id)
    try {
      const response = await api.post(`/admin/withdrawals/${id}/process`, { action })
      
      if (response.data?.success) {
        toast.success(action === "approve" ? "Withdrawal approved and payment initiated" : "Withdrawal rejected")
        fetchWithdrawals()
        fetchStats()
      } else {
        throw new Error(response.data?.error || "Failed to process withdrawal")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Failed to process withdrawal")
    } finally {
      setIsProcessing(null)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-KE", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-green-600 to-teal-600 py-10">
        <div className="container mx-auto px-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              Withdrawal Requests
            </h1>
            <p className="text-white/80 mt-1">
              Manage marketer withdrawal requests and process payments via M-Pesa B2C
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card 
              className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${statusFilter === 'processing' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => { setStatusFilter("processing"); setCurrentPage(1); }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${statusFilter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${statusFilter === 'failed' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => { setStatusFilter("failed"); setCurrentPage(1); }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>
                  {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} withdrawal requests
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Total: {total}
                </Badge>
                <Button variant="outline" size="sm" onClick={fetchWithdrawals} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : withdrawals.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div 
                        key={withdrawal.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(withdrawal.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">KES {formatCurrency(withdrawal.amount)}</p>
                              <Badge className={getStatusColor(withdrawal.status)}>
                                {withdrawal.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.marketer?.name || 'Unknown'} • {withdrawal.phone_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(withdrawal.created_at)}
                              {withdrawal.remarks && ` • ${withdrawal.remarks}`}
                            </p>
                          </div>
                        </div>

                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => processWithdrawal(withdrawal.id, "approve")}
                              disabled={isProcessing === withdrawal.id}
                            >
                              {isProcessing === withdrawal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => processWithdrawal(withdrawal.id, "reject")}
                              disabled={isProcessing === withdrawal.id}
                            >
                              {isProcessing === withdrawal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {withdrawal.status === 'processing' && (
                          <div className="text-sm text-muted-foreground">
                            <p>B2C Initiated</p>
                            {withdrawal.checkout_request_id && (
                              <p className="text-xs">ID: {withdrawal.checkout_request_id}</p>
                            )}
                          </div>
                        )}

                        {withdrawal.status === 'completed' && (
                          <div className="text-sm text-muted-foreground">
                            <p>Paid via M-Pesa</p>
                            {withdrawal.mpesa_receipt && (
                              <p className="text-xs">Receipt: {withdrawal.mpesa_receipt}</p>
                            )}
                          </div>
                        )}

                        {withdrawal.status === 'failed' && (
                          <div className="text-sm text-red-600">
                            <p>Failed</p>
                            {withdrawal.remarks && (
                              <p className="text-xs">{withdrawal.remarks}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No withdrawal requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  )
}