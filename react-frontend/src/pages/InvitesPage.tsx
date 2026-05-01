import { useEffect, useState, useCallback } from "react"
import { 
  RefreshCw, 
  Search, 
  Trash2, 
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  UserPlus,
  Link
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import Layout from "@/components/Layout"

interface Invite {
  id: number
  user_id: string
  invitee_email: string
  invitee_phone: string
  status: string
  referral_code: string
  invitee_join_date: string | null
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newInvite, setNewInvite] = useState({ invitee_email: "", invitee_phone: "" })

  const fetchInvites = useCallback(async () => {
    setIsLoading(true)
    try {
       const response = await api.get("/invites", {
         params: {
           page: currentPage,
           limit: 20,
           search: searchQuery || undefined
         }
       })
      
      let invitesData: Invite[] = []
      let totalCount = 0
      
      if (Array.isArray(response.data)) {
        invitesData = response.data as Invite[]
        totalCount = invitesData.length
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as any
        
        if (Array.isArray(data.records)) {
          invitesData = data.records as Invite[]
          totalCount = data.totalRecords || invitesData.length
        } else if (Array.isArray(data.data)) {
          invitesData = data.data as Invite[]
          totalCount = data.total || invitesData.length
        } else if (data.id) {
          invitesData = [data] as Invite[]
          totalCount = 1
        }
      }
      
      setInvites(invitesData)
      setTotal(totalCount)
      setTotalPages(Math.ceil(totalCount / 20))
    } catch (error: any) {
      console.error("Failed to fetch invites:", error)
      toast.error(`Failed to fetch invites: ${error.response?.status || 'Network error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchInvites()
  }

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post("/invites/add/", {
        invitee_email: newInvite.invitee_email,
        invitee_phone: newInvite.invitee_phone
      })
      toast.success("Invite sent successfully")
      setShowAddModal(false)
      setNewInvite({ invitee_email: "", invitee_phone: "" })
      fetchInvites()
    } catch (error) {
      console.error("Failed to send invite:", error)
      toast.error("Failed to send invite")
    }
  }

  const handleDeleteInvite = async (id: number) => {
    if (!confirm("Are you sure you want to delete this invite?")) return
    try {
      await api.get(`/invites/delete/${id}`)
      toast.success("Invite deleted successfully")
      fetchInvites()
    } catch (error) {
      console.error("Failed to delete invite:", error)
      toast.error("Failed to delete invite")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><XCircle className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Invites</h1>
            <p className="text-muted-foreground">Manage your referral invites</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Send Invite
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Invites</CardTitle>
            <CardDescription>
              Total: {total} invites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                placeholder="Search invites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button type="button" variant="outline" onClick={() => { setSearchQuery(""); fetchInvites(); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </form>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invites found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Phone</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Referral Code</th>
                        <th className="text-left p-3">Join Date</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{invite.id}</td>
                          <td className="p-3">
                            {invite.invitee_email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {invite.invitee_email}
                              </div>
                            ) : "-"}
                          </td>
                          <td className="p-3">
                            {invite.invitee_phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {invite.invitee_phone}
                              </div>
                            ) : "-"}
                          </td>
                          <td className="p-3">{getStatusBadge(invite.status)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Link className="h-4 w-4 text-muted-foreground" />
                              {invite.referral_code}
                            </div>
                          </td>
                          <td className="p-3">
                            {invite.invitee_join_date 
                              ? new Date(invite.invitee_join_date).toLocaleDateString() 
                              : "-"}
                          </td>
                          <td className="p-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteInvite(invite.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Send New Invite</CardTitle>
                <CardDescription>Enter invite details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddInvite} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newInvite.invitee_email}
                      onChange={(e) => setNewInvite({ ...newInvite, invitee_email: e.target.value })}
                      placeholder="invitee@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newInvite.invitee_phone}
                      onChange={(e) => setNewInvite({ ...newInvite, invitee_phone: e.target.value })}
                      placeholder="254712345678"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Send Invite
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}