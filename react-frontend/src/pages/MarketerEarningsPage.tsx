import { useState, useEffect } from "react"
import {
  DollarSign,
  ArrowLeft,
  Clock,
  RefreshCw,
  Wallet,
  TrendingUp,
  Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import { useMarketerStore } from "@/stores/useMarketerStore"
import { useNavigate } from "react-router-dom"
import { marketerService, type MarketerWithdrawal, type MarketerPointRedemption } from "@/services/marketer"

export default function MarketerEarningsPage() {
  const navigate = useNavigate()
  const { earningsSummary, recentCommissions, fetchEarningsSummary } = useMarketerStore()

  const [isLoading, setIsLoading] = useState(true)
  const [withdrawalHistory, setWithdrawalHistory] = useState<MarketerWithdrawal[]>([])
  const [redemptionHistory, setRedemptionHistory] = useState<MarketerPointRedemption[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await fetchEarningsSummary()
      const [withdrawals, redemptions] = await Promise.all([
        marketerService.getWithdrawalHistory(),
        marketerService.getRedemptionHistory()
      ])
      setWithdrawalHistory(withdrawals)
      setRedemptionHistory(redemptions)
    } catch (error) {
      console.error("Failed to load earnings data:", error)
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
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
      case "success":
        return "bg-green-500"
      case "pending":
      case "processing":
        return "bg-amber-500"
      case "failed":
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Earnings</h1>
            <p className="text-muted-foreground">Track your commissions and earnings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/marketer-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading && earningsSummary.total_earnings === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Main Earnings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Earnings</CardDescription>
                  <CardTitle className="text-3xl">KES {formatCurrency(earningsSummary.total_earnings)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">Lifetime earnings</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending Earnings</CardDescription>
                  <CardTitle className="text-3xl">KES {formatCurrency(earningsSummary.pending_earnings)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-amber-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">Awaiting confirmation</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Withdrawn</CardDescription>
                  <CardTitle className="text-3xl">KES {formatCurrency(earningsSummary.withdrawn_earnings)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-muted-foreground">
                    <Wallet className="h-4 w-4 mr-1" />
                    <span className="text-sm">Total withdrawn</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Points Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Points Summary</CardTitle>
                <CardDescription>Your loyalty points - 1 point = KES {earningsSummary.point_value}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">{earningsSummary.total_points}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Redeemed</p>
                    <p className="text-2xl font-bold">{earningsSummary.redeemed_points}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold text-green-600">{earningsSummary.available_points}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Potential Cash</p>
                    <p className="text-2xl font-bold text-green-600">KES {formatCurrency(earningsSummary.potential_cash)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => navigate("/marketer-withdraw")}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Withdraw Cash
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/marketer-redeem")}>
                    <Gift className="h-4 w-4 mr-2" />
                    Redeem Points
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Commissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Commissions</CardTitle>
                  <CardDescription>Your latest earnings from referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentCommissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No commissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentCommissions.slice(0, 10).map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{commission.purchase_type || "Subscription"}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(commission.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              +KES {formatCurrency(commission.commission_amount)}
                            </p>
                            <Badge className={getStatusColor(commission.status)}>
                              {commission.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawal History */}
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal History</CardTitle>
                  <CardDescription>Your cash withdrawal requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawalHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No withdrawals yet</p>
                  ) : (
                    <div className="space-y-3">
                      {withdrawalHistory.slice(0, 10).map((withdrawal) => (
                        <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">KES {formatCurrency(withdrawal.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(withdrawal.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(withdrawal.status)}>
                              {withdrawal.status}
                            </Badge>
                            {withdrawal.mpesa_receipt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Receipt: {withdrawal.mpesa_receipt}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Point Redemption History */}
            <Card>
              <CardHeader>
                <CardTitle>Point Redemption History</CardTitle>
                <CardDescription>Your redeemed points for airtime</CardDescription>
              </CardHeader>
              <CardContent>
                {redemptionHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No redemptions yet</p>
                ) : (
                  <div className="space-y-3">
                    {redemptionHistory.slice(0, 10).map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{redemption.points_redeemed} points</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(redemption.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">KES {formatCurrency(redemption.cash_amount)}</p>
                          <Badge className={getStatusColor(redemption.status)}>
                            {redemption.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}