import { Link } from "react-router-dom"
import { 
  BookOpen, 
  Video, 
  Users, 
  Award, 
  Clock, 
  Star, 
  ArrowRight,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Layout from "@/components/Layout"

const features = [
  {
    icon: Video,
    title: "Video Lessons",
    description: "Access high-quality video tutorials from expert tutors"
  },
  {
    icon: BookOpen,
    title: "Structured Learning",
    description: "Follow well-organized curriculum designed by professionals"
  },
  {
    icon: Users,
    title: "Expert Tutors",
    description: "Learn from qualified and experienced educators"
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Earn certificates upon completing your courses"
  },
  {
    icon: Clock,
    title: "Learn Anytime",
    description: "Access content 24/7 at your own pace"
  },
  {
    icon: Star,
    title: "Track Progress",
    description: "Monitor your learning journey with progress tracking"
  }
]

const courses = [
  {
    id: 1,
    title: "Mathematics Fundamentals",
    category: "Mathematics",
    lessons: 24,
    duration: "12 hours",
    students: 1250,
    rating: 4.8,
    image: "/images/no-image-available.png"
  },
  {
    id: 2,
    title: "Physics for Beginners",
    category: "Science",
    lessons: 18,
    duration: "8 hours",
    students: 890,
    rating: 4.7,
    image: "/images/no-image-available.png"
  },
  {
    id: 3,
    title: "English Language Arts",
    category: "Language",
    lessons: 30,
    duration: "15 hours",
    students: 2100,
    rating: 4.9,
    image: "/images/no-image-available.png"
  },
  {
    id: 4,
    title: "Computer Programming",
    category: "Technology",
    lessons: 42,
    duration: "20 hours",
    students: 3200,
    rating: 4.9,
    image: "/images/no-image-available.png"
  }
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Student",
    content: "This platform has transformed my learning experience. The video lessons are clear and the progress tracking keeps me motivated!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Parent",
    content: "My son loves learning here. The structured curriculum and expert tutors have significantly improved his grades.",
    rating: 5
  },
  {
    name: "Emily Davis",
    role: "Student",
    content: "The flexibility to learn anytime has been perfect for my busy schedule. Highly recommend to all students!",
    rating: 5
  }
]

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left animate-fade-in">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Unlock Your Potential with{" "}
                <span className="text-primary">Expert-Led Learning</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Access quality education from anywhere. Learn at your own pace with 
                video lessons, expert tutors, and comprehensive curriculum.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="btn-primary">
                  <Link to="/gotoclass">
                    <Play className="mr-2 h-5 w-5" />
                    Start Learning
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/aboutus">
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Lessons</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">Tutors</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative animate-slide-up">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/BTC Landing.jpg" 
                  alt="Students learning" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                        <Play className="h-5 w-5 text-white ml-1" />
                      </div>
                      <div>
                        <p className="font-semibold">Mathematics: Algebra Basics</p>
                        <p className="text-sm text-muted-foreground">Lesson 5 • 12:30 remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-learning-alt">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Bits Tutor Connect?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide a comprehensive learning experience designed to help you succeed
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-learning hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="section-learning">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Popular Courses</h2>
              <p className="text-muted-foreground">Start your learning journey today</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/courses">
                View All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="card-course group">
                <div className="video-thumbnail relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" className="rounded-full bg-white/90 text-primary hover:bg-white">
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>
                  <span className="absolute top-3 left-3 badge-primary">
                    {course.category}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{course.rating}</span>
                      <span className="text-muted-foreground text-sm">({course.students})</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">10,000+</p>
              <p className="text-primary-foreground/80">Active Students</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">500+</p>
              <p className="text-primary-foreground/80">Video Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">50+</p>
              <p className="text-primary-foreground/80">Expert Tutors</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">95%</p>
              <p className="text-primary-foreground/80">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-learning-alt">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Students Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied learners who have transformed their education
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-learning">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-primary">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-learning">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning on our platform. 
                Get started today and unlock your potential!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Link to="/customlogin">
                    Sign Up Now
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link to="/gotoclass">
                    Browse Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  )
}