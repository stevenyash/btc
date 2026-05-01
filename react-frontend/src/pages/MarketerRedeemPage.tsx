import { useState, useEffect } from "react"
import {
  Star,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  History,
  Wallet
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import { useMarketerStore } from "@/stores/useMarketerStore"
import { useNavigate } from "react-router-dom"
import { marketerService, type MarketerPointRedemption } from "@/services/marketer"

export default function MarketerRedeemPage() {
  const navigate = useNavigate()
  const { earningsSummary, fetchEarningsSummary } = useMarketerStore()

  const [isLoading, setIsLoading] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState("")
  const [redemptionHistory, setRedemptionHistory] = useState<MarketerPointRedemption[]>([])
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchEarningsSummary()
    fetchRedemptionHistory()
  }, [fetchEarningsSummary])

  const fetchRedemptionHistory = async () => {
    setIsLoading(true)
    try {
      const history = await marketerService.getRedemptionHistory()
      setRedemptionHistory(history)
    } catch (error) {
      console.error("Failed to fetch redemption history:", error)
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

  const handleMaxPoints = () => {
    setRedeemPoints(earningsSummary.available_points.toString())
  }

  const calculateCashAmount = (points: number): number => {
    return points * earningsSummary.point_value
  }

  const handleRedeem = async () => {
    const points = parseInt(redeemPoints)

    if (!points || points <= 0) {
      setErrorMessage("Please enter a valid number of points")
      return
    }

    if (points > earningsSummary.available_points) {
      setErrorMessage("Points exceed available balance")
      return
    }

    const minRedeem = 100
    if (points < minRedeem) {
      setErrorMessage(`Minimum redemption is ${minRedeem} points`)
      return
    }

    setIsRedeeming(true)
    setErrorMessage("")
    setRedeemStatus("pending")

    try {
      const result = await marketerService.redeemPoints(points)

      if (result.success) {
        setRedeemStatus("success")
        toast.success("Points redemption request submitted! Awaiting admin approval.")
        fetchEarningsSummary()
        fetchRedemptionHistory()
      } else {
        throw new Error(result.error || "Failed to submit redemption request")
      }
    } catch (error: any) {
      setRedeemStatus("error")
      const errorMsg = error.message || "Failed to submit redemption request"
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsRedeeming(false)
    }
  }

  const resetForm = () => {
    setRedeemPoints("")
    setRedeemStatus("idle")
    setErrorMessage("")
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800"
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-amber-600 via-primary to-orange-600 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate("/marketer-dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Star className="h-8 w-8" />
                Redeem Points
              </h1>
              <p className="text-white/80 mt-1">
                Convert your earned points to cash
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {earningsSummary.available_points.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Ready to redeem</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Point Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  KES {formatCurrency(earningsSummary.point_value)}
                </div>
                <p className="text-xs text-muted-foreground">Per point</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Potential Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  KES {formatCurrency(earningsSummary.potential_cash)}
                </div>
                <p className="text-xs text-muted-foreground">If all points redeemed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Request Point Redemption
                </CardTitle>
                <CardDescription>
                  Enter the number of points you want to convert to cash
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {redeemStatus === "success" ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Redemption Request Submitted!
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Your point redemption request has been submitted and is pending admin approval.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      You will receive KES {formatCurrency(calculateCashAmount(parseInt(redeemPoints) || 0))} via M-Pesa once approved.
                    </p>
                    <Button onClick={resetForm} variant="outline">
                      Make Another Redemption
                    </Button>
                  </div>
                ) : (
                  <>
                    {errorMessage && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{errorMessage}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="points">Points to Redeem</Label>
                      <div className="flex gap-2">
                        <Input
                          id="points"
                          type="number"
                          placeholder="Enter points"
                          value={redeemPoints}
                          onChange={(e) => setRedeemPoints(e.target.value)}
                          disabled={isRedeeming}
                          min={100}
                          max={earningsSummary.available_points}
                        />
                        <Button
                          variant="outline"
                          onClick={handleMaxPoints}
                          disabled={isRedeeming || earningsSummary.available_points <= 0}
                        >
                          MAX
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum: 100 points | Available: {earningsSummary.available_points.toLocaleString()} points
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Points:</span>
                        <span className="font-medium">{redeemPoints ? parseInt(redeemPoints).toLocaleString() : "0"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Exchange Rate:</span>
                        <span className="font-medium">1 pt = KES {formatCurrency(earningsSummary.point_value)}</span>
                      </div>
                      <div className="border-t mt-3 pt-3 flex items-center justify-between">
                        <span className="font-semibold">Cash Amount:</span>
                        <span className="font-bold text-lg text-green-600">
                          KES {formatCurrency(calculateCashAmount(parseInt(redeemPoints) || 0))}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleRedeem}
                      disabled={isRedeeming || !redeemPoints}
                    >
                       {isRedeeming ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Processing...
                         </>
                       ) : (
                         <>
                           <Wallet className="mr-2 h-4 w-4" />
                           Redeem {redeemPoints ? parseInt(redeemPoints).toLocaleString() : "0"} Points
                         </>
                       )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Redemption History
                </CardTitle>
                <CardDescription>
                  Your recent point redemption requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : redemptionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {redemptionHistory.slice(0, 10).map((redemption) => (
                      <div
                        key={redemption.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {redemption.points_redeemed.toLocaleString()} pts
                          </p>
                          <p className="text-xs text-muted-foreground">
                            KES {formatCurrency(redemption.cash_amount)} • {formatDate(redemption.created_at)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(redemption.status)}>
                          {redemption.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No redemption history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  )
}
