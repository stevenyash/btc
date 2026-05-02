import { useEffect } from "react"
import { User, CreditCard, BookOpen, Clock, Calendar, ArrowRight, RefreshCw, Package, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import { useAuthStore } from "@/stores/useAuthStore"
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"

export default function SubscriberDashboardPage() {
  const { user } = useAuthStore()
  const {
    subscriberDetails,
    lessonBalance,
    lessonsViewed,
    totalLessons,
    subscriptionStatus,
    hasActiveSubscription,
    isLoading,
    fetchSubscriberDetails,
    clearError
  } = useSubscriptionStore()

  const currentPackage = subscriberDetails?.packages

  useEffect(() => {
    fetchSubscriberDetails()
  }, [fetchSubscriberDetails])

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
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                My <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Welcome back, {user?.username || "Subscriber"}! Here's an overview of your subscription and learning progress.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchSubscriberDetails()
                clearError()
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading && !subscriberDetails ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Subscription Status Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Subscription Status */}
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(subscriptionStatus)}
                      <div className="text-2xl font-bold">
                        {hasActiveSubscription ? "Active" : "Inactive"}
                      </div>
                    </div>
                    {subscriberDetails?.subscriptions?.expiry_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {formatDate(subscriberDetails.subscriptions.expiry_date)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Lesson Balance */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lessons Remaining</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lessonBalance}</div>
                    <p className="text-xs text-muted-foreground">
                      of {totalLessons} total lessons
                    </p>
                    <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: totalLessons > 0 ? `${((totalLessons - lessonBalance) / totalLessons) * 100}%` : "0%"
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Lessons Viewed */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lessonsViewed}</div>
                    <p className="text-xs text-muted-foreground">
                      lessons viewed
                    </p>
                  </CardContent>
                </Card>

                  {/* Current Package */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Package</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate">
                      {currentPackage?.name || "No package"}
                    </div>
                    {currentPackage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentPackage.no_of_lessons} lessons • {currentPackage.duration_amount} {currentPackage.duration_unit}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Package Details */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Package Details</CardTitle>
                      <CardDescription>Information about your current subscription package</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentPackage ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Package Name</p>
                              <p className="text-lg font-semibold">{currentPackage.name}</p>
                            </div>
                             <div>
                               <p className="text-sm font-medium text-muted-foreground">Subscription Type</p>
                               <p className="text-lg font-semibold">
                                  {currentPackage.subscription_type?.name || "Standard"}
                               </p>
                             </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Lessons</p>
                              <p className="text-lg font-semibold">{currentPackage.no_of_lessons}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Duration</p>
                              <p className="text-lg font-semibold">
                                {currentPackage.duration_amount} {currentPackage.duration_unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Fee Paid</p>
                              <p className="text-lg font-semibold">KSh {currentPackage.fee?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Concurrent Access</p>
                              <p className="text-lg font-semibold">{currentPackage.concurrent_access} devices</p>
                            </div>
                          </div>
                          {currentPackage.description && (
                            <div className="pt-4 border-t">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                              <p className="text-sm">{currentPackage.description}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No active package</p>
                          <Button className="mt-4" asChild>
                            <a href="/packages">View Available Packages</a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Subscription Timeline */}
                  {subscriberDetails?.subscriptions && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription Timeline</CardTitle>
                        <CardDescription>Important dates for your subscription</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Start Date</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(subscriberDetails.subscriptions.start_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Expiry Date</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(subscriberDetails.subscriptions.expiry_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Quick Actions & Status */}
                <div className="space-y-6">
                  {/* Subscription Status Badge */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        <Badge className={getStatusColor(subscriptionStatus)}>
                          {subscriptionStatus?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Lessons Used</span>
                        <span>{lessonsViewed} / {totalLessons}</span>
                      </div>
                      {subscriberDetails?.lessontrack?.package_id && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Package ID</span>
                          <span className="font-mono text-sm">#{subscriberDetails.lessontrack.package_id}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Manage your subscription</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!hasActiveSubscription ? (
                        <Button className="w-full" asChild>
                          <a href="/packages">
                            <Package className="mr-2 h-4 w-4" />
                            View Packages
                          </a>
                        </Button>
                      ) : (
                        <Button className="w-full" variant="outline" asChild>
                          <a href="/packages">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Upgrade Package
                          </a>
                        </Button>
                      )}
                      <Button className="w-full" variant="outline" asChild>
                        <a href="/aboutus">
                          <User className="mr-2 h-4 w-4" />
                          Contact Support
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Username</span>
                        <span className="text-sm font-medium">{user?.username || "N/A"}</span>
                      </div>
                      {user?.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Email</span>
                          <span className="text-sm font-medium truncate max-w-[150px]">{user.email}</span>
                        </div>
                      )}
                      {subscriberDetails?.subscriptions?.phone_no && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Phone</span>
                          <span className="text-sm font-medium">{subscriberDetails.subscriptions.phone_no}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  )
}
