import { useEffect } from "react"
import {
  Star, 
  DollarSign, 
  Wallet, 
  Percent, 
  UserPlus, 
  List, 
  RefreshCw, 
  Mail, 
  CheckCircle, 
  BarChart3,
  History,
  Share2,
  ArrowUpRight,
  TrendingUp,
  Users
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import { useMarketerStore } from "@/stores/useMarketerStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router-dom"

export default function MarketerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    dashboardData,
    performanceData,
    recentActivity,
    earningsSummary,
    recentCommissions,
    invitesCount,
    activeReferralsCount,
    isLoading,
    fetchAllData,
    clearError
  } = useMarketerStore()

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

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

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case "person_add": return <UserPlus className="h-4 w-4" />
      case "email": return <Mail className="h-4 w-4" />
      default: return <History className="h-4 w-4" />
    }
  }

  const getActivityColor = (color: string) => {
    switch (color) {
      case "positive": return "text-green-600"
      case "primary": return "text-blue-600"
      case "amber": return "text-amber-600"
      default: return "text-gray-600"
    }
  }

  const copyReferralLink = () => {
    const baseUrl = window.location.origin
    const userId = user?.id || "USER"
    const referralLink = `${baseUrl}?ref=${userId}`
    navigator.clipboard.writeText(referralLink)
    toast.success("Referral link copied to clipboard!")
  }

  const shareReferralLink = async () => {
    const baseUrl = window.location.origin
    const userId = user?.id || "USER"
    const referralLink = `${baseUrl}?ref=${userId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join BTC Learning Platform",
          text: "Join me on BTC Learning Platform and start your learning journey!",
          url: referralLink,
        })
      } catch {
        copyReferralLink()
      }
    } else {
      copyReferralLink()
    }
  }

  return (
    <Layout>
      {/* Welcome Banner */}
      <section className="bg-gradient-to-br from-purple-600 via-primary to-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                <Star className="h-10 w-10" />
                Marketer Dashboard
              </h1>
              <p className="text-lg opacity-90 max-w-2xl">
                Track your invites, referrals, and earned points. Share your referral link and earn commissions!
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-white text-primary hover:bg-white/90"
                onClick={copyReferralLink}
              >
                <Mail className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button 
                className="bg-white text-primary hover:bg-white/90"
                onClick={shareReferralLink}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
           {isLoading && !earningsSummary ? (
             <div className="flex justify-center py-12">
               <RefreshCw className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Points Card */}
                <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                    <Star className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {earningsSummary.total_points.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Redeemable: <span className="font-semibold">{earningsSummary.available_points.toLocaleString()}</span>
                    </p>
                      <Button 
                        variant="link" 
                        className="px-0 text-amber-600 hover:text-amber-700 font-semibold"
                        onClick={() => navigate("/marketer-redeem")}
                      >
                        Redeem Now <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                  </CardContent>
                </Card>

                {/* Total Earned Card */}
                <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      KES {formatCurrency(earningsSummary.total_earnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Commission + Points
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Button 
                        variant="link" 
                        className="px-0 h-auto text-green-600 hover:text-green-700 font-semibold text-xs"
                        onClick={() => navigate("/marketer-earnings")}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Earnings Card */}
                <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      KES {formatCurrency(earningsSummary.pending_earnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting withdrawal
                    </p>
                      <Button 
                        variant="link" 
                        className="px-0 text-blue-600 hover:text-blue-700 font-semibold"
                        onClick={() => navigate("/marketer-withdraw")}
                      >
                        Withdraw Now <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                  </CardContent>
                </Card>

                {/* Commission Rate Card */}
                <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                    <Percent className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {(Number(earningsSummary.commission_rate) * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1 pt = KES {earningsSummary.point_value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Potential: KES {formatCurrency(earningsSummary.potential_cash)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Total Invites</CardTitle>
                  </CardHeader>
                   <CardContent>
                     <div className="flex items-center justify-between">
                       <div className="text-2xl font-bold">{invitesCount}</div>
                       <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                     </div>
                   </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Active Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-600">{activeReferralsCount}</div>
                      <CheckCircle className="h-8 w-8 text-green-500/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{Number(dashboardData.conversion_rate).toFixed(1)}%</div>
                      <TrendingUp className="h-8 w-8 text-blue-500/50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Overview */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <BarChart3 className="inline mr-2 h-5 w-5" />
                        Performance Overview
                      </CardTitle>
                      <CardDescription>Your weekly and monthly performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                         <div className="bg-blue-50 p-4 rounded-lg text-center">
                           <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                           <div className="text-2xl font-bold text-blue-600">
                             {performanceData.weekly_invites}
                          </div>
                          <div className="text-xs text-muted-foreground">This Week</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            {performanceData.monthly_conversions}
                          </div>
                          <div className="text-xs text-muted-foreground">This Month</div>
                        </div>
                         <div className="bg-amber-50 p-4 rounded-lg text-center">
                           <Star className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                           <div className="text-2xl font-bold text-amber-600">
                             {performanceData.monthly_points.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Points Earned</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">
                            {Number(performanceData.target_progress).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Target</div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Monthly Target Progress</p>
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all"
                            style={{ width: `${Math.min(performanceData.target_progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Number(performanceData.target_progress).toFixed(0)}% of monthly target
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Commissions */}
                  {recentCommissions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Commissions</CardTitle>
                        <CardDescription>Your latest earnings breakdown</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentCommissions.map((commission) => (
                            <div 
                              key={commission.id} 
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium capitalize">
                                  {commission.purchase_type.replace("_", " ")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(commission.created_at)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  + KES {formatCurrency(commission.commission_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {commission.status}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Activity Timeline */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <History className="inline mr-2 h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Latest invite activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                          {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className={`mt-1 ${getActivityColor(activity.color)}`}>
                                {getActivityIcon(activity.icon)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">{activity.description}</p>
                                <p className="text-xs text-muted-foreground/70">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No recent activity</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Manage your referrals</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate("/invites/add")}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send New Invite
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate("/referrals")}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        My Referrals
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate("/marketer-earnings")}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Earnings History
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={copyReferralLink}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Copy Referral Link
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Earnings Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Earnings Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Points</span>
                        <Badge variant="secondary" className="text-amber-600">
                          {earningsSummary.total_points.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Redeemed</span>
                        <span className="text-sm font-medium">
                          {earningsSummary.redeemed_points.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="text-sm font-medium text-green-600">
                          {earningsSummary.available_points.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Cash</span>
                        <span className="text-sm font-bold">
                          KES {formatCurrency(earningsSummary.total_earnings)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="text-sm font-medium text-blue-600">
                          KES {formatCurrency(earningsSummary.pending_earnings)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Withdrawn</span>
                        <span className="text-sm font-medium">
                          KES {formatCurrency(earningsSummary.withdrawn_earnings)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Refresh Button (Floating) */}
      {!isLoading && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-lg h-12 w-12"
          onClick={() => {
            fetchAllData()
            clearError()
          }}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      )}
    </Layout>
  )
}
