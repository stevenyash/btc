import { useCallback, useEffect, useState } from "react"
import { 
  RefreshCw, 
  CheckCircle,
  XCircle,
  DollarSign,
  Settings,
  CreditCard,
  Wallet,
  Gift,
  Search
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MarketerCommission {
  id: number
  marketer_id: number
  marketer_name: string
  marketer_phone: string
  user_id: number
  user_name: string
  transaction_id: number | null
  purchase_type: string
  purchase_amount: number
  commission_rate: number
  commission_amount: number
  status: string
  created_at: string
}

interface MarketerWithdrawal {
  id: number
  marketer_id: number
  marketer_name: string
  marketer_phone: string
  amount: number
  phone_number: string
  source: string
  status: string
  mpesa_receipt: string | null
  remarks: string | null
  created_at: string
  processed_at: string | null
}

interface MarketerRedemption {
  id: number
  marketer_id: number
  marketer_name: string
  marketer_phone: string
  points_redeemed: number
  point_value: number
  cash_amount: number
  status: string
  remarks: string | null
  created_at: string
}

interface CommissionSettings {
  default_commission_rate: number
  point_value: number
  min_withdrawal_amount: number
  min_points_redemption: number
}

export default function MarketerEarningsAdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("settings")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [commissions, setCommissions] = useState<MarketerCommission[]>([])
  const [commissionPage, setCommissionPage] = useState(1)
  const [commissionTotal, setCommissionTotal] = useState(0)
  const [commissionStatus, setCommissionStatus] = useState<string>("")

  const [withdrawals, setWithdrawals] = useState<MarketerWithdrawal[]>([])
  const [withdrawalPage, setWithdrawalPage] = useState(1)
  const [withdrawalTotal, setWithdrawalTotal] = useState(0)
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>("")

  const [redemptions, setRedemptions] = useState<MarketerRedemption[]>([])
  const [redemptionPage, setRedemptionPage] = useState(1)
  const [redemptionTotal, setRedemptionTotal] = useState(0)
  const [redemptionStatus, setRedemptionStatus] = useState<string>("")

   const [settings, setSettings] = useState<CommissionSettings>({
     default_commission_rate: 0.10,
     point_value: 10.00,
     min_withdrawal_amount: 100.00,
     min_points_redemption: 10
   })
   const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await adminService.getCommissionSettings()
      setSettings(data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }, [])

  const fetchCommissions = useCallback(async (page: number, status: string) => {
    try {
      const response = await adminService.getMarketerCommissions(page, 20, status || undefined)
      setCommissions(response.data)
      setCommissionTotal(response.total)
    } catch (error) {
      console.error("Failed to fetch commissions:", error)
    }
  }, [])

  const fetchWithdrawals = useCallback(async (page: number, status: string) => {
    try {
      const response = await adminService.getMarketerWithdrawals(page, 20, status || undefined)
      setWithdrawals(response.data)
      setWithdrawalTotal(response.total)
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error)
    }
  }, [])

  const fetchRedemptions = useCallback(async (page: number, status: string) => {
    try {
      const response = await adminService.getMarketerRedemptions(page, 20, status || undefined)
      setRedemptions(response.data)
      setRedemptionTotal(response.total)
    } catch (error) {
      console.error("Failed to fetch redemptions:", error)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    if (activeTab === "settings") {
      fetchSettings().finally(() => setIsLoading(false))
    } else if (activeTab === "commissions") {
      fetchCommissions(commissionPage, commissionStatus).finally(() => setIsLoading(false))
    } else if (activeTab === "withdrawals") {
      fetchWithdrawals(withdrawalPage, withdrawalStatus).finally(() => setIsLoading(false))
    } else if (activeTab === "redemptions") {
      fetchRedemptions(redemptionPage, redemptionStatus).finally(() => setIsLoading(false))
    }
  }, [activeTab, fetchSettings, fetchCommissions, fetchWithdrawals, fetchRedemptions, commissionPage, commissionStatus, withdrawalPage, withdrawalStatus, redemptionPage, redemptionStatus])

  useEffect(() => {
    if (activeTab === "commissions") {
      setIsLoading(true)
      fetchCommissions(commissionPage, commissionStatus).finally(() => setIsLoading(false))
    }
  }, [commissionPage, commissionStatus, fetchCommissions, activeTab])

  useEffect(() => {
    if (activeTab === "withdrawals") {
      setIsLoading(true)
      fetchWithdrawals(withdrawalPage, withdrawalStatus).finally(() => setIsLoading(false))
    }
  }, [withdrawalPage, withdrawalStatus, fetchWithdrawals, activeTab])

  useEffect(() => {
    if (activeTab === "redemptions") {
      setIsLoading(true)
      fetchRedemptions(redemptionPage, redemptionStatus).finally(() => setIsLoading(false))
    }
  }, [redemptionPage, redemptionStatus, fetchRedemptions, activeTab])

  const handleUpdateSettings = async () => {
    setIsLoading(true)
    try {
      await adminService.updateCommissionSettings(settings)
      toast.success("Settings updated successfully")
      setIsSettingsOpen(false)
    } catch (error) {
      console.error("Failed to update settings:", error)
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveCommission = async (id: number, status: string) => {
    setIsLoading(true)
    try {
      await adminService.updateMarketerCommission(id, { status })
      toast.success(`Commission ${status}`)
      await fetchCommissions(commissionPage, commissionStatus)
    } catch (error) {
      console.error("Failed to update commission:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveWithdrawal = async (id: number, status: string) => {
    setIsLoading(true)
    try {
      await adminService.updateMarketerWithdrawal(id, { status })
      toast.success(`Withdrawal ${status}`)
      await fetchWithdrawals(withdrawalPage, withdrawalStatus)
    } catch (error) {
      console.error("Failed to update withdrawal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRedemption = async (id: number, status: string) => {
    setIsLoading(true)
    try {
      await adminService.updateMarketerRedemption(id, { status })
      toast.success(`Redemption ${status}`)
      await fetchRedemptions(redemptionPage, redemptionStatus)
    } catch (error) {
      console.error("Failed to update redemption:", error)
    } finally {
      setIsLoading(false)
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

  const filteredCommissions = commissions.filter(c => 
    c.marketer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWithdrawals = withdrawals.filter(w => 
    w.marketer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.phone_number?.includes(searchQuery)
  )

  const filteredRedemptions = redemptions.filter(r => 
    r.marketer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="h-8 w-8" />
                Marketer Earnings
              </h1>
              <p className="text-slate-300">
                Manage commissions, withdrawals, and redemption settings
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
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="commissions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Commissions
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Withdrawals
              </TabsTrigger>
              <TabsTrigger value="redemptions" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Redemptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Commission Settings</CardTitle>
                    <CardDescription>Configure default rates and thresholds for marketer earnings</CardDescription>
                  </div>
                  <Button onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                    {isSettingsOpen ? "Cancel" : "Edit Settings"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Default Commission Rate</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-2xl font-bold">{(settings.default_commission_rate * 100).toFixed(0)}%</span>
                        <p className="text-sm text-muted-foreground">of purchase amount</p>
                      </div>
                      {isSettingsOpen && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.default_commission_rate}
                          onChange={(e) => setSettings({ ...settings, default_commission_rate: parseFloat(e.target.value) || 0 })}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Point Value (KES)</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-2xl font-bold">KES {formatCurrency(settings.point_value)}</span>
                        <p className="text-sm text-muted-foreground">per point</p>
                      </div>
                      {isSettingsOpen && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settings.point_value}
                          onChange={(e) => setSettings({ ...settings, point_value: parseFloat(e.target.value) || 0 })}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Minimum Withdrawal (KES)</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-2xl font-bold">KES {formatCurrency(settings.min_withdrawal_amount)}</span>
                        <p className="text-sm text-muted-foreground">minimum amount</p>
                      </div>
                      {isSettingsOpen && (
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={settings.min_withdrawal_amount}
                          onChange={(e) => setSettings({ ...settings, min_withdrawal_amount: parseFloat(e.target.value) || 0 })}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Minimum Points for Redemption</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-2xl font-bold">{settings.min_points_redemption}</span>
                        <p className="text-sm text-muted-foreground">points required</p>
                      </div>
                      {isSettingsOpen && (
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={settings.min_points_redemption}
                          onChange={(e) => setSettings({ ...settings, min_points_redemption: parseInt(e.target.value) || 0 })}
                        />
                      )}
                    </div>
                  </div>

                  {isSettingsOpen && (
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateSettings} disabled={isLoading}>
                        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save Settings"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions">
              <Card>
                <CardHeader>
                  <CardTitle>Commissions ({commissionTotal})</CardTitle>
                  <CardDescription>Track and manage earned commissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search by marketer or user..." 
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <select 
                      className="border rounded-md px-3 py-2"
                      value={commissionStatus}
                      onChange={(e) => {
                        setCommissionStatus(e.target.value)
                        setCommissionPage(1)
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                     <Button variant="outline" onClick={async () => {
                       setIsLoading(true)
                       try {
                         await fetchCommissions(commissionPage, commissionStatus)
                       } finally {
                         setIsLoading(false)
                       }
                     }} disabled={isLoading}>
                       <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                     </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Marketer</th>
                          <th className="text-left py-3 px-4 font-medium">User</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Commission</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCommissions.map((commission) => (
                          <tr key={commission.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{commission.marketer_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{commission.marketer_phone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {commission.user_name || "Unknown"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">
                                {commission.purchase_type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              KES {formatCurrency(commission.purchase_amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-green-600">
                                KES {formatCurrency(commission.commission_amount)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({(commission.commission_rate * 100).toFixed(0)}%)
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                className={
                                  commission.status === "approved" ? "bg-green-500" :
                                  commission.status === "paid" ? "bg-blue-500" :
                                  "bg-yellow-500"
                                }
                              >
                                {commission.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(commission.created_at)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                {commission.status === "pending" && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleApproveCommission(commission.id, "approved")}>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleApproveCommission(commission.id, "rejected")}>
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                )}
                                {commission.status === "approved" && (
                                  <Button variant="ghost" size="sm" onClick={() => handleApproveCommission(commission.id, "paid")}>
                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredCommissions.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-muted-foreground">
                              No commissions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {Math.ceil(commissionTotal / 20) > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button variant="outline" size="sm" disabled={commissionPage === 1} onClick={() => setCommissionPage(p => p - 1)}>
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {commissionPage} of {Math.ceil(commissionTotal / 20)}
                      </span>
                      <Button variant="outline" size="sm" disabled={commissionPage >= Math.ceil(commissionTotal / 20)} onClick={() => setCommissionPage(p => p + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawals ({withdrawalTotal})</CardTitle>
                  <CardDescription>Process and manage withdrawal requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search by marketer or phone..." 
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <select 
                      className="border rounded-md px-3 py-2"
                      value={withdrawalStatus}
                      onChange={(e) => {
                        setWithdrawalStatus(e.target.value)
                        setWithdrawalPage(1)
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <Button variant="outline" onClick={async () => {
                      setIsLoading(true)
                      try {
                        await fetchWithdrawals(withdrawalPage, withdrawalStatus)
                      } finally {
                        setIsLoading(false)
                      }
                    }} disabled={isLoading}>
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Marketer</th>
                          <th className="text-left py-3 px-4 font-medium">Phone</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Source</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWithdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{withdrawal.marketer_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{withdrawal.marketer_phone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {withdrawal.phone_number}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold">
                                KES {formatCurrency(withdrawal.amount)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">
                                {withdrawal.source}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                className={
                                  withdrawal.status === "completed" ? "bg-green-500" :
                                  withdrawal.status === "processing" ? "bg-blue-500" :
                                  withdrawal.status === "failed" ? "bg-red-500" :
                                  "bg-yellow-500"
                                }
                              >
                                {withdrawal.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(withdrawal.created_at)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                {withdrawal.status === "pending" && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleApproveWithdrawal(withdrawal.id, "processing")}>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleApproveWithdrawal(withdrawal.id, "failed")}>
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                )}
                                {withdrawal.status === "processing" && (
                                  <Button variant="ghost" size="sm" onClick={() => handleApproveWithdrawal(withdrawal.id, "completed")}>
                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredWithdrawals.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                              No withdrawals found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {Math.ceil(withdrawalTotal / 20) > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button variant="outline" size="sm" disabled={withdrawalPage === 1} onClick={() => setWithdrawalPage(p => p - 1)}>
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {withdrawalPage} of {Math.ceil(withdrawalTotal / 20)}
                      </span>
                      <Button variant="outline" size="sm" disabled={withdrawalPage >= Math.ceil(withdrawalTotal / 20)} onClick={() => setWithdrawalPage(p => p + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="redemptions">
              <Card>
                <CardHeader>
                  <CardTitle>Point Redemptions ({redemptionTotal})</CardTitle>
                  <CardDescription>Approve or reject point redemption requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search by marketer..." 
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <select 
                      className="border rounded-md px-3 py-2"
                      value={redemptionStatus}
                      onChange={(e) => {
                        setRedemptionStatus(e.target.value)
                        setRedemptionPage(1)
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <Button variant="outline" onClick={async () => {
                      setIsLoading(true)
                      try {
                        await fetchRedemptions(redemptionPage, redemptionStatus)
                      } finally {
                        setIsLoading(false)
                      }
                    }} disabled={isLoading}>
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Marketer</th>
                          <th className="text-left py-3 px-4 font-medium">Points</th>
                          <th className="text-left py-3 px-4 font-medium">Value</th>
                          <th className="text-left py-3 px-4 font-medium">Cash</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRedemptions.map((redemption) => (
                          <tr key={redemption.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{redemption.marketer_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{redemption.marketer_phone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold">{redemption.points_redeemed}</span>
                            </td>
                            <td className="py-3 px-4">
                              KES {formatCurrency(redemption.point_value)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-green-600">
                                KES {formatCurrency(redemption.cash_amount)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                className={
                                  redemption.status === "approved" ? "bg-green-500" :
                                  redemption.status === "rejected" ? "bg-red-500" :
                                  "bg-yellow-500"
                                }
                              >
                                {redemption.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(redemption.created_at)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                {redemption.status === "pending" && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleApproveRedemption(redemption.id, "approved")}>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleApproveRedemption(redemption.id, "rejected")}>
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredRedemptions.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                              No redemptions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {Math.ceil(redemptionTotal / 20) > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button variant="outline" size="sm" disabled={redemptionPage === 1} onClick={() => setRedemptionPage(p => p - 1)}>
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {redemptionPage} of {Math.ceil(redemptionTotal / 20)}
                      </span>
                      <Button variant="outline" size="sm" disabled={redemptionPage >= Math.ceil(redemptionTotal / 20)} onClick={() => setRedemptionPage(p => p + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  )
}