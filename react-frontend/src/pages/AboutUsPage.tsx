import { Link } from "react-router-dom"
import { GraduationCap, Users, Award, MapPin, Phone, Mail, Clock, BookOpen, Video, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Layout from "@/components/Layout"

const team = [
  {
    name: "Dr. James Kariuki",
    role: "Founder & Lead Tutor",
    bio: "PhD in Education with 15+ years teaching experience",
    image: "/images/no-image-available.png"
  },
  {
    name: "Mary Wanjiku",
    role: "Mathematics Specialist",
    bio: "MSc Mathematics, 10+ years in exam preparation",
    image: "/images/no-image-available.png"
  },
  {
    name: "Peter Ochieng",
    role: "Science Coordinator",
    bio: "Former MOE teacher, expertise in physics & chemistry",
    image: "/images/no-image-available.png"
  },
  {
    name: "Sarah Nekesa",
    role: "Language Arts Lead",
    bio: "English literature specialist with creative writing background",
    image: "/images/no-image-available.png"
  }
]

const stats = [
  { value: "10,000+", label: "Students", icon: Users },
  { value: "500+", label: "Video Lessons", icon: Video },
  { value: "50+", label: "Expert Tutors", icon: GraduationCap },
  { value: "95%", label: "Success Rate", icon: Award }
]

const features = [
  {
    icon: BookOpen,
    title: "Quality Curriculum",
    description: "Our courses are designed by experienced educators following the latest curriculum requirements."
  },
  {
    icon: Video,
    title: "Video-Based Learning",
    description: "Access high-quality video lessons that you can watch anytime, anywhere, and as many times as needed."
  },
  {
    icon: Clock,
    title: "Learn at Your Pace",
    description: "No pressure. Learn at your own speed with 24/7 access to all learning materials."
  },
  {
    icon: Award,
    title: "Recognized Certificates",
    description: "Earn certificates upon completion to showcase your achievements and skills."
  }
]

export default function AboutUsPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-primary">Bits Tutor Connect</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empowering students across Kenya with quality education through innovative digital learning solutions. 
            We believe every student deserves access to excellent tutoring, regardless of location.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 opacity-90" />
                <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                <p className="text-primary-foreground/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-learning py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Bits Tutor Connect was founded in 2020 with a simple mission: to make quality education 
                  accessible to every student in Kenya.
                </p>
                <p>
                  What started as a small tutoring initiative in Kitui has grown into a comprehensive 
                  online learning platform serving students across the country.
                </p>
                <p>
                  Our team of passionate educators and tech innovators work together to create 
                  engaging, effective learning experiences that help students succeed in their exams 
                  and beyond.
                </p>
                <p>
                  We believe in the power of education to transform lives, and we're committed 
                  to continuing our mission of making learning accessible to all.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/images/BTC Landing.jpg" 
                alt="Our learning center" 
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-learning-alt py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bits Tutor Connect?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-learning text-center">
                <CardContent className="p-6">
                  <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="section-learning py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Meet Our Team</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Our passionate educators are dedicated to helping every student succeed
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="card-learning">
                <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-learning-alt py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="card-learning">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                To provide accessible, quality education to every student in Kenya through 
                innovative digital learning solutions that empower learners to achieve their full potential.
              </CardContent>
            </Card>
            <Card className="card-learning">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                To become Kenya's leading online learning platform, transforming education 
                and creating opportunities for students across all regions.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="section-learning py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="card-learning">
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-muted-foreground">P.O Box 955-90200<br />Kitui, Kenya</p>
              </CardContent>
            </Card>
            <Card className="card-learning">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-muted-foreground">+254 722 310 358</p>
              </CardContent>
            </Card>
            <Card className="card-learning">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground">info@bitstutorconnect.co.ke</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-learning-alt py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of students who are already benefiting from our quality education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-primary">
              <Link to="/gotoclass">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contactus">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}