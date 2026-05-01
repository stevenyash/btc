import { Link } from "react-router-dom"
import { Shield, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Layout from "@/components/Layout"

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 1, 2025"

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We take your privacy seriously. Learn how we collect, use, and protect your personal information.
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
                <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-6">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Name, email address, and phone number</li>
                  <li>Username and usercode for authentication</li>
                  <li>Payment information (processed securely via M-Pesa)</li>
                  <li>Learning progress and subscription details</li>
                  <li>Communications you send to us</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-6">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send transactional notifications and updates</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze usage patterns</li>
                  <li>Protect against fraudulent or illegal activity</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">3. Data Storage & Security</h2>
                <p className="text-muted-foreground mb-6">
                  Your data is stored securely on our servers. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <p className="text-muted-foreground mb-6">
                  Payment transactions are processed through M-Pesa's secure payment gateway. We do not store full credit/debit card details.
                </p>

                <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
                <p className="text-muted-foreground mb-6">
                  We do not sell your personal information. We may share your data with:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Service providers who assist our operations (hosting, payment processing)</li>
                  <li>Legal authorities when required by law</li>
                  <li>Third parties with your consent</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
                <p className="text-muted-foreground mb-6">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6 text-muted-foreground">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Data portability</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4">6. Cookies & Tracking</h2>
                <p className="text-muted-foreground mb-6">
                  We use cookies and similar tracking technologies to improve your experience, analyze site usage, and personalize content. You can control cookies through your browser settings.
                </p>

                <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
                <p className="text-muted-foreground mb-6">
                  Our services are designed for students of all ages. For users under 18, we require parental consent for certain features. We do not knowingly collect personal information from children without verified parental consent.
                </p>

                <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
                <p className="text-muted-foreground mb-6">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the updated policy on this page and updating the "Last updated" date.
                </p>

                <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground mb-6">
                  If you have questions about this Privacy Policy, please contact us:
                </p>
                <div className="bg-muted p-6 rounded-lg mb-8">
                  <p className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <strong>Email:</strong> privacy@bitstutorconnect.co.ke
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <strong>Phone:</strong> +254 722 310 358
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button asChild variant="outline">
                    <Link to="/terms">View Terms of Service</Link>
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
