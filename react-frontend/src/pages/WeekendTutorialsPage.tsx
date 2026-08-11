 
import { useState, useEffect } from "react"
import { Calendar, Users, BookOpen, Video, MapPin, Phone, Mail, CheckCircle, Loader2, RefreshCw, MessageSquare, VideoIcon, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiService } from "@/services/api"
import Layout from "@/components/Layout"
import { MpesaPaymentModule } from "@/components/MpesaPaymentModule"
import { useAuthStore } from "@/stores/useAuthStore"
import { getReferralCode } from "@/utils/referral"

interface Level {
  value: number;
  label: string;
}

interface Grade {
  value: number;
  label: string;
}

interface Tutorial {
  id: number;
  learning_area: string;
  grade: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'expired';
  link?: string;
  meetingid?: string;
  strand?: string;
}

interface PurchasedTutorial {
  id: number;
  tutorial_id: number;
  learning_area: string;
  grade: string;
  start_date: string;
  end_date: string;
  status: string;
  link?: string;
  transaction_date: string;
  expiry_date: string;
}

interface Question {
  id: number;
  text: string;
  status: 'answered' | 'unanswered';
  created_at: string;
  tutorial_id: number;
}

export default function WeekendTutorialsPage() {
  // State for learning hierarchy
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)

  // State for tutorials
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [tutorialsLoading, setTutorialsLoading] = useState(false)

  // State for phone verification
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  // State for payment
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [email, setEmail] = useState("")

  // State for purchased tutorials
  const [purchasedTutorials, setPurchasedTutorials] = useState<PurchasedTutorial[]>([])
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const [_questions, setQuestions] = useState<Question[]>([])
  const [showPurchased, setShowPurchased] = useState(false)
  const [purchasedLoading, setPurchasedLoading] = useState(false)

  // State for questions
  const [selectedTutorialForQuestion, setSelectedTutorialForQuestion] = useState<PurchasedTutorial | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [questionText, setQuestionText] = useState("")
  const [postingQuestion, setPostingQuestion] = useState(false)

  // Fee (will be fetched)
  const [fee, setFee] = useState("500")
   const fetchLevels = async () => {
     try {
       const data = await apiService.get<Level[]>('/components_data/levelid_option_list')
       setLevels(data)
     } catch (error) {
       console.error('Failed to fetch levels:', error)
     }
   }

   const fetchGrades = async (levelId: number) => {
     try {
       const data = await apiService.get<{id: number, name: string}[]>(`/components_data/grades_by_level/${levelId}`)
       setGrades(data.map(item => ({ value: item.id, label: item.name })))
     } catch (error) {
       console.error('Failed to fetch grades:', error)
       setGrades([])
     }
   }

   const fetchTutorials = async (gradeId: number) => {
    setTutorialsLoading(true)
    try {
      const data = await apiService.get<{ success: boolean; data: Tutorial[]; total: number }>(
        '/components_data/get_weekend_tutorials',
        { grade_id: gradeId, per_page: 20 }
      )
      if (data.success) {
        setTutorials(data.data)
        // Also fetch fee
        const feeData = await apiService.get<{ fee: string }>('/components_data/tutorial_fee')
        setFee(feeData.fee)
      }
    } catch (error) {
      console.error('Failed to fetch tutorials:', error)
    } finally {
      setTutorialsLoading(false)
    }
  }

  const verifyPhone = async () => {
    setIsVerifying(true)
    try {
      const cleanPhone = formatKenyanNumber(phoneNumber)
      if (!cleanPhone) {
        toast.error('Invalid phone number format')
        setIsVerifying(false)
        return
      }

      const data = await apiService.get<{ verified: boolean }>(`/components_data/verify_phone/${cleanPhone}`)
      if (data.verified) {
        setPhoneVerified(true)
        setVerifiedPhone(cleanPhone)
        // Fetch purchased tutorials
        fetchPurchasedTutorials(cleanPhone)
      } else {
        toast.error('Phone number not found. Please register first.')
      }
    } catch (error) {
      console.error('Phone verification failed:', error)
      toast.error('Phone verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const fetchPurchasedTutorials = async (phone: string) => {
    setPurchasedLoading(true)
    try {
      const data = await apiService.get<{ success: boolean; tutorials: PurchasedTutorial[]; questions: Question[] }>(
        '/components_data/get_purchased_tutorials',
        { phone }
      )
      if (data.success) {
        setPurchasedTutorials(data.tutorials)
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Failed to fetch purchased tutorials:', error)
    } finally {
      setPurchasedLoading(false)
    }
  }

  const handleRegister = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial)
    setShowPaymentModal(true)
    setEmail("")
  }

   const onPaymentSuccess = async (_transaction: { checkoutRequestID: string; transactionID?: string; amount: number; phoneNumber: string }) => {
    toast.success('Registration successful! Check your phone for SMS with class link.')
    setShowPaymentModal(false)
    setSelectedTutorial(null)

    if (verifiedPhone) {
      fetchPurchasedTutorials(verifiedPhone)
    }
  }

  const onPaymentFailure = (error: string) => {
    console.error('Payment failed:', error)
  }

  const handleJoinClass = (tutorial: PurchasedTutorial) => {
    if (tutorial.link) {
      const meetType = getMeetIcon(tutorial.link)
      if (meetType === 'meet') {
        toast.success('Opening Google Meet...')
      } else if (meetType === 'zoom') {
        toast.success('Opening Zoom meeting...')
      }
      window.open(tutorial.link, '_blank', 'noopener,noreferrer')
    } else {
      toast.error('Class link not available yet. Please check back closer to class time.')
    }
  }

  const handlePostQuestion = async () => {
    if (!selectedTutorialForQuestion || !questionText.trim()) return

    setPostingQuestion(true)
    try {
      await apiService.post('/api/questions/add', {
        question_text: questionText,
        scheduler_id: selectedTutorialForQuestion.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: 'unanswered'
      })
      toast.success('Question posted successfully!')
      setQuestionText("")
      setShowQuestionDialog(false)
      setSelectedTutorialForQuestion(null)
      // Refresh questions list
      if (verifiedPhone) {
        fetchPurchasedTutorials(verifiedPhone)
      }
    } catch (error) {
      console.error('Failed to post question:', error)
      toast.error('Failed to post question')
    } finally {
      setPostingQuestion(false)
    }
  }

  const refreshStatus = async () => {
    if (selectedGrade) {
      fetchTutorials(selectedGrade)
    }
    if (verifiedPhone) {
      fetchPurchasedTutorials(verifiedPhone)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const validateKenyanNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '')
    return /^(?:254|\+254|0)?(7[0-9]{8})$/.test(cleaned)
  }

  const formatKenyanNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '')
    if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned
    if (cleaned.startsWith('7') && cleaned.length === 9) return `254${cleaned}`
    if (cleaned.startsWith('0') && cleaned.length === 10) return `254${cleaned.substring(1)}`
    return null
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const getTimeUntilStart = (startDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const diff = start.getTime() - now.getTime()
    
    if (diff <= 0) return null
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const isGoogleMeetLink = (url: string) => {
    return url?.includes('meet.google.com') || url?.includes('zoom.us')
  }

  const getMeetIcon = (url: string) => {
    if (url?.includes('meet.google.com')) return 'meet'
    if (url?.includes('zoom.us')) return 'zoom'
    return 'generic'
  }

  // Fetch learning levels on mount
  useEffect(() => {
    ;(async () => {
      await fetchLevels()
      try {
        const data = await apiService.get<Tutorial[]>('/components_data/check_weekend_tutorials')
        console.log('[check_weekend_tutorials] Received data:', data)
      } catch (error) {
        console.error('[check_weekend_tutorials] Error:', error)
      }
    })()
  }, [])

  // Update countdown every minute for upcoming tutorials
  useEffect(() => {
    if (!showPurchased || purchasedTutorials.length === 0) return
    const hasUpcoming = purchasedTutorials.some(t => t.status === 'upcoming')
    if (!hasUpcoming) return

    const interval = setInterval(() => {
      // Force re-render to update countdown
      setPurchasedTutorials(prev => [...prev])
    }, 60000)

    return () => clearInterval(interval)
  }, [showPurchased, purchasedTutorials])

  const handleLevelSelect = async (level: number) => {
    setSelectedLevel(level)
    setSelectedGrade(null)
    setTutorials([])
    await fetchGrades(level)
  }

  const handleGradeSelect = async (grade: number) => {
    setSelectedGrade(grade)
    await fetchTutorials(grade)
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Weekend <span className="text-primary">Tutorials</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Boost your child's education with our weekend intensive tutoring sessions. 
            Expert tutors, small groups, and focused learning.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">1</div>
              <h3 className="font-semibold mb-2">Choose Subject & Level</h3>
              <p className="text-sm text-muted-foreground">Select the subject and class level</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">2</div>
              <h3 className="font-semibold mb-2">Register & Pay</h3>
              <p className="text-sm text-muted-foreground">Verify phone and pay via M-Pesa</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">3</div>
              <h3 className="font-semibold mb-2">Start Learning</h3>
              <p className="text-sm text-muted-foreground">Join Google Meet class and ask questions</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">4</div>
              <h3 className="font-semibold mb-2">Get Support</h3>
              <p className="text-sm text-muted-foreground">Ask questions live during class</p>
            </div>
          </div>
        </div>
      </section>

      {/* Phone Verification & Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Phone Verification Card */}
          {!phoneVerified ? (
            <Card className="max-w-md mx-auto mb-8">
              <CardHeader>
                <CardTitle>Verify Your Phone</CardTitle>
                <CardDescription>Enter your phone number to access tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={verifyPhone}
                    disabled={!validateKenyanNumber(phoneNumber) || isVerifying}
                  >
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                    Verify Phone
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Phone verified: {verifiedPhone}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setPhoneVerified(false); setVerifiedPhone(''); setPurchasedTutorials([]); }}>
                  Change Phone
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPurchased(!showPurchased)}>
                  {showPurchased ? 'Browse Tutorials' : 'My Tutorials'}
                </Button>
              </div>
            </div>
          )}

          {showPurchased && phoneVerified ? (
            /* Purchased Tutorials Section */
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Tutorials</h2>
                <Button variant="outline" size="sm" onClick={refreshStatus}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {purchasedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : purchasedTutorials.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No tutorials purchased yet. Browse available tutorials below!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {purchasedTutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{tutorial.learning_area}</CardTitle>
                            <CardDescription>Grade {tutorial.grade}</CardDescription>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(tutorial.status)}`}>
                            {tutorial.status.toUpperCase()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Start: {tutorial.start_date}</p>
                            <p className="text-sm text-muted-foreground">End: {tutorial.end_date}</p>
                            <p className="text-sm text-muted-foreground">Purchased: {tutorial.transaction_date}</p>
                            {tutorial.link && (
                              <div className="mt-2 flex items-center gap-2 text-green-600">
                                <VideoIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">Google Meet Ready</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {tutorial.status === 'active' ? (
                              <Button onClick={() => handleJoinClass(tutorial)} className="w-full md:w-auto">
                                <Video className="mr-2 h-4 w-4" />
                                Join Class
                              </Button>
                            ) : tutorial.status === 'upcoming' ? (
                              <div className="space-y-2">
                                <Button variant="outline" disabled className="opacity-75">
                                  <Clock className="mr-2 h-4 w-4" />
                                  Not Started
                                </Button>
                                {getTimeUntilStart(tutorial.start_date) && (
                                  <p className="text-sm text-center text-muted-foreground">
                                    Starts in {getTimeUntilStart(tutorial.start_date)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button variant="outline" disabled>
                                Expired
                              </Button>
                            )}
                            <Button 
                              variant="secondary"
                              onClick={() => { setSelectedTutorialForQuestion(tutorial); setShowQuestionDialog(true); }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Ask Question
                            </Button>
                          </div>
                        </div>
                        {tutorial.link && isGoogleMeetLink(tutorial.link) && (
                          <div className="bg-green-50 p-2 rounded text-sm text-green-800 flex items-center gap-2">
                            <VideoIcon className="h-4 w-4" />
                            <span>Video class via Google Meet</span>
                          </div>
                        )}
                        {tutorial.link && !isGoogleMeetLink(tutorial.link) && (
                          <p className="text-xs text-muted-foreground break-all">
                            Class Link: {tutorial.link}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Tutorial Browsing Section */
            !showPurchased && (
              <div>
                {/* Learning Level Selection */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-6">Select Learning Level</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {levels.map((level) => (
                      <Button
                        key={level.value}
                        variant={selectedLevel === level.value ? "default" : "outline"}
                        className="h-24 flex-col"
                        onClick={() => handleLevelSelect(level.value)}
                      >
                        <BookOpen className="h-6 w-6 mb-2" />
                        {level.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Grade Selection */}
                {selectedLevel && grades.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Select Grade</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {grades.map((grade) => (
                        <Button
                          key={grade.value}
                          variant={selectedGrade === grade.value ? "default" : "outline"}
                          className="h-20"
                          onClick={() => handleGradeSelect(grade.value)}
                        >
                          {grade.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tutorials List */}
                {selectedGrade && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">Available Weekend Tutorials</h3>
                      <Button variant="outline" size="sm" onClick={refreshStatus}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>

                    {tutorialsLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : tutorials.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <p className="text-muted-foreground">No tutorials available for this grade at the moment.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {tutorials.map((tutorial) => (
                          <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle>{tutorial.learning_area}</CardTitle>
                                  {tutorial.strand && (
                                    <p className="text-sm text-muted-foreground">{tutorial.strand}</p>
                                  )}
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(tutorial.status)}`}>
                                  {tutorial.status.toUpperCase()}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Grade: {tutorial.grade}</p>
                                  <p className="text-sm text-muted-foreground">Start: {formatDate(tutorial.start_date)}</p>
                                  <p className="text-sm text-muted-foreground">End: {formatDate(tutorial.end_date)}</p>
                                </div>
                                <div>
                                  <Button onClick={() => handleRegister(tutorial)}>
                                    Register Now - KSh {fee}
                                  </Button>
                                </div>
                              </div>
                              {tutorial.link && isGoogleMeetLink(tutorial.link) ? (
                                <div className="bg-primary/5 p-3 rounded-lg flex items-center gap-2">
                                  <VideoIcon className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium text-primary">Includes Google Meet Video Class</p>
                                    <p className="text-xs text-muted-foreground">Link provided upon registration</p>
                                  </div>
                                </div>
                              ) : tutorial.link ? (
                                <p className="text-xs text-muted-foreground">
                                  Meet link will be provided upon registration
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Online class via video link
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && selectedTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Registration</CardTitle>
              <CardDescription>
                {selectedTutorial.learning_area} - Grade {selectedTutorial.grade}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm"><strong>Fee:</strong> KSh {fee}</p>
                <p className="text-sm"><strong>Duration:</strong> Weekend (Sat-Sun)</p>
                <p className="text-sm"><strong>Class Time:</strong> {new Date(selectedTutorial.start_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                {selectedTutorial.link && isGoogleMeetLink(selectedTutorial.link) && (
                  <div className="mt-2 flex items-center gap-2 text-primary">
                    <VideoIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Includes Google Meet Video Class</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentEmail">Email for Receipt</Label>
                <Input
                  id="paymentEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                <p><strong>Phone:</strong> {isAuthenticated ? user?.phone : (phoneVerified ? verifiedPhone : 'Enter in payment prompt')}</p>
              </div>

              <MpesaPaymentModule
                amount={parseInt(fee)}
                accountReference={`Tutorial-${selectedTutorial.id}`}
                defaultPhone={isAuthenticated ? (user?.phone || '') : (phoneVerified ? verifiedPhone : '')}
                businessMetadata={{
                  activationType: 'weekendTutorial',
                  tutorial_id: selectedTutorial.id,
                  learning_area: selectedTutorial.learning_area,
                  grade: selectedTutorial.grade,
                  email,
                  referralCode: getReferralCode() || undefined,
                }}
                onSuccess={onPaymentSuccess}
                onFailure={onPaymentFailure}
              />

              <Button variant="outline" className="w-full" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Question Dialog */}
      {showQuestionDialog && selectedTutorialForQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                {selectedTutorialForQuestion.learning_area} - {selectedTutorialForQuestion.grade}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Your Question</Label>
                <textarea
                  id="question"
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  placeholder="Type your question here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowQuestionDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handlePostQuestion}
                  disabled={!questionText.trim() || postingQuestion}
                >
                  {postingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Weekend Tutorials?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Small Groups</h3>
              <p className="text-sm text-muted-foreground">Max 15 students per batch for personalized attention</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Expert Tutors</h3>
              <p className="text-sm text-muted-foreground">Qualified teachers with years of experience</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Google Meet</h3>
              <p className="text-sm text-muted-foreground">Live video classes from anywhere</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Schedule</h3>
              <p className="text-sm text-muted-foreground">Multiple time slots to fit your schedule</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="bg-muted/50">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <Phone className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="font-medium">Call Us</p>
                  <p className="text-muted-foreground">+254 722 310 358</p>
                </div>
                <div>
                  <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">info@bitstutorconnect.co.ke</p>
                </div>
                <div>
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">Kitui, Kenya</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  )
}