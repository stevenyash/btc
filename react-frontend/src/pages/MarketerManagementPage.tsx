/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react"
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Trash2, 
  X,
  CheckCircle,
  XCircle,
  UserPlus,
  Copy,
  Search,
  Mail,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { adminService, type Marketer, type RecentUser } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"
import { CanI } from "@/components/CanI"

export default function MarketerManagementPage() {
  const navigate = useNavigate()
  const [marketers, setMarketers] = useState<Marketer[]>([])
  const [availableUsers, setAvailableUsers] = useState<RecentUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<RecentUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [createMode, setCreateMode] = useState<"existing" | "new">("existing")
  const [newMarketer, setNewMarketer] = useState({ name: "", email: "", phone: "", referral_code: "" })
  const [resendingCredentials, setResendingCredentials] = useState<number | null>(null)

  const fetchMarketers = useCallback(async (page: number) => {
    try {
      const response = await adminService.getMarketers(page, 20)
      setMarketers(response.data)
      setTotal(response.total)
      setTotalPages(Math.ceil(response.total / 20))
    } catch (error) {
      console.error("Failed to fetch marketers:", error)
    }
  }, [])

  const fetchAvailableUsers = async () => {
    try {
      const users = await adminService.getAvailableUsersForMarketer()
      setAvailableUsers(users)
    } catch (error) {
      console.error("Failed to fetch available users:", error)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetchMarketers(currentPage),
      fetchAvailableUsers()
    ]).finally(() => setIsLoading(false))
  }, [currentPage, fetchMarketers])

  const handleCreateMarketer = async () => {
    if (createMode === "existing" && !selectedUser) return
    if (createMode === "new" && (!newMarketer.name || !newMarketer.email || !newMarketer.phone)) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setIsLoading(true)
    try {
      const data = createMode === "existing" 
        ? { user_id: selectedUser!.id, referral_code: newMarketer.referral_code || undefined }
        : { name: newMarketer.name, email: newMarketer.email, phone: newMarketer.phone, referral_code: newMarketer.referral_code || undefined }
      
      await adminService.createMarketer(data)
      setIsModalOpen(false)
      setSelectedUser(null)
      setNewMarketer({ name: "", email: "", phone: "", referral_code: "" })
      fetchMarketers(currentPage)
      fetchAvailableUsers()
      toast.success("Marketer created successfully")
    } catch (error: any) {
      console.error("Failed to create marketer:", error)
      toast.error(error?.response?.data?.error || "Failed to create marketer")
    } finally {
      setIsLoading(false)
    }
  }

    const handleDeleteMarketer = async (id: number) => {
    if (!confirm("Are you sure you want to remove this marketer?")) return
    
    setIsLoading(true)
    try {
      await adminService.deleteMarketer(id)
      fetchMarketers(currentPage)
    } catch (error) {
      console.error("Failed to delete marketer:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleResendCredentials = async (marketer: Marketer) => {
    setResendingCredentials(marketer.id)
    try {
      await adminService.resendMarketerCredentials(marketer.id)
      toast.success("Credentials resent successfully")
    } catch (error: any) {
      console.error("Failed to resend credentials:", error)
      toast.error(error?.response?.data?.error || "Failed to resend credentials")
    } finally {
      setResendingCredentials(null)
    }
  }

  const handleToggleStatus = async (marketer: Marketer) => {
    const newStatus = marketer.status === "active" ? "inactive" : "active"
    
    setIsLoading(true)
    try {
      await adminService.updateMarketer(marketer.id, { status: newStatus })
      fetchMarketers(currentPage)
    } catch (error) {
      console.error("Failed to update marketer:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMarketers = marketers.filter(m => 
    m.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Referral code copied!")
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Users className="h-8 w-8" />
                Marketer Management
              </h1>
              <p className="text-slate-300">
                Manage platform marketers, track performance and earnings
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
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  setCreateMode("existing")
                  setSelectedUser(null)
                  setNewMarketer({ name: "", email: "", phone: "", referral_code: "" })
                  setIsModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Marketer
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name, email, or referral code..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      await fetchMarketers(currentPage)
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Marketers ({total})</CardTitle>
              <CardDescription>View and manage all registered marketers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && marketers.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMarketers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No marketers found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Marketer</th>
                          <th className="text-left py-3 px-4 font-medium">Referral Code</th>
                          <th className="text-left py-3 px-4 font-medium">Performance</th>
                          <th className="text-left py-3 px-4 font-medium">Earnings</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Joined</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMarketers.map((marketer) => (
                          <tr key={marketer.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{marketer.user_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{marketer.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {marketer.referral_code || "N/A"}
                                </code>
                                {marketer.referral_code && (
                                  <button 
                                    onClick={() => copyReferralCode(marketer.referral_code)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm">
                                    <p>Invites: <span className="font-semibold">{marketer.total_invites || 0}</span></p>
                                    <p>Active: <span className="font-semibold text-green-600">{marketer.active_referrals || 0}</span></p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm">
                                    <p className="font-semibold text-green-600">
                                      KES {formatCurrency(marketer.total_earnings || 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Pending: KES {formatCurrency(marketer.pending_earnings || 0)}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge 
                                    className={marketer.status === "active" ? "bg-green-500" : "bg-red-500"}
                                  >
                                    {marketer.status === "active" ? (
                                      <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                                    ) : (
                                      <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                                    )}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                  {formatDate(marketer.created_at)}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleToggleStatus(marketer)}
                                    >
                                      {marketer.status === "active" ? (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      )}
                                    </Button>
                                    <CanI action="delete" resource="marketers">
                                      {can => can && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleDeleteMarketer(marketer.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      )}
                                    </CanI>
                                    <CanI action="resendCredentials" resource="marketers">
                                      {can => can && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleResendCredentials(marketer)}
                                       disabled={resendingCredentials === marketer.id}
                                     >
                                       {resendingCredentials === marketer.id ? (
                                         <>
                                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                           Sending...
                                         </>
                                       ) : (
                                         <>
                                           <Mail className="mr-2 h-4 w-4" />
                                           Resend Credentials
                                         </>
                                       )}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Marketer</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedUser(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "existing" | "new")}>
                <TabsList className="w-full">
                  <TabsTrigger value="existing" className="flex-1">From User</TabsTrigger>
                  <TabsTrigger value="new" className="flex-1">New Marketer</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-4">
                  <Label>Select User</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-auto">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No available users to promote
                      </p>
                    ) : (
                      availableUsers.map((user) => (
                        <button
                          key={user.id}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedUser?.id === user.id 
                              ? "border-primary bg-primary/10" 
                              : "border-muted hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-full">
                              <UserPlus className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="new" className="mt-4 space-y-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={newMarketer.name}
                      onChange={(e) => setNewMarketer({ ...newMarketer, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newMarketer.email}
                      onChange={(e) => setNewMarketer({ ...newMarketer, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={newMarketer.phone}
                      onChange={(e) => setNewMarketer({ ...newMarketer, phone: e.target.value })}
                      placeholder="e.g. 254712345678"
                    />
                  </div>
                  <div>
                    <Label>Referral Code (optional)</Label>
                    <Input
                      value={newMarketer.referral_code}
                      onChange={(e) => setNewMarketer({ ...newMarketer, referral_code: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsModalOpen(false)
                    setSelectedUser(null)
                    setNewMarketer({ name: "", email: "", phone: "", referral_code: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateMarketer}
                  disabled={
                    (createMode === "existing" && !selectedUser) ||
                    (createMode === "new" && (!newMarketer.name || !newMarketer.email || !newMarketer.phone)) ||
                    isLoading
                  }
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Add Marketer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}
