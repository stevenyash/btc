/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react"
import { 
  Users, 
  RefreshCw, 
  Search, 
  Trash2, 
  X,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Eye,
  UserPlus
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService, type User } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"
import { CanI } from "@/components/CanI"

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    usercode: "",
    role_id: 2,
    account_status: "active"
  })
  const [isCreating, setIsCreating] = useState(false)

  const fetchUsers = useCallback(async (page: number, role: string, status: string) => {
    try {
      const response = await adminService.getUsers(page, 20, role || undefined, status || undefined)
      const userData = response.data.map((u: any) => ({
        ...u,
        name: u.name || u.username || '',
        created_at: u.created_at || u.subscription_date || ''
      }))
      setUsers(userData)
      setTotal(response.total)
      setTotalPages(Math.ceil(response.total / 20))
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to fetch users")
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchUsers(currentPage, filterRole, filterStatus).finally(() => setIsLoading(false))
  }, [currentPage, filterRole, filterStatus, fetchUsers])

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active"
    
    setIsLoading(true)
    try {
      await adminService.updateUser(user.id, { status: newStatus })
      fetchUsers(currentPage, filterRole, filterStatus)
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error("Failed to update user:", error)
      toast.error("Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return

    setIsLoading(true)
    try {
      await adminService.deleteUser(id)
      fetchUsers(currentPage, filterRole, filterStatus)
      toast.success("User deleted successfully")
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Failed to delete user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.phone || !newUser.usercode) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsCreating(true)
    try {
      await adminService.createUser(newUser)
      toast.success("User created successfully")
      setIsCreateModalOpen(false)
      setNewUser({
        username: "",
        email: "",
        phone: "",
        usercode: "",
        role_id: 2,
        account_status: "active"
      })
      fetchUsers(currentPage, filterRole, filterStatus)
    } catch (error) {
      console.error("Failed to create user:", error)
      toast.error("Failed to create user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleViewUser = async (user: User) => {
    setIsLoading(true)
    try {
      const userData = await adminService.getUser(user.id)
      setSelectedUser(userData)
      setIsViewModalOpen(true)
    } catch (error) {
      console.error("Failed to fetch user details:", error)
      toast.error("Failed to load user details")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').includes(searchQuery)
  )

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500">Admin</Badge>
      case "marketer":
        return <Badge className="bg-blue-500">Marketer</Badge>
      case "subscriber":
        return <Badge className="bg-green-500">Subscriber</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case "inactive":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>
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
                <Users className="h-8 w-8" />
                User Management
              </h1>
              <p className="text-slate-300">
                Manage all registered users on the platform
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
              <CanI action="add" resource="users">
                  {can => can && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  )}
              </CanI>
                <Button 
                  variant="outline" 
                  className="bg-white text-slate-800 hover:bg-slate-100"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      await fetchUsers(currentPage, filterRole, filterStatus)
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
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
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
                      placeholder="Search by name, email, or phone..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <select 
                  className="px-3 py-2 border rounded-md bg-background"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="marketer">Marketer</option>
                  <option value="subscriber">Subscriber</option>
                </select>
                <select 
                  className="px-3 py-2 border rounded-md bg-background"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Users ({total})</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && users.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Contact</th>
                          <th className="text-left p-3 font-medium">Role</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Created</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {user.name?.charAt(0).toUpperCase() || "U"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{user.name || "N/A"}</p>
                                  <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {user.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate max-w-[200px]">{user.email}</span>
                                  </div>
                                )}
                                {user.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span>{user.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {getRoleBadge(user.role || "subscriber")}
                            </td>
                            <td className="p-3">
                              {getStatusBadge(user.status || "active")}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </td>
                             <td className="p-3">
                               <div className="flex gap-1">
                                 <CanI action="view" resource="users">
                                   {can => can && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleViewUser(user)}
                                       title="View Details"
                                     >
                                       <Eye className="h-4 w-4 text-blue-500" />
                                     </Button>
                                   )}
                                 </CanI>
                                 <CanI action="edit" resource="users">
                                   {can => can && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleToggleUserStatus(user)}
                                       title={user.status === "active" ? "Deactivate" : "Activate"}
                                     >
                                       {user.status === "active" ? (
                                         <UserX className="h-4 w-4 text-amber-500" />
                                       ) : (
                                         <UserCheck className="h-4 w-4 text-green-500" />
                                       )}
                                     </Button>
                                   )}
                                 </CanI>
                                 <CanI action="delete" resource="users">
                                   {can => can && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleDeleteUser(user.id)}
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
                        <ChevronLeft className="h-4 w-4 mr-1" />
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
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Details Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">User Details</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsViewModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-medium">
                    {selectedUser.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{selectedUser.name || "N/A"}</h4>
                  <p className="text-sm text-muted-foreground">ID: {selectedUser.id}</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedUser.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{selectedUser.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role:</span>
                  <Badge className={selectedUser.role === "admin" ? "bg-purple-500" : 
                                   selectedUser.role === "marketer" ? "bg-blue-500" : 
                                   selectedUser.role === "subscriber" ? "bg-green-500" : 
                                   "bg-secondary"}>
                    {selectedUser.role?.toUpperCase() || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={selectedUser.status === "active" ? "bg-green-500" : "bg-red-500"}>
                    {selectedUser.status?.toUpperCase() || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">User Role ID:</span>
                  <span>{selectedUser.user_role_id || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Subscription Code:</span>
                  <span className="font-mono text-xs">{selectedUser.subscription_code || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(selectedUser.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Create New User</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input 
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input 
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usercode">Usercode *</Label>
                <Input 
                  id="usercode"
                  type="password"
                  value={newUser.usercode}
                  onChange={(e) => setNewUser({...newUser, usercode: e.target.value})}
                  placeholder="Enter usercode"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select 
                  id="role"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={newUser.role_id}
                  onChange={(e) => setNewUser({...newUser, role_id: parseInt(e.target.value)})}
                >
                  <option value={2}>Subscriber</option>
                  <option value={3}>Marketer</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={newUser.account_status}
                  onChange={(e) => setNewUser({...newUser, account_status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
