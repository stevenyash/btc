import { useEffect } from "react"
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  UserPlus,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Settings,
  BarChart3,
  Package,
  UserCheck,
  Video,
  Shield,
  Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import { useAdminStore } from "@/stores/useAdminStore"
import { useNavigate } from "react-router-dom"
import { useRole } from "@/hooks/useRole"
import { WithPermission } from "@/components/WithPermission"

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { isSuperadmin } = useRole()
  const {
    stats,
    recentUsers,
    recentTransactions,
    subscriptionPackages,
    isLoading,
    fetchAllData,
    clearError
  } = useAdminStore()

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const formatCurrency = (value: number | undefined) => {
    const num = typeof value === 'number' ? value : 0;
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
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "pending"
    switch (statusLower) {
      case "completed":
      case "active":
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{status}</Badge>
      case "pending":
      case "processing":
        return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" />{status}</Badge>
      case "failed":
      case "rejected":
      case "inactive":
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
                <Settings className="h-8 w-8" />
                Admin Dashboard
              </h1>
              <p className="text-slate-300">
                Manage users, subscriptions, and monitor platform activity
              </p>
            </div>
             {isSuperadmin && (
               <div className="flex gap-2">
                 <Button 
                   variant="secondary"
                   className="bg-amber-500 hover:bg-amber-600 text-white"
                   onClick={() => navigate("/admin/roles")}
                 >
                   <Shield className="mr-2 h-4 w-4" />
                   Roles & Permissions
                 </Button>
               </div>
             )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading && !stats.totalUsers ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active: <span className="font-semibold">{stats.activeUsers.toLocaleString()}</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      KES {formatCurrency(stats.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All time earnings
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                    <CreditCard className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.activeSubscriptions.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active / {stats.totalSubscriptions} total
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {stats.pendingPayments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting M-Pesa confirmation
                    </p>
                    <Button 
                      variant="link" 
                      className="px-0 text-amber-600 hover:text-amber-700 font-semibold text-xs"
                      onClick={() => navigate("/admin/transactions")}
                    >
                      Review <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Monthly Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-600">
                        {Number(stats.monthlyGrowth).toFixed(1)}%
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500/50" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      User growth this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-blue-500" />
                      New Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-600">
                        {recentUsers.length > 0 ? recentUsers.length : "+0"}
                      </div>
                      <UserPlus className="h-8 w-8 text-blue-500/50" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recent registrations
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-purple-500" />
                      Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-purple-600">
                        {recentTransactions.length > 0 ? recentTransactions.length : "0"}
                      </div>
                      <ShoppingCart className="h-8 w-8 text-purple-500/50" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recent activity
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Platform Overview
                      </CardTitle>
                      <CardDescription>Key metrics and performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.totalUsers}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Users</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            {stats.activeUsers}
                          </div>
                          <div className="text-xs text-muted-foreground">Active Users</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">
                            {stats.activeSubscriptions}
                          </div>
                          <div className="text-xs text-muted-foreground">Active Subs</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg text-center">
                          <DollarSign className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-amber-600">
                            {formatCurrency(stats.totalRevenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {recentTransactions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest payment activities</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentTransactions.map((transaction) => (
                            <div 
                              key={transaction.id} 
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                  <CreditCard className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium capitalize">
                                    {transaction.user}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {transaction.type.replace("_", " ")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  KES {formatCurrency(transaction.amount)}
                                </p>
                                {getStatusBadge(transaction.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={() => navigate("/admin/transactions")}
                        >
                          View All Transactions
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Recent Users
                      </CardTitle>
                      <CardDescription>Latest registered users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentUsers.length > 0 ? (
                        <div className="space-y-4">
                          {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <div className="text-right">
                                {getStatusBadge(user.status)}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(user.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No recent users</p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => navigate("/admin/users")}
                      >
                        View All Users
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <WithPermission permission="users.list">
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => navigate("/admin/users")}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Manage Users
                        </Button>
                      </WithPermission>
                      <WithPermission permission="transactions.list">
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => navigate("/admin/transactions")}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          View Transactions
                        </Button>
                      </WithPermission>
                      <WithPermission permission="packages.list">
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => navigate("/admin/packages")}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Subscription Packages
                        </Button>
                      </WithPermission>
                      <WithPermission permission="marketers.list">
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => navigate("/admin/marketers")}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Manage Marketers
                        </Button>
                      </WithPermission>
                       <WithPermission permission="lessons.list">
                          <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => navigate("/admin/lessons")}
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Manage Lessons
                          </Button>
                        </WithPermission>
                        <WithPermission permission="lessons.store">
                          <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => navigate("/admin/bunny-upload")}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Videos
                          </Button>
                        </WithPermission>
                        {/* Tutorials removed - not an admin function */}
                    </CardContent>
                  </Card>

                  {subscriptionPackages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription Packages</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {subscriptionPackages.slice(0, 3).map((pkg) => (
                          <div key={pkg.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{pkg.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {pkg.duration_days} days
                              </p>
                            </div>
                             <div className="text-right">
                               <p className="font-bold">KES {formatCurrency(pkg.fee)}</p>
                               <p className="text-xs text-muted-foreground">
                                 {pkg.active_subscribers} active
                               </p>
                             </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => navigate("/admin/packages")}
                        >
                          Manage Packages
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

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
