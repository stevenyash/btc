import { useCallback, useEffect, useState } from "react"
import { CreditCard, RefreshCw, Search, Trash2, X, Plus, Pencil, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService, type SubscriptionType } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"
import { CanI } from "@/components/CanI"

export default function AdminSubscriptionsPage() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    membership_fee: 0,
    months: 1
  })

  const fetchSubscriptions = useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const response = await adminService.getSubscriptionTypes(page, 20)
      const data = response.data
      setSubscriptions(Array.isArray(data) ? data : [])
      setTotal(response.total)
      setTotalPages(Math.ceil(response.total / 20))
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error)
      toast.error("Failed to fetch subscription types")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptions(currentPage)
  }, [currentPage, fetchSubscriptions])

  const handleOpenModal = (subscription?: SubscriptionType) => {
    if (subscription) {
      setEditingSubscription(subscription)
      setFormData({
        name: subscription.name,
        description: subscription.description || "",
        membership_fee: subscription.membership_fee,
        months: subscription.months
      })
    } else {
      setEditingSubscription(null)
      setFormData({
        name: "",
        description: "",
        membership_fee: 0,
        months: 1
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSubscription(null)
    setFormData({
      name: "",
      description: "",
      membership_fee: 0,
      months: 1
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (editingSubscription) {
        await adminService.updateSubscriptionType(editingSubscription.id, formData)
        toast.success("Subscription type updated successfully")
      } else {
        await adminService.createSubscriptionType(formData)
        toast.success("Subscription type created successfully")
      }
      handleCloseModal()
      await fetchSubscriptions(currentPage)
    } catch (error) {
      console.error("Failed to save subscription type:", error)
      toast.error("Failed to save subscription type")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscription type? This may affect packages using this type.")) return

    setIsLoading(true)
    try {
      await adminService.deleteSubscriptionType(id)
      toast.success("Subscription type deleted successfully")
      await fetchSubscriptions(currentPage)
    } catch (error) {
      console.error("Failed to delete subscription type:", error)
      toast.error("Failed to delete subscription type")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await fetchSubscriptions(currentPage)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.id.toString().includes(searchQuery)
  )

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

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="mb-2 flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                <CreditCard className="h-6 w-6 flex-shrink-0 sm:h-8 sm:w-8" />
                Subscription Types
              </h1>
              <p className="text-slate-300">
                Manage subscription plans on the platform
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 md:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 bg-white text-slate-800 hover:bg-slate-100 sm:flex-none"
                onClick={() => navigate("/admin")}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-white text-slate-800 hover:bg-slate-100 sm:flex-none"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 sm:flex-none"
                onClick={() => handleOpenModal()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription Type
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
                <CardDescription>Total Types</CardDescription>
                <CardTitle className="text-3xl">{total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Types</CardDescription>
                <CardTitle className="text-3xl">{subscriptions.length}</CardTitle>
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
                      placeholder="Search by name, description, or ID..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Subscription Types ({total})</CardTitle>
              <CardDescription>Manage subscription plans and their pricing</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && subscriptions.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No subscription types found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">ID</th>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-left p-3 font-medium">Fee (KES)</th>
                          <th className="text-left p-3 font-medium">Duration</th>
                          <th className="text-left p-3 font-medium">Created</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscriptions.map((sub) => (
                          <tr key={sub.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-mono text-sm">
                              #{sub.id}
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{sub.name}</span>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {sub.description || "N/A"}
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{formatCurrency(sub.membership_fee)}</span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{sub.months} month{sub.months > 1 ? 's' : ''}</Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {sub.created_at ? formatDate(sub.created_at) : "N/A"}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenModal(sub)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4 text-blue-500" />
                                </Button>
                                <CanI action="delete" resource="subscriptions">
                                  {can => can && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteSubscription(sub.id)}
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
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingSubscription ? "Edit Subscription Type" : "Add Subscription Type"}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium, Basic"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label htmlFor="membership_fee">Membership Fee (KES) *</Label>
                  <Input 
                    id="membership_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.membership_fee}
                    onChange={(e) => setFormData({ ...formData, membership_fee: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="months">Duration (Months) *</Label>
                  <Input 
                    id="months"
                    type="number"
                    min="1"
                    value={formData.months}
                    onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}