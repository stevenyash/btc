import { useCallback, useEffect, useState } from "react"
import { 
  CreditCard, 
  RefreshCw, 
  Trash2, 
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  ArrowUpRight,
  Search
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { adminService, type RecentTransaction } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"
import { CanI } from "@/components/CanI"

export default function AdminTransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const applyTransactions = useCallback((response: { data: RecentTransaction[]; total: number }) => {
    setTransactions(response.data)
    setTotal(response.total)
    setTotalPages(Math.max(1, Math.ceil(response.total / 20)))
    setTotalAmount(response.data.reduce(
      (sum, transaction) => sum + (["completed", "success"].includes(transaction.status?.toLowerCase() || "") ? transaction.amount : 0),
      0
    ))
  }, [])

  const loadTransactions = useCallback(
    () => adminService.getTransactions(currentPage, 20, filterStatus, searchQuery),
    [currentPage, filterStatus, searchQuery]
  )

  const fetchTransactions = useCallback(async (page: number, status: string) => {
    setIsLoading(true)
    try {
      applyTransactions(await adminService.getTransactions(page, 20, status, searchQuery))
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast.error("Failed to fetch transactions")
    } finally {
      setIsLoading(false)
    }
  }, [applyTransactions, searchQuery])

  useEffect(() => {
    let active = true
    loadTransactions()
      .then((response) => {
        if (active) applyTransactions(response)
      })
      .catch((error: unknown) => {
        if (!active) return
        console.error("Failed to fetch transactions:", error)
        toast.error("Failed to fetch transactions")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [applyTransactions, loadTransactions])

  const handleRefundTransaction = async (id: number) => {
    if (!confirm("Mark this transaction as refunded? Only continue after you have already issued the refund through M-Pesa. This action does not send money.")) return

    setIsLoading(true)
    try {
      await adminService.updateTransaction(id, { status: "refunded" })
      await fetchTransactions(currentPage, filterStatus)
      toast.success("Refund recorded. No M-Pesa transfer was initiated.")
    } catch (error) {
      console.error("Failed to refund transaction:", error)
      toast.error("Failed to refund transaction")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return

    setIsLoading(true)
    try {
      await adminService.deleteTransaction(id)
      fetchTransactions(currentPage, filterStatus)
      toast.success("Transaction deleted successfully")
    } catch (error) {
      console.error("Failed to delete transaction:", error)
      toast.error("Failed to delete transaction")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = value == null ? NaN : Number(value);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString("en-KE", {
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{status}</Badge>
      case "pending":
      case "processing":
        return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" />{status}</Badge>
      case "failed":
      case "rejected":
      case "refunded":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <CreditCard className="h-8 w-8" />
                Transaction Management
              </h1>
              <p className="text-slate-300">
                View and manage all payment transactions
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="bg-white text-slate-800 hover:bg-slate-100"
                onClick={() => navigate("/admin")}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="bg-white text-slate-800 hover:bg-slate-100"
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    await fetchTransactions(currentPage, filterStatus)
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Transactions</CardDescription>
                <CardTitle className="text-3xl">{total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed payments on this page</CardDescription>
                <CardTitle className="text-3xl">KES {formatCurrency(totalAmount)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Page</CardDescription>
                <CardTitle className="text-3xl">{currentPage} / {totalPages}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by user, phone, receipt, or checkout reference..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => {
                            setIsLoading(true)
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                      }}
                    />
                  </div>
                </div>
                <select 
                  className="px-3 py-2 border rounded-md bg-background"
                  value={filterStatus}
                  onChange={(e) => {
                    setIsLoading(true)
                    setFilterStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Transactions ({total})</CardTitle>
              <CardDescription>View and manage payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && transactions.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">ID</th>
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Payment</th>
                          <th className="text-left p-3 font-medium">Lesson access</th>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-mono text-sm">
                              #{transaction.id}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-medium">{transaction.user || "N/A"}</span>
                                  {transaction.phone_number && (
                                    <div className="text-xs text-muted-foreground">{transaction.phone_number}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <Badge variant="outline">{transaction.type || "N/A"}</Badge>
                                {transaction.transaction_reference && (
                                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                                    M-Pesa: {transaction.transaction_reference}
                                  </div>
                                )}
                                {transaction.checkout_request_id && (
                                  <div className="mt-1 max-w-48 truncate font-mono text-xs text-muted-foreground" title={transaction.checkout_request_id}>
                                    Request: {transaction.checkout_request_id}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 font-medium">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(transaction.amount)}
                              </div>
                            </td>
                            <td className="p-3">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="p-3">
                              {transaction.status?.toLowerCase() === "completed" ? (
                                transaction.activation_status === "completed" ? (
                                  <Badge className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Activated{transaction.lesson_id ? ` · lesson ${transaction.lesson_id}` : ""}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-500" title={transaction.activation_type || undefined}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {transaction.activation_status
                                      ? `Needs attention (${transaction.activation_status})`
                                      : "Access status untracked"}
                                  </Badge>
                                )
                              ) : (
                                <span className="text-sm text-muted-foreground">Not paid</span>
                              )}
                              {transaction.callback_amount != null &&
                                transaction.amount != null &&
                                transaction.callback_amount !== transaction.amount && (
                                  <div className="mt-1 text-xs text-red-600">
                                    Amount mismatch: KES {formatCurrency(transaction.callback_amount)}
                                  </div>
                                )}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                {transaction.status?.toLowerCase() === "completed" && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRefundTransaction(transaction.id)}
                                    title="Mark refund recorded"
                                  >
                                    <ArrowUpRight className="h-4 w-4 text-amber-500" />
                                  </Button>
                                )}
                                <CanI action="delete" resource="transactions">
                                  {can => can && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteTransaction(transaction.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </CanI>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setIsLoading(true)
                          setCurrentPage(p => p - 1)
                        }}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setIsLoading(true)
                          setCurrentPage(p => p + 1)
                        }}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  )
}