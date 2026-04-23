import { useState, useEffect } from "react"
import { 
  DollarSign, 
  Wallet, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  History
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
import { marketerService, type MarketerWithdrawal } from "@/services/marketer"

export default function MarketerWithdrawPage() {
  const navigate = useNavigate()
  const { earningsSummary, fetchEarningsSummary } = useMarketerStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawalHistory, setWithdrawalHistory] = useState<MarketerWithdrawal[]>([])
  const [withdrawStatus, setWithdrawStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchEarningsSummary()
    fetchWithdrawalHistory()
  }, [fetchEarningsSummary])

  const fetchWithdrawalHistory = async () => {
    setIsLoading(true)
    try {
      const history = await marketerService.getWithdrawalHistory()
      setWithdrawalHistory(history)
    } catch (error) {
      console.error("Failed to fetch withdrawal history:", error)
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

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.startsWith("254")) {
      return cleaned
    }
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.substring(1)
    }
    return "254" + cleaned
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleMaxAmount = () => {
    setWithdrawAmount(earningsSummary.pending_earnings.toString())
  }

  const handleWithdraw = async () => {
    if (!phoneNumber || phoneNumber.length < 12) {
      setErrorMessage("Please enter a valid M-Pesa phone number")
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Please enter a valid amount")
      return
    }

    if (amount > earningsSummary.pending_earnings) {
      setErrorMessage("Amount exceeds available pending earnings")
      return
    }

    const minWithdrawal = 100
    if (amount < minWithdrawal) {
      setErrorMessage(`Minimum withdrawal amount is KES ${minWithdrawal}`)
      return
    }

    setIsWithdrawing(true)
    setErrorMessage("")
    setWithdrawStatus("pending")

    try {
      const result = await marketerService.requestWithdrawal(phoneNumber, amount)

      if (result.success) {
        setWithdrawStatus("success")
        toast.success("Withdrawal initiated successfully! Check your phone for M-Pesa prompt.")
        fetchEarningsSummary()
        fetchWithdrawalHistory()
      } else {
        throw new Error(result.error || "Failed to initiate withdrawal")
      }
    } catch (error: any) {
      setWithdrawStatus("error")
      const errorMsg = error.message || "Failed to initiate withdrawal"
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const resetForm = () => {
    setPhoneNumber("")
    setWithdrawAmount("")
    setWithdrawStatus("idle")
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
      <section className="bg-gradient-to-br from-blue-600 via-primary to-purple-600 py-12">
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
                <Wallet className="h-8 w-8" />
                Withdraw Earnings
              </h1>
              <p className="text-white/80 mt-1">
                Withdraw your pending earnings directly to M-Pesa
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  KES {formatCurrency(earningsSummary.pending_earnings)}
                </div>
                <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  KES {formatCurrency(earningsSummary.total_earnings)}
                </div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Already Withdrawn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  KES {formatCurrency(earningsSummary.withdrawn_earnings)}
                </div>
                <p className="text-xs text-muted-foreground">Total withdrawn</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Request Withdrawal
                </CardTitle>
                <CardDescription>
                  Enter your M-Pesa number and amount to withdraw
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {withdrawStatus === "success" ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Withdrawal Request Submitted!
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Your withdrawal request has been submitted and is pending admin approval.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      You will receive your funds via M-Pesa once approved.
                    </p>
                    <Button onClick={resetForm} variant="outline">
                      Make Another Withdrawal
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
                      <Label htmlFor="phone">M-Pesa Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="254XXXXXXXXX"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        disabled={isWithdrawing}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be a Kenyan M-Pesa registered number
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (KES)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          disabled={isWithdrawing}
                          min={100}
                          max={earningsSummary.pending_earnings}
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleMaxAmount}
                          disabled={isWithdrawing || earningsSummary.pending_earnings <= 0}
                        >
                          MAX
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum: KES 100 | Available: KES {formatCurrency(earningsSummary.pending_earnings)}
                      </p>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !phoneNumber || !withdrawAmount}
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Withdraw KES {withdrawAmount ? formatCurrency(parseFloat(withdrawAmount)) : "0"}
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
                  Withdrawal History
                </CardTitle>
                <CardDescription>
                  Your recent withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : withdrawalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {withdrawalHistory.slice(0, 10).map((withdrawal) => (
                      <div 
                        key={withdrawal.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            KES {formatCurrency(withdrawal.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {withdrawal.phone_number} • {formatDate(withdrawal.created_at)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(withdrawal.status)}>
                          {withdrawal.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No withdrawal history yet</p>
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