import { Link } from "react-router-dom"
import { FileText, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Layout from "@/components/Layout"

export default function TermsOfServicePage() {
  const lastUpdated = "January 1, 2025"

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using Bits Tutor Connect. By accessing or using our service, you agree to be bound by these terms.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardContent className="p-8 prose prose-slate max-w-none">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-6">
                  By accessing or using Bits Tutor Connect ("the Platform"), you agree to be bound by these Terms of Service ("Terms") and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our service.
                </p>

                <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground mb-6">
                  Bits Tutor Connect is an online learning platform that provides video lessons, weekend tutorials, and educational resources to students. The service includes both free and paid content accessible via subscription or individual purchase.
                </p>

                <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground mb-6">
                  To access certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your usercode and password</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Be responsible for all activities that occur under your account</li>
                  <li>Not share your account credentials with others</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">4. Subscriptions & Payments</h2>
                <p className="text-muted-foreground mb-6">
                  All subscriptions and purchases are subject to the following terms:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li><strong>Fees:</strong> All fees are stated in Kenyan Shillings (KES). Prices are inclusive of VAT where applicable.</li>
                  <li><strong>Payment:</strong> We accept M-Pesa as our primary payment method. All payments are processed securely through our payment partners.</li>
                  <li><strong>Refunds:</strong> We offer a 7-day money-back guarantee for new subscriptions. Refund requests must be submitted within 7 days of purchase. Individual lesson purchases are non-refundable.</li>
                  <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Access will continue until the end of your current billing period. No prorated refunds are issued for early cancellation.</li>
                  <li><strong>Renewals:</strong> Subscriptions renew automatically unless cancelled before the renewal date. You will be charged the applicable fee for each renewal period.</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">5. Content & Intellectual Property</h2>
                <p className="text-muted-foreground mb-6">
                  All content on the Platform, including video lessons, text, graphics, logos, and software, is the property of Bits Tutor Connect or its licensors and is protected by copyright and other intellectual property laws.
                </p>
                <p className="text-muted-foreground mb-6">
                  <strong>You may:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Access and view content for personal, non-commercial use</li>
                  <li>Download content for offline viewing within the app (where available)</li>
                </ul>
                <p className="text-muted-foreground mb-6">
                  <strong>You may NOT:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Reproduce, distribute, or publicly display any content</li>
                  <li>Create derivative works from our content</li>
                  <li>Share your account or content with others</li>
                  <li>Record, screenshot, or capture video lessons</li>
                  <li>Use content for commercial purposes</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">6. User Conduct</h2>
                <p className="text-muted-foreground mb-6">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Impersonate any person or entity</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use automated tools to access the platform (except for search engines)</li>
                  <li>Interfere with other users' enjoyment of the service</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">7. Weekend Tutorials</h2>
                <p className="text-muted-foreground mb-6">
                  Weekend tutorials are live online sessions conducted via Google Meet. By registering for a tutorial, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Join sessions on time using the provided link</li>
                  <li>Maintain appropriate behavior during sessions</li>
                  <li>Not record or share session links with non-registered users</li>
                  <li>Respect tutors and fellow students</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-6">
                  Bits Tutor Connect shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or relating to your use of our service.
                </p>

                <h2 className="text-2xl font-bold mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground mb-6">
                  The service is provided "as is" and "as available" without warranties of any kind. We do not guarantee that:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>The service will be uninterrupted or error-free</li>
                  <li>Content will be accurate or complete</li>
                  <li>Defects will be corrected</li>
                  <li>The platform will be free of viruses or harmful components</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
                <p className="text-muted-foreground mb-6">
                  We reserve the right to suspend or terminate your account at our sole discretion, without prior notice or liability, for any reason including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Non-payment of fees</li>
                  <li>Inactivity over an extended period</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
                <p className="text-muted-foreground mb-6">
                  These Terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes arising from these terms or your use of the service shall be resolved in the courts of Kenya.
                </p>

                <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground mb-6">
                  We reserve the right to modify these terms at any time. We will provide notice of significant changes by posting the updated terms on this page with a revised "Last updated" date. Your continued use of the service after changes constitutes acceptance of the new terms.
                </p>

                <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-muted p-6 rounded-lg mb-8">
                  <p className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <strong>Email:</strong> legal@bitstutorconnect.co.ke
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <strong>Phone:</strong> +254 722 310 358
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button asChild variant="outline">
                    <Link to="/privacy">View Privacy Policy</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/contactus">Contact Us</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  )
}
