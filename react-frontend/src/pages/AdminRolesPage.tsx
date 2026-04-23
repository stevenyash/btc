/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Shield, Plus, Pencil, Trash2, RefreshCw,  Save, X, Users, Search, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Layout from "@/components/Layout"
import { api } from "@/services/api"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Role {
  role_id: number
  role_name: string
  created_at?: string
  updated_at?: string
}

interface RolePermission {
  id: number
  role_id: number
  page: string
  list: number
  view: number
  edit: number
  remove: number
  store: number
}

interface User {
  id: number
  username: string
  phone: string
  email: string
  role_name: string
  role_id: number
}

interface UserPrivilege {
  id: number
  user_id: number
  privilege: string
  granted_by: number
  granted_at: string
  is_active: boolean
  expires_at: string | null
}

const PAGES = [
  { id: "users", name: "Users" },
  { id: "transactions", name: "Transactions" },
  { id: "subscriptions", name: "Subscriptions" },
  { id: "packages", name: "Packages" },
  { id: "lessons", name: "Lessons" },
  { id: "marketers", name: "Marketers" },
  { id: "marketerearnings", name: "Marketer Earnings" },
  { id: "grades", name: "Grades" },
  { id: "learning_areas", name: "Learning Areas" },
  { id: "topics", name: "Topics" },
  { id: "subtopics", name: "Subtopics" },
  { id: "weekendtutorials", name: "Weekend Tutorials" },
  { id: "gotoclass", name: "GoToClass" },
]

export default function AdminRolesPage() {
  
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null)
  const [showRoleForm, setShowRoleForm] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userPrivileges, setUserPrivileges] = useState<UserPrivilege[]>([])
  const [availablePrivileges, setAvailablePrivileges] = useState<string[]>([])

   const fetchRoles = async () => {
     try {
       setLoading(true)
       const response = await api.get("/admin/roles")
       setRoles(response.data?.data || [])
     } catch (err) {
       console.error("Failed to fetch roles:", err)
     } finally {
       setLoading(false)
     }
   }

const fetchPermissions = async (roleId: number) => {
      try {
        const response = await api.get(`/rolepermissions/by-role/${roleId}`)
        setPermissions(response.data || [])
      } catch (err) {
        console.error("Failed to fetch permissions:", err)
      }
    }

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await api.get("/users?limit=100")
        const data = response.data?.data || response.data || []
        const usersList = Array.isArray(data) ? data : data.records || []
        setUsers(usersList.map((u: any) => ({
          id: u.id,
          username: u.username,
          phone: u.phone,
          email: u.email,
          role_name: u.role_name,
          role_id: u.role_id
        })))
      } catch (err) {
        console.error("Failed to fetch users:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchAvailablePrivileges = async () => {
      try {
        const response = await api.get("/userprivileges/available-privileges")
        setAvailablePrivileges(response.data || [])
      } catch (err) {
        console.error("Failed to fetch available privileges:", err)
      }
    }

    const fetchUserPrivileges = async (userId: number) => {
      try {
        const response = await api.get(`/userprivileges/user/${userId}`)
        setUserPrivileges(response.data || [])
      } catch (err) {
        console.error("Failed to fetch user privileges:", err)
      }
    }

useEffect(() => {
      const loadData = async () => {
        await fetchRoles()
        await fetchUsers()
        await fetchAvailablePrivileges()
      }
      loadData()
    }, [])

const handleSelectRole = async (role: Role) => {
     setSelectedRole(role)
     await fetchPermissions(role.role_id)
   }

   const handleSelectUser = async (user: User) => {
     setSelectedUser(user)
     await fetchUserPrivileges(user.id)
   }

   const handleGrantPrivilege = async (privilege: string) => {
     if (!selectedUser) return
     setSaving(true)
     try {
       await api.post("/userprivileges/grant-multiple", {
         user_id: selectedUser.id,
         privileges: [privilege]
       })
       await fetchUserPrivileges(selectedUser.id)
     } catch (err) {
       console.error("Failed to grant privilege:", err)
     } finally {
       setSaving(false)
     }
   }

   const handleRevokePrivilege = async (privilege: string) => {
     if (!selectedUser) return
     setSaving(true)
     try {
       await api.post("/userprivileges/revoke", {
         user_id: selectedUser.id,
         privilege
       })
       await fetchUserPrivileges(selectedUser.id)
     } catch (err) {
       console.error("Failed to revoke privilege:", err)
     } finally {
       setSaving(false)
     }
   }

   const filteredUsers = users.filter((user) =>
     user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.phone?.includes(searchQuery) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase())
   )

  const handleSaveRole = async () => {
    if (!editingRole?.role_name) return
    setSaving(true)
    try {
      if (editingRole.role_id) {
        await api.put(`/admin/roles/${editingRole.role_id}`, editingRole)
      } else {
        await api.post("/admin/roles", editingRole)
      }
      setShowRoleForm(false)
      setEditingRole(null)
      await fetchRoles()
    } catch (err) {
      console.error("Failed to save role:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return
    try {
      await api.delete(`/admin/roles/${roleId}`)
      await fetchRoles()
      if (selectedRole?.role_id === roleId) {
        setSelectedRole(null)
        setPermissions([])
      }
    } catch (err) {
      console.error("Failed to delete role:", err)
    }
  }

const handlePermissionChange = async (
    pageId: string,
    field: keyof RolePermission,
    value: number
  ) => {
    if (!selectedRole) return
    const existingPerm = permissions.find((p) => p.page === pageId)
    const permData = {
      role_id: selectedRole.role_id,
      page: pageId,
      list: existingPerm?.list || 0,
      view: existingPerm?.view || 0,
      edit: existingPerm?.edit || 0,
      remove: existingPerm?.remove || 0,
      store: existingPerm?.store || 0,
      [field]: value,
    }
    try {
      if (existingPerm) {
        await api.post(`/rolepermissions/edit/${existingPerm.id}`, permData)
      } else {
        await api.post("/rolepermissions/add", permData)
      }
      await fetchPermissions(selectedRole.role_id)
    } catch (err) {
      console.error("Failed to update permission:", err)
    }
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Shield className="h-8 w-8" />
                Roles & Permissions
              </h1>
              <p className="text-slate-300">
                Manage user roles and their page access permissions
              </p>
            </div>
            <Button
              variant="secondary"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                setEditingRole({ role_name: "" })
                setShowRoleForm(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="roles" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Permissions
                </TabsTrigger>
                <TabsTrigger value="user-privileges" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  User Special Privileges
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roles">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Roles</CardTitle>
                      <CardDescription>Available roles in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {roles.map((role) => (
                          <div
                            key={role.role_id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedRole?.role_id === role.role_id
                                ? "bg-primary/10 border border-primary"
                                : "bg-muted/50 hover:bg-muted"
                            }`}
                            onClick={() => handleSelectRole(role)}
                          >
                            <div>
                              <p className="font-medium">{role.role_name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {role.role_id}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingRole(role)
                                  setShowRoleForm(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteRole(role.role_id)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>
                        Permissions {selectedRole && `- ${selectedRole.role_name}`}
                      </CardTitle>
                      <CardDescription>
                        Configure access rights for each page
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedRole ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Page</th>
                                <th className="text-center p-2">List</th>
                                <th className="text-center p-2">View</th>
                                <th className="text-center p-2">Edit</th>
                                <th className="text-center p-2">Remove</th>
                                <th className="text-center p-2">Store</th>
                              </tr>
                            </thead>
                            <tbody>
                              {PAGES.map((page) => {
                                const perm = permissions.find(
                                  (p) => p.page === page.id
                                )
                                return (
                                  <tr key={page.id} className="border-b">
                                    <td className="p-2 font-medium">{page.name}</td>
                                    {(["list", "view", "edit", "remove", "store"] as const).map(
                                      (field) => (
                                        <td key={field} className="text-center p-2">
                                          <Checkbox
                                            checked={perm?.[field] === 1}
                                            onCheckedChange={(checked) =>
                                              handlePermissionChange(
                                                page.id,
                                                field,
                                                checked ? 1 : 0
                                              )
                                            }
                                          />
                                        </td>
                                      )
                                    )}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Select a role to manage permissions</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="user-privileges">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Users</CardTitle>
                      <CardDescription>Search for a user to manage special privileges</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, phone or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedUser?.id === user.id
                                ? "bg-primary/10 border border-primary"
                                : "bg-muted/50 hover:bg-muted"
                            }`}
                            onClick={() => handleSelectUser(user)}
                          >
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.phone} • {user.role_name}
                              </p>
                            </div>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>
                        Special Privileges {selectedUser && `- ${selectedUser.username}`}
                      </CardTitle>
                      <CardDescription>
                        Manage special permissions for individual users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedUser ? (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-3">Current Privileges</h4>
                            {userPrivileges.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {userPrivileges.map((priv) => (
                                  <Badge
                                    key={priv.id}
                                    variant="default"
                                    className="flex items-center gap-2 px-3 py-1"
                                  >
                                    {priv.privilege}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                                      onClick={() => handleRevokePrivilege(priv.privilege)}
                                      disabled={saving}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No special privileges granted</p>
                            )}
                          </div>

                          <div className="border-t pt-6">
                            <h4 className="font-medium mb-3">Grant New Privilege</h4>
                            <div className="flex flex-wrap gap-2">
                              {availablePrivileges
                                .filter((priv) => !userPrivileges.some((up) => up.privilege === priv))
                                .map((privilege) => (
                                  <Badge
                                    key={privilege}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/10 px-3 py-1"
                                    onClick={() => handleGrantPrivilege(privilege)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {privilege}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Select a user to manage special privileges</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {showRoleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingRole?.role_id ? "Edit Role" : "Add Role"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <Input
                  value={editingRole?.role_name || ""}
                  onChange={(e) =>
                    setEditingRole((prev) => ({
                      ...prev,
                      role_name: e.target.value,
                    }))
                  }
                  placeholder="Enter role name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoleForm(false)
                    setEditingRole(null)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSaveRole} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}