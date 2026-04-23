import { Link } from "react-router-dom"
import { Globe, PlayCircle, MessageCircle, Phone, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { newsletterService } from "@/services/newsletter"

const APP_NAME = "Bits Tutor Connect"

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/aboutus" },
  { label: "Subscriptions", to: "/subscriptions" },
  { label: "Packages", to: "/packages" },
  { label: "Weekend Lessons", to: "/weekend-tutorials" },
  { label: "Contact Us", to: "/contactus" },
  { label: "User Guide", to: "/guide" },
]

export function Footer() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter a valid email.")
      return
    }

    try {
      const response = await newsletterService.subscribe(email)
      if (response.success) {
        setMessage(response.message || "You have successfully subscribed!")
        setError("")
        setEmail("")
      } else {
        setError(response.message || "Failed to subscribe. Please try again.")
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to subscribe. Please try again.")
    }
  }

  const handleInstallApp = () => {
    toast.info(
      "To install our app on your device:\n\n1. Open this website in your browser\n2. Tap the Share button (iOS) or Menu button (Android)\n3. Select 'Add to Home Screen' or 'Install App'\n\nOur PWA provides the best experience on mobile devices!"
    )
  }

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Newsletter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Subscribe To Newsletter</h3>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white text-foreground"
              />
              <Button type="submit" variant="secondary">
                Subscribe
              </Button>
            </form>
            {message && <p className="text-green-400 text-sm mt-2">{message}</p>}
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Call Us: +254 (0) 722310358</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Email Us: info@bitstutorconnect.co.ke</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Write Us: P.O Box 955-90200, Kitui</span>
              </div>
            </div>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Important Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {footerLinks.map((link) => (
                <Button
                  key={link.to}
                  variant="link"
                  className="justify-start px-0 h-auto text-primary-foreground/80"
                  asChild
                >
                  <Link to={link.to}>{link.label}</Link>
                </Button>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="mt-4">
              <p className="text-sm text-primary-foreground/70 mb-2">Follow Us</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5L14.17.5C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z"/>
                    </svg>
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://bitstutorconnect.co.ke" target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://wa.me/254722310358" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* User Guide Button */}
        <div className="text-center mb-6">
          <Button variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
            <Link to="/guide">See Our User Guide</Link>
          </Button>
        </div>

        {/* Legal Links & Copyright */}
        <div className="border-t border-primary-foreground/20 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 text-sm text-primary-foreground/70">
              <Link to="/privacy" className="hover:text-primary-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-foreground">
                Terms of Service
              </Link>
            </div>

            <div className="text-center text-sm text-primary-foreground/70">
              © {new Date().getFullYear()} {APP_NAME}. All Rights Reserved
              <Button
                variant="link"
                size="sm"
                onClick={handleInstallApp}
                className="ml-2 text-primary-foreground hover:text-primary-foreground/80"
              >
                Install App
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer