import { useEffect, useState } from "react"
import { Package as PackageIcon, RefreshCw, Search, Trash2, X, Plus, Pencil, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService, type Package } from "@/services/admin"
import Layout from "@/components/Layout"
import { WithPermission } from "@/components/WithPermission"

const DURATION_UNITS = ["day", "week", "month", "year"]

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [subscriptionTypes, setSubscriptionTypes] = useState<{ id: number; name: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // ✅ ADD MISSING formData state
  const [formData, setFormData] = useState({
    subscription_type_id: 0,
    name: "",
    description: "",
    fee: 0,
    concurrent_access: 1,
    no_of_lessons: 0,
    watch_time_minutes: 0,
    duration_amount: 1,
    duration_unit: "month"
  })

  // ✅ Fix: Pass page parameter
  const fetchPackages = async (page: number) => {
    setIsLoading(true)
    try {
      const response = await adminService.getPackages(page, 20)
      const packagesData = response.data
      setPackages(Array.isArray(packagesData) ? packagesData : [])
      setTotal(response.total)
      setTotalPages(Math.ceil(response.total / 20))
    } catch (error) {
      console.error("Failed to fetch packages:", error)
      toast.error("Failed to fetch packages")
      setPackages([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubscriptionTypes = async () => {
    try {
      const response = await adminService.getSubscriptionTypes()
      setSubscriptionTypes(response.data)
    } catch (error) {
      console.error("Failed to fetch subscription types:", error)
    }
  }

  // ✅ Fix: Pass currentPage to fetchPackages
  useEffect(() => {
    fetchPackages(currentPage)
    fetchSubscriptionTypes()
  }, [currentPage])

  // ✅ Fix: Pass page parameter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPackages(1)
  }

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pkg.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg)
      setFormData({
        subscription_type_id: pkg.subscription_type_id,
        name: pkg.name,
        description: pkg.description || "",
        fee: pkg.fee,
        concurrent_access: pkg.concurrent_access,
        no_of_lessons: pkg.no_of_lessons,
        watch_time_minutes: pkg.watch_time_minutes,
        duration_amount: pkg.duration_amount,
        duration_unit: pkg.duration_unit
      })
    } else {
      setEditingPackage(null)
      setFormData({
        subscription_type_id: subscriptionTypes[0]?.id || 0,
        name: "",
        description: "",
        fee: 0,
        concurrent_access: 1,
        no_of_lessons: 0,
        watch_time_minutes: 0,
        duration_amount: 1,
        duration_unit: "month"
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPackage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (editingPackage) {
        await adminService.updatePackage(editingPackage.id, formData)
        toast.success("Package updated successfully")
      } else {
        await adminService.createPackage(formData)
        toast.success("Package created successfully")
      }
      handleCloseModal()
      fetchPackages(currentPage) // ✅ Refresh current page
    } catch (error) {
      console.error("Failed to save package:", error)
      toast.error("Failed to save package")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePackage = async (id: number) => {
    if (!confirm("Are you sure you want to delete this package? This cannot be undone.")) return

    setIsLoading(true)
    try {
      await adminService.deletePackage(id)
      toast.success("Package deleted successfully")
      fetchPackages(currentPage) // ✅ Refresh current page
    } catch (error) {
      console.error("Failed to delete package:", error)
      toast.error("Failed to delete package")
    } finally {
      setIsLoading(false)
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES"
    }).format(amount)
  }
  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <PackageIcon className="h-8 w-8" />
                Package Management
              </h1>
              <p className="text-slate-300">
                Manage subscription packages on the platform
              </p>
            </div>
            <WithPermission permission="packages.store">
              <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </WithPermission>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>All Packages</CardTitle>
                <CardDescription>
                  Total: {total} packages
                </CardDescription>
              </div>
              <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
               <Button 
  type="button" 
  variant="outline" 
  onClick={() => fetchPackages(currentPage)}  // ✅ Pass currentPage
>
  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
</Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Fee</th>
                    <th className="text-left py-3 px-4 font-medium">Lessons</th>
                    <th className="text-left py-3 px-4 font-medium">Watch Time</th>
                    <th className="text-left py-3 px-4 font-medium">Duration</th>
                    <th className="text-left py-3 px-4 font-medium">Devices</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && packages.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-500">
                        No packages found
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map((pkg) => (
                      <tr key={pkg.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{pkg.id}</td>
                        <td className="py-3 px-4 font-medium">{pkg.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {pkg.subscription_type_name || `Type #${pkg.subscription_type_id}`}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(pkg.fee)}</td>
                        <td className="py-3 px-4">{pkg.no_of_lessons}</td>
                        <td className="py-3 px-4">{pkg.watch_time_minutes} min</td>
                        <td className="py-3 px-4">{pkg.duration_amount} {pkg.duration_unit}(s)</td>
                        <td className="py-3 px-4">{pkg.concurrent_access}</td>
                        <td className="py-3 px-4">{formatDate(pkg.created_at)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <WithPermission permission="packages.edit">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(pkg)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </WithPermission>
                            <WithPermission permission="packages.remove">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </WithPermission>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingPackage ? "Edit Package" : "Add Package"}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="subscription_type_id">Subscription Type *</Label>
                <select
                  id="subscription_type_id"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.subscription_type_id}
                  onChange={(e) => setFormData({ ...formData, subscription_type_id: Number(e.target.value) })}
                  required
                >
                  <option value="">Select Type</option>
                  {subscriptionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fee">Fee (KES) *</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="concurrent_access">Concurrent Devices *</Label>
                  <Input
                    id="concurrent_access"
                    type="number"
                    min="1"
                    value={formData.concurrent_access}
                    onChange={(e) => setFormData({ ...formData, concurrent_access: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="no_of_lessons">Number of Lessons *</Label>
                  <Input
                    id="no_of_lessons"
                    type="number"
                    min="0"
                    value={formData.no_of_lessons}
                    onChange={(e) => setFormData({ ...formData, no_of_lessons: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="watch_time_minutes">Total Watch Time (minutes) *</Label>
                  <Input
                    id="watch_time_minutes"
                    type="number"
                    min="1"
                    value={formData.watch_time_minutes}
                    onChange={(e) => setFormData({ ...formData, watch_time_minutes: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration_amount">Duration Amount *</Label>
                  <Input
                    id="duration_amount"
                    type="number"
                    min="1"
                    value={formData.duration_amount}
                    onChange={(e) => setFormData({ ...formData, duration_amount: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration_unit">Duration Unit *</Label>
                <select
                  id="duration_unit"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.duration_unit}
                  onChange={(e) => setFormData({ ...formData, duration_unit: e.target.value })}
                  required
                >
                  {DURATION_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
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