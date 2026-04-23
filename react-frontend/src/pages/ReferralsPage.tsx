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
  Link,
  Copy,
  Share2,
  Users,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api } from "@/services/api"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"

interface Referral {
  id: number
  user_id: string
  invitee_email: string
  invitee_phone: string
  status: string
  referral_code: string
  invitee_join_date: string | null
  created_at?: string
}

export default function ReferralsPage() {
  const navigate = useNavigate()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    conversionRate: 0
  })

  const fetchReferrals = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/invites", {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined
      })
      
      let referralsData: Referral[] = []
      let totalCount = 0
      
      if (Array.isArray(response.data)) {
        referralsData = response.data as Referral[]
        totalCount = referralsData.length
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as any
        
        if (Array.isArray(data.records)) {
          referralsData = data.records as Referral[]
          totalCount = data.totalRecords || referralsData.length
        } else if (Array.isArray(data.data)) {
          referralsData = data.data as Referral[]
          totalCount = data.total || referralsData.length
        } else if (data.id) {
          referralsData = [data] as Referral[]
          totalCount = 1
        }
      }
      
      setReferrals(referralsData)
      setTotal(totalCount)
      setTotalPages(Math.ceil(totalCount / 20))
      
      const activeCount = referralsData.filter(r => r.status === 'active').length
      const pendingCount = referralsData.filter(r => r.status === 'pending').length
      const conversionRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
      
      setStats({
        total: totalCount,
        active: activeCount,
        pending: pendingCount,
        conversionRate
      })
    } catch (error: any) {
      console.error("Failed to fetch referrals:", error)
      toast.error(`Failed to fetch referrals: ${error.response?.status || 'Network error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchReferrals()
  }

  const handleDeleteReferral = async (id: number) => {
    if (!confirm("Are you sure you want to delete this referral?")) return
    try {
      await api.get(`/invites/delete/${id}`)
      toast.success("Referral deleted successfully")
      fetchReferrals()
    } catch (error) {
      console.error("Failed to delete referral:", error)
      toast.error("Failed to delete referral")
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
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

  const copyReferralLink = (code: string) => {
    const baseUrl = window.location.origin
    const referralLink = `${baseUrl}?ref=${code}`
    navigator.clipboard.writeText(referralLink)
    toast.success("Referral link copied!")
  }

  const shareReferral = async (code: string) => {
    const baseUrl = window.location.origin
    const referralLink = `${baseUrl}?ref=${code}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join BTC Learning Platform",
          text: "Join me on BTC Learning Platform and start your learning journey!",
          url: referralLink,
        })
      } catch {
        copyReferralLink(code)
      }
    } else {
      copyReferralLink(code)
    }
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-purple-600 via-primary to-blue-600 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Users className="h-8 w-8" />
                My Referrals
              </h1>
              <p className="text-purple-100">
                Track and manage your referral invites
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={() => navigate("/invites/add")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {stats.conversionRate}%
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by email or phone..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="secondary">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setSearchQuery(""); fetchReferrals(); }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Referral List</CardTitle>
              <CardDescription>
                Total: {total} referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && referrals.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No referrals found</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate("/invites/add")}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Your First Invite
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Email</th>
                          <th className="text-left py-3 px-4 font-medium">Phone</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Referral Code</th>
                          <th className="text-left py-3 px-4 font-medium">Joined</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral) => (
                          <tr key={referral.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              {referral.invitee_email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {referral.invitee_email}
                                </div>
                              ) : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {referral.invitee_phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {referral.invitee_phone}
                                </div>
                              ) : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(referral.status)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {referral.referral_code || "N/A"}
                                </code>
                                {referral.referral_code && (
                                  <>
                                    <button 
                                      onClick={() => copyReferralLink(referral.referral_code)}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Copy link"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => shareReferral(referral.referral_code)}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Share"
                                    >
                                      <Share2 className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {formatDate(referral.invitee_join_date)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteReferral(referral.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
        </div>
      </section>
    </Layout>
  )
}