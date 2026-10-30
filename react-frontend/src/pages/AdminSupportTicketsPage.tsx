import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Search, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Layout from "@/components/Layout"
import {
  supportService,
  type AdminSupportTicket,
  type SupportTicketStatus,
} from "@/services/support"

const pageSize = 20

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([])
  const [drafts, setDrafts] = useState<Record<number, { status: SupportTicketStatus; response: string }>>({})
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  const applyTickets = useCallback((result: { data: AdminSupportTicket[]; total: number }) => {
    setTickets(result.data)
    setTotal(result.total)
    setDrafts(Object.fromEntries(result.data.map((ticket) => [
      ticket.id,
      { status: ticket.status, response: ticket.admin_response || "" },
    ])))
  }, [])

  const loadTickets = useCallback(
    () => supportService.getAdminTickets(page, pageSize, filterStatus, search),
    [page, filterStatus, search]
  )

  const refreshTickets = useCallback(async () => {
    setIsLoading(true)
    try {
      applyTickets(await loadTickets())
    } catch (error) {
      console.error("Failed to load support requests:", error)
      toast.error("Failed to load support requests")
    } finally {
      setIsLoading(false)
    }
  }, [applyTickets, loadTickets])

  useEffect(() => {
    let active = true
    loadTickets()
      .then((result) => {
        if (active) applyTickets(result)
      })
      .catch((error: unknown) => {
        if (!active) return
        console.error("Failed to load support requests:", error)
        toast.error("Failed to load support requests")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [applyTickets, loadTickets])

  const updateDraft = (
    ticketId: number,
    field: "status" | "response",
    value: string
  ) => {
    setDrafts((current) => ({
      ...current,
      [ticketId]: {
        ...current[ticketId],
        [field]: value,
      },
    }))
  }

  const handleSave = async (ticket: AdminSupportTicket) => {
    const draft = drafts[ticket.id]
    if (!draft) return
    setSavingId(ticket.id)
    try {
      await supportService.updateAdminTicket(ticket.id, draft)
      toast.success(`Saved ${ticket.reference}`)
      await refreshTickets()
    } catch (error) {
      console.error("Failed to update support request:", error)
      toast.error("Failed to update support request")
    } finally {
      setSavingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h1 className="flex items-center gap-3 text-3xl font-bold">
                <MessageCircle className="h-8 w-8" />
                Client Support
              </h1>
              <p className="mt-2 text-slate-300">Review payment and lesson-access issues and send customers an update.</p>
            </div>
            <Button
              variant="outline"
              className="bg-white text-slate-800 hover:bg-slate-100"
              onClick={() => void refreshTickets()}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto space-y-6 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Support requests ({total})</CardTitle>
              <CardDescription>Guest reports include a payment reference for staff verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Search customer, subject, phone, or payment reference"
                    value={search}
                    onChange={(event) => {
                      setIsLoading(true)
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <select
                  className="rounded-md border bg-background px-3 py-2"
                  value={filterStatus}
                  onChange={(event) => {
                    setIsLoading(true)
                    setFilterStatus(event.target.value)
                    setPage(1)
                  }}
                  aria-label="Filter support requests by status"
                >
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {isLoading && tickets.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
                  No support requests found.
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => {
                    const draft = drafts[ticket.id] || { status: ticket.status, response: ticket.admin_response || "" }
                    return (
                      <article key={ticket.id} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm text-muted-foreground">{ticket.reference}</span>
                              <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                                {ticket.category.replace("_", " ")}
                              </span>
                              <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                                {ticket.status.replace("_", " ")}
                              </span>
                            </div>
                            <h2 className="mt-2 text-lg font-semibold">{ticket.subject}</h2>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
                            <div className="mt-3 space-y-1 text-sm">
                              <p><span className="font-medium">Customer:</span> {ticket.customer_name} · {ticket.customer_email} · {ticket.phone_number}</p>
                              <p><span className="font-medium">Payment reference:</span> {ticket.payment_reference || "Not provided"}</p>
                              <p className="text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="w-full space-y-3 lg:max-w-sm">
                            <div className="space-y-2">
                              <label htmlFor={`status-${ticket.id}`} className="text-sm font-medium">Request status</label>
                              <select
                                id={`status-${ticket.id}`}
                                className="w-full rounded-md border bg-background px-3 py-2"
                                value={draft.status}
                                onChange={(event) => updateDraft(ticket.id, "status", event.target.value)}
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In progress</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor={`response-${ticket.id}`} className="text-sm font-medium">Reply visible to customer</label>
                              <textarea
                                id={`response-${ticket.id}`}
                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                maxLength={5000}
                                placeholder="Add an update or instructions for the customer"
                                value={draft.response}
                                onChange={(event) => updateDraft(ticket.id, "response", event.target.value)}
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => void handleSave(ticket)}
                              disabled={savingId === ticket.id}
                            >
                              {savingId === ticket.id ? "Saving..." : "Save update"}
                            </Button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => {
                    setIsLoading(true)
                    setPage((value) => value - 1)
                  }}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => {
                    setIsLoading(true)
                    setPage((value) => value + 1)
                  }}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  )
}
