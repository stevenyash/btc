import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { isAxiosError } from "axios"
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Layout from "@/components/Layout"
import { useAuthStore } from "@/stores/useAuthStore"
import {
  supportService,
  type CreatedSupportTicket,
  type SupportTicketCategory,
  type TrackedSupportTicket,
} from "@/services/support"

const blankForm = {
  name: "",
  email: "",
  phone: "",
  paymentReference: "",
  category: "lesson_access" as SupportTicketCategory,
  subject: "",
  description: "",
}

export default function ContactUsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [form, setForm] = useState(() => ({
    ...blankForm,
    name: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<CreatedSupportTicket | null>(null)
  const [trackingCode, setTrackingCode] = useState("")
  const [trackedTicket, setTrackedTicket] = useState<TrackedSupportTicket | null>(null)
  const [submitError, setSubmitError] = useState("")
  const [trackError, setTrackError] = useState("")
  const [isTracking, setIsTracking] = useState(false)

  const updateForm = (field: keyof typeof blankForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setCreatedTicket(null)
    setSubmitError("")
    try {
      const ticket = await supportService.submitTicket(form)
      setCreatedTicket(ticket)
      setTrackingCode(ticket.trackingCode)
      setTrackedTicket(null)
      setTrackError("")
    } catch (error) {
      const message = isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined
      setSubmitError(message || "We couldn't submit your request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTrackTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsTracking(true)
    setTrackError("")
    setTrackedTicket(null)
    try {
      setTrackedTicket(await supportService.trackTicket(trackingCode.trim()))
    } catch (error) {
      const message = isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined
      setTrackError(message || "We couldn't find that support request. Check the tracking code.")
    } finally {
      setIsTracking(false)
    }
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Get In <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Need help with a payment or lesson? Send a support request and track its progress here.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <p className="text-muted-foreground mb-8">
                  Reach out to us through any of these channels. We're here to help!
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-muted-foreground">+254 (0) 722 310 358</p>
                    <p className="text-sm text-muted-foreground">Mon - Fri, 8am - 6pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground">info@bitstutorconnect.co.ke</p>
                    <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Office</h3>
                    <p className="text-muted-foreground">P.O Box 955-90200</p>
                    <p className="text-muted-foreground">Kitui, Kenya</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-muted-foreground">Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p className="text-muted-foreground">Saturday: 9:00 AM - 2:00 PM</p>
                    <p className="text-muted-foreground">Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <Button asChild variant="outline" size="icon">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="icon">
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="icon">
                    <a href="https://wa.me/254722310358" target="_blank" rel="noopener noreferrer">
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Report a Problem</h2>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        maxLength={100}
                        value={form.name}
                        onChange={(event) => updateForm("name", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                        maxLength={255}
                        value={form.email}
                        onChange={(event) => updateForm("email", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+254 700 000 000"
                        required
                        maxLength={20}
                        value={form.phone}
                        onChange={(event) => updateForm("phone", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Issue Type</Label>
                      <select
                        id="category"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={form.category}
                        onChange={(event) => updateForm("category", event.target.value)}
                      >
                        <option value="lesson_access">Paid but cannot view a lesson</option>
                        <option value="payment">Payment or M-Pesa issue</option>
                        <option value="account">Account issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentReference">
                        M-Pesa receipt or checkout reference{!isAuthenticated ? " (required for guests)" : ""}
                      </Label>
                      <Input
                        id="paymentReference"
                        type="text"
                        placeholder="e.g. QWE1234567"
                        required={!isAuthenticated}
                        maxLength={100}
                        value={form.paymentReference}
                        onChange={(event) => updateForm("paymentReference", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="How can we help?"
                        required
                        minLength={5}
                        maxLength={150}
                        value={form.subject}
                        onChange={(event) => updateForm("subject", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        className="w-full min-h-[150px] px-3 py-2 border rounded-md bg-background"
                        placeholder="Tell us more about your inquiry..."
                        required
                        minLength={10}
                        maxLength={5000}
                        value={form.description}
                        onChange={(event) => updateForm("description", event.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Support Request"}
                    </Button>
                  </form>

                  {submitError && <p role="alert" className="mt-4 text-sm text-red-600">{submitError}</p>}
                  {createdTicket && (
                    <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-900">
                      <p className="font-semibold">Request submitted: {createdTicket.reference}</p>
                      <p>Save this private tracking code to check status or read our reply:</p>
                      <p className="mt-2 break-all rounded bg-white p-2 font-mono">{createdTicket.trackingCode}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    By sending this message, you agree to our{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-2">Track a Support Request</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the private tracking code shown after submitting your request.
                  </p>
                  <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleTrackTicket}>
                    <Input
                      aria-label="Support tracking code"
                      placeholder="Paste your tracking code"
                      value={trackingCode}
                      onChange={(event) => setTrackingCode(event.target.value)}
                      required
                    />
                    <Button type="submit" disabled={isTracking}>
                      {isTracking ? "Checking..." : "Check status"}
                    </Button>
                  </form>
                  {trackError && <p role="alert" className="mt-3 text-sm text-red-600">{trackError}</p>}
                  {trackedTicket && (
                    <div className="mt-4 rounded-md border p-4">
                      <p className="font-semibold">{trackedTicket.reference}: {trackedTicket.subject}</p>
                      <p className="mt-1 text-sm capitalize">Status: {trackedTicket.status.replace("_", " ")}</p>
                      {trackedTicket.response && (
                        <div className="mt-3 rounded bg-muted p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Response from support</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{trackedTicket.response}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Response Promise */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Quick Response Guarantee</p>
                    <p className="text-sm text-muted-foreground">
                      We aim to respond to all inquiries within 2 hours during business hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
