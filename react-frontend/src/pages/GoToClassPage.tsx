/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Hls from "hls.js";
import { 
  BookOpen, 
  Play, 
  Clock, 
  CheckCircle, 
  Loader2, 
  ArrowLeft,
  Video,
  CreditCard,
  X,
  User,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { MpesaPaymentModule } from "@/components/MpesaPaymentModule";
import { useGuestStore } from "@/stores/useGuestStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useMpesaStore } from "@/stores/useMpesaStore";
import { useGuestLessonPayment } from "@/hooks/useGuestLessonPayment";
import { guestService, type Lesson, type GuestPurchaseStatus } from "@/services/guest";
import { api } from "@/services/api";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};


export default function GoToClassPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Auth & Subscription
  const { user, isAuthenticated } = useAuthStore();
  const { 
    lessonBalance, 
    lessonsViewed, 
    totalLessons, 
    hasActiveSubscription,
    fetchSubscriberDetails 
  } = useSubscriptionStore();

  // Guest store
  const {
    phone,
    isVerified,
    levels,
    grades,
    areas,
    lessons,
    purchaseStatuses,
    selectedLevel,
    selectedGrade,
    selectedArea,
    isLoading,
    setPhone,
    setVerified,
    setSelectedLevel,
    setSelectedGrade,
    setSelectedArea,
    fetchLevels,
    fetchGrades,
    fetchAreas,
    fetchLessons,
    checkAllPurchaseStatuses,
    verifyPhone,
    clearAll,
  } = useGuestStore();

   const [phoneInput, setPhoneInput] = useState(() => {
     const savedPhone = localStorage.getItem("guest_phone");
     return savedPhone && savedPhone.length >= 12 ? savedPhone : "";
   });
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedLessonForPlay, setSelectedLessonForPlay] = useState<Lesson | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [, setIsLoadingVideo] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [maxWatchTime, setMaxWatchTime] = useState(0);
   const [isPlaying, setIsPlaying] = useState(false);
   const [showPaymentModal, setShowPaymentModal] = useState(false);
   const [lessonFees, setLessonFees] = useState<{ subscribed: { fee: number; duration: number }; non_subscribed: { fee: number; duration: number } }>({
     subscribed: { fee: 1, duration: 90 },
     non_subscribed: { fee: 2, duration: 90 }
   });
  const [subscriberWatchTime, setSubscriberWatchTime] = useState(0);
  const [subscriberMaxTime, setSubscriberMaxTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is subscriber
  const isSubscriber = isAuthenticated && hasActiveSubscription;

  const handleLevelSelect = async (level: typeof selectedLevel) => {
    if (!level) return;
    setSelectedLevel(level);
    setSearchParams({ level: level.id.toString() });
    await fetchGrades(level.id);
  };

  const handleGradeSelect = async (grade: typeof selectedGrade) => {
    if (!grade) return;
    setSelectedGrade(grade);
    setSelectedArea(null);
  };

  const handleAreaSelect = async (area: typeof selectedArea) => {
    if (!area) return;
    setSelectedArea(area);
  };

  useEffect(() => {
    fetchLevels();
    guestService.getLessonFees().then(setLessonFees).catch(console.error);

    if (!isSubscriber && phone) {
      verifyPhone(phone).then((result) => {
        if (result) {
          setVerified(true);
          const lessonIds = lessons.map(l => l.id);
          if (lessonIds.length > 0) {
            checkAllPurchaseStatuses(phone, lessonIds);
          }
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriberDetails();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchParams.get("level") && levels.length > 0) {
      const levelId = parseInt(searchParams.get("level") || "0");
      const level = levels.find(l => l.id === levelId);
      if (level) {
        handleLevelSelect(level);
      }
    }
  }, [searchParams, levels]);

  useEffect(() => {
    if (selectedGrade) {
      fetchAreas(selectedGrade.id);
    }
  }, [selectedGrade]);

  useEffect(() => {
    if (selectedArea) {
      fetchLessons(selectedArea.id);
    }
  }, [selectedArea]);

  const handleVerifyPhone = async () => {
    if (!phoneInput || phoneInput.length < 12) return;
    setIsVerifying(true);
    try {
      const result = await verifyPhone(phoneInput);
      if (result) {
        localStorage.setItem("guest_phone", phoneInput);
        setPhone(phoneInput);
        setVerified(true);
        if (lessons.length > 0) {
          const lessonIds = lessons.map(l => l.id);
          await checkAllPurchaseStatuses(phoneInput, lessonIds);
        }
      } else {
        toast.error("Phone number not found. Please register first.");
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
   };

const loadSubscriberVideo = async (lesson: Lesson) => {
      setIsLoadingVideo(true);
      setSelectedLessonForPlay(lesson);
      
      try {
        const response = await api.get(`/lessons/stream-url/${lesson.id}`, {
          params: { signed: "true" }
        });
        
        if (response.data.success && response.data.video_url) {
          const videoUrl = response.data.video_url;
          const isHls = response.data.is_hls || videoUrl.includes('.m3u8');
          console.log('[DEBUG] videoUrl:', videoUrl);
          console.log('[DEBUG] isHls:', isHls);
          setStreamUrl(videoUrl);
          
          // Initialize HLS if needed
          if (isHls) {
            initializeHls(videoUrl);
          } else {
            // Direct video playback
            if (videoRef.current) {
              videoRef.current.src = videoUrl;
            }
          }
          
          // Balance is in credits, each credit = duration minutes from lesson_settings
          const minutesPerCredit = lessonFees.subscribed.duration;
          setSubscriberMaxTime(lessonBalance * minutesPerCredit * 60); // Convert to seconds
          setSubscriberWatchTime(0);
        } else {
          toast.error((response.data as any).message || "Failed to load video");
        }
      } catch (error) {
        console.error("Error loading video:", error);
        toast.error("Failed to load video");
      } finally {
        setIsLoadingVideo(false);
      }
    };
    
    const initializeHls = (videoUrl: string) => {
      if (!videoRef.current) return;
      
      // Destroy existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
         // Check if HLS is supported and URL is an m3u8
         if (videoUrl.includes('.m3u8') && Hls.isSupported()) {
           const hls = new Hls({
             enableWorker: false,
             lowLatencyMode: false,
             xhrSetup: (xhr, url) => {
               xhr.withCredentials = true;
             },
             fetchSetup: (url, opts, obj) => {
               opts.credentials = 'include';
               return opts;
             },
             // Additional config for handling signed cookies and CloudFront
             progressive: false,
             // Ensure we're using the right loader types
             fragLoadingTimeOut: 20000,
             manifestLoadingTimeOut: 10000,
             levelLoadingTimeOut: 10000,
             // Enable debug mode if needed (remove in production)
             // debug: true,
           });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest loaded');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Fatal network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Fatal media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, destroying hls...');
                hls.destroy();
                break;
            }
          }
        });
        
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = videoUrl;
      }
    };

const loadVideo = async (lesson: Lesson, status: GuestPurchaseStatus) => {
      if (!phone) return;
      
      setIsLoadingVideo(true);
      setSelectedLessonForPlay(lesson);
      
      try {
        const result = await guestService.getStreamUrl(lesson.id, phone);
        if (result.success && result.video_url) {
          const videoUrl = result.video_url;
          setStreamUrl(videoUrl);
          
          // Initialize HLS if needed
          initializeHls(videoUrl);
          
          setMaxWatchTime(result.lesson_balance || status.max_watch_time || 90 * 60);
          setWatchTime(status.watch_time || 0);
        } else {
          toast.error(result.message || "Failed to load video");
        }
      } catch (error) {
        console.error("Error loading video:", error);
        toast.error("Failed to load video");
      } finally {
        setIsLoadingVideo(false);
      }
    };

   // Helper to check localStorage cache for guest payment
    const getLocalPaymentStatus = (phone: string, lessonId: number): GuestPurchaseStatus | null => {
      try {
        const stored = localStorage.getItem('guest_lesson_payments');
        if (!stored) return null;
        
        const payments = JSON.parse(stored);
        const key = `${phone}_${lessonId}`;
        const payment = payments[key];
        
        if (payment?.transactionStatus === 'completed') {
          const expiresAt = new Date(payment.expiresAt);
          if (expiresAt > new Date()) {
            return {
              lesson_id: lessonId,
              purchased: true,
              watch_time: payment.watchTime || 0,
              max_watch_time: 90 * 60,
            };
          }
        }
      } catch {}
      return null;
    };

   const handleWatchLesson = async (lesson: Lesson) => {
      if (isSubscriber) {
        await loadSubscriberVideo(lesson);
      } else if (!phone) {
        return;
      } else {
        // First check localStorage cache for faster response
        const localStatus = getLocalPaymentStatus(phone, lesson.id);
        const status = localStatus || purchaseStatuses.get(lesson.id);
        
        if (!status?.purchased) {
          useMpesaStore.getState().reset();
          setSelectedLessonForPlay(lesson);
          setShowPaymentModal(true);
          return;
        }
        await loadVideo(lesson, status);
      }
    };

const handlePaymentSuccess = async (transaction: {
     checkoutRequestID: string;
     transactionID?: string;
     amount: number;
     phoneNumber: string;
   }) => {
     if (!selectedLessonForPlay || !phone) return;
     
     try {
       await guestService.purchaseLesson(phone, selectedLessonForPlay.id, {
         amount: transaction.amount,
         checkoutRequestID: transaction.checkoutRequestID,
         transactionID: transaction.transactionID,
       });
       
       // Save to localStorage for offline/fast access
       const expiresAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
       const payments = JSON.parse(localStorage.getItem('guest_lesson_payments') || '{}');
       payments[`${phone}_${selectedLessonForPlay.id}`] = {
         phone,
         lessonId: selectedLessonForPlay.id,
         checkoutRequestId: transaction.checkoutRequestID,
         transactionStatus: 'completed' as const,
         paidAt: new Date().toISOString(),
         expiresAt,
         watchTime: 0,
       };
       localStorage.setItem('guest_lesson_payments', JSON.stringify(payments));
       
       useMpesaStore.getState().reset();
       setShowPaymentModal(false);
       
       if (selectedLessonForPlay) {
         const lessonIds = lessons.map(l => l.id);
         await checkAllPurchaseStatuses(phone, lessonIds);
         await loadVideo(selectedLessonForPlay, {
           lesson_id: selectedLessonForPlay.id,
           purchased: true,
           watch_time: 0,
           max_watch_time: 90 * 60,
         });
       }
     } catch (error) {
       console.error("Purchase error:", error);
       toast.error("Failed to complete purchase");
     }
   };

  const handlePaymentFailure = (error: string) => {
    console.error("Payment failed:", error);
    toast.error(error || "Payment failed");
  };

  const startWatchTracking = useCallback(() => {
    if (watchTimeIntervalRef.current) return;
    
    watchTimeIntervalRef.current = setInterval(async () => {
      if (isPlaying && selectedLessonForPlay) {
        if (isSubscriber) {
          // Subscriber tracking
          const newWatchTime = subscriberWatchTime + 1;
          setSubscriberWatchTime(newWatchTime);
          
          if (newWatchTime % 10 === 0) {
            try {
              await api.post("/guest_update_watch_time", {
                user_id: user?.id,
                lesson_id: selectedLessonForPlay.id,
                watch_time: newWatchTime,
              });
            } catch (error) {
              console.error("Failed to update subscriber watch time:", error);
            }
          }
        } else if (phone) {
          // Guest tracking
          const newWatchTime = watchTime + 1;
          setWatchTime(newWatchTime);
          
          // Update localStorage for resume capability
          try {
            const stored = localStorage.getItem('guest_lesson_payments');
            if (stored) {
              const payments = JSON.parse(stored);
              const key = `${phone}_${selectedLessonForPlay.id}`;
              if (payments[key]) {
                payments[key].watchTime = newWatchTime;
                localStorage.setItem('guest_lesson_payments', JSON.stringify(payments));
              }
            }
          } catch {}
          
          if (newWatchTime % 10 === 0) {
            try {
              await guestService.updateWatchTime(phone, selectedLessonForPlay.id, newWatchTime);
            } catch (error) {
              console.error("Failed to update watch time:", error);
            }
          }
        }
      }
    }, 1000);
  }, [watchTime, subscriberWatchTime, isPlaying, phone, isSubscriber, user, selectedLessonForPlay]);

  const stopWatchTracking = useCallback(() => {
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startWatchTracking();
    } else {
      stopWatchTracking();
    }
    return () => stopWatchTracking();
  }, [isPlaying, startWatchTracking, stopWatchTracking]);

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  const handleVideoEnded = () => {
    setIsPlaying(false);
    toast.success("Video completed!");
  };

  const closeVideo = () => {
    stopWatchTracking();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setStreamUrl(null);
    setSelectedLessonForPlay(null);
    setIsPlaying(false);
    setSubscriberWatchTime(0);
  };

  const remainingTime = isSubscriber 
    ? Math.max(0, subscriberMaxTime - subscriberWatchTime)
    : Math.max(0, maxWatchTime - watchTime);
  const progressPercent = isSubscriber 
    ? (subscriberMaxTime > 0 ? (subscriberWatchTime / subscriberMaxTime) * 100 : 0)
    : (maxWatchTime > 0 ? (watchTime / maxWatchTime) * 100 : 0);

  return (
    <Layout>
      {streamUrl ? (
        <div className="min-h-screen bg-black">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <Button variant="ghost" onClick={closeVideo} className="text-white hover:bg-slate-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
            {isSubscriber && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">
                    {formatTime(subscriberMaxTime - subscriberWatchTime)} remaining ({lessonBalance} credits)
                  </span>
                </div>
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: subscriberMaxTime > 0 ? `${((subscriberMaxTime - subscriberWatchTime) / subscriberMaxTime) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            )}
            {!isSubscriber && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">
                    {formatTime(remainingTime)} remaining
                  </span>
                </div>
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${100 - progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
           <div className="aspect-video bg-black max-w-5xl mx-auto">
             <video
               ref={videoRef}
               className="w-full h-full"
               controls
               controlsList="nodownload nofullscreen"
               disablePictureInPicture
               playsInline
               onPlay={handleVideoPlay}
               onPause={handleVideoPause}
               onEnded={handleVideoEnded}
               autoPlay
               crossOrigin="use-credentials"
             />
           </div>
          
          <div className="max-w-5xl mx-auto p-4">
            <h2 className="text-xl font-bold text-white">{selectedLessonForPlay?.title}</h2>
            <p className="text-slate-400">{selectedLessonForPlay?.description}</p>
          </div>
        </div>
      ) : (
        <>
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Go To Class</h1>
                  <p className="text-muted-foreground mt-1">
                    {isSubscriber 
                      ? `Welcome ${user?.username ||  'Student'}! You have ${lessonBalance} lessons remaining.`
                      : "Access video lessons - pay per lesson or subscribe for unlimited access"
                    }
                  </p>
                </div>
                {isSubscriber ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <Zap className="h-5 w-5" />
                        <span className="font-semibold">{lessonBalance} Lessons</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {lessonsViewed}/{totalLessons} used
                      </p>
                    </div>
                  </div>
                ) : phone && isVerified ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>{phone}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { clearAll(); setPhoneInput(""); }}>
                      Sign Out
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="grid gap-8">
                {!selectedLevel ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Select Your Level</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {levels.map((level) => (
                        <Button
                          key={level.id}
                          variant="outline"
                          className="h-24 flex-col gap-2"
                          onClick={() => handleLevelSelect(level)}
                        >
                          <BookOpen className="h-8 w-8" />
                          {level.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : !selectedGrade ? (
                  <div>
                    <Button variant="ghost" onClick={() => { setSelectedLevel(null); setSearchParams({}); }} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Levels
                    </Button>
                    <h2 className="text-xl font-semibold mb-4">Select Grade</h2>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {grades.map((grade) => (
                        <Button
                          key={grade.id}
                          variant="outline"
                          className="h-16"
                          onClick={() => handleGradeSelect(grade)}
                        >
                          {grade.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : !selectedArea ? (
                  <div>
                    <Button variant="ghost" onClick={() => setSelectedGrade(null)} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Grades
                    </Button>
                    <h2 className="text-xl font-semibold mb-4">Select Subject</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {areas.map((area) => (
                        <Card 
                          key={area.id} 
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleAreaSelect(area)}
                        >
                          <CardContent className="p-4 text-center">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-medium">{area.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Button variant="ghost" onClick={() => setSelectedArea(null)} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Subjects
                    </Button>
                    <h2 className="text-xl font-semibold mb-4">{selectedArea.name} - Lessons</h2>
                    
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : lessons.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <p className="text-muted-foreground">No lessons available for this subject.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {lessons.map((lesson) => {
                          const status = purchaseStatuses.get(lesson.id);
                          const isPurchased = status?.purchased;
                          
                          return (
                            <Card key={lesson.id} className="overflow-hidden">
                              <div className="aspect-video bg-slate-100 relative">
                                {lesson.thumbnail_url ? (
                                  <img 
                                    src={lesson.thumbnail_url} 
                                    alt={lesson.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="h-12 w-12 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <CardHeader className="p-4">
                                <CardTitle className="text-base">{lesson.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {lesson.description || "No description"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {lessonFees.non_subscribed.duration} min watch time
                                  </div>
                                  {isSubscriber ? (
                                    <Button onClick={() => handleWatchLesson(lesson)} disabled={lessonBalance <= 0}>
                                      <Play className="h-4 w-4 mr-1" />
                                      Watch Now
                                    </Button>
                                  ) : isPurchased ? (
                                    <Button onClick={() => handleWatchLesson(lesson)}>
                                      <Play className="h-4 w-4 mr-1" />
                                      Watch Now
                                    </Button>
                                  ) : (
                                    <Button variant="secondary" onClick={() => handleWatchLesson(lesson)}>
                                      <CreditCard className="h-4 w-4 mr-1" />
                                      Buy - KES {lessonFees.non_subscribed.fee}
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {!isSubscriber && (!phone || !isVerified) && (
            <section className="py-8 bg-muted/30">
              <div className="container mx-auto px-4">
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {isAuthenticated ? "Subscriber Access" : "Verify Your Phone"}
                    </CardTitle>
                    <CardDescription>
                      {isAuthenticated 
                        ? "You're logged in as a subscriber. Select a lesson above."
                        : "Enter your phone to access purchased lessons or make payments"
                      }
                    </CardDescription>
                  </CardHeader>
                  {!isAuthenticated && (
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone-bottom">Phone Number</Label>
                          <Input
                            id="phone-bottom"
                            type="tel"
                            placeholder="2547XX XXX XXX"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handleVerifyPhone}
                          disabled={phoneInput.length < 12 || isVerifying}
                        >
                          {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          Verify Phone
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </section>
          )}

          {phone && isVerified && !isSubscriber && (
            <section className="py-8">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg max-w-md mx-auto">
                  <CheckCircle className="h-5 w-5" />
                  <span>Verified: {phone}</span>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Payment Modal - Moved inside return statement */}
      {showPaymentModal && selectedLessonForPlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isSubscriber ? "Add More Lessons" : "Purchase Lesson"}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { useMpesaStore.getState().reset(); setShowPaymentModal(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {selectedLessonForPlay.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm"><strong>Lesson:</strong> {selectedLessonForPlay.title}</p>
                <p className="text-sm"><strong>Watch Time:</strong> {lessonFees.non_subscribed.duration} minutes</p>
                <p className="text-sm"><strong>Watch Time:</strong> {lessonFees.subscribed.duration} minutes per credit</p>
              </div>
              
              {isSubscriber ? (
                <>
                  <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                    <p className="font-semibold">Subscriber Rate</p>
                    <p className="text-2xl font-bold">KES {lessonFees.subscribed.fee}</p>
                    <p className="text-xs">per credit ({lessonFees.subscribed.duration} min watch time)</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Or upgrade your subscription for unlimited access:</p>
                    <Button variant="outline" className="w-full" onClick={() => { useMpesaStore.getState().reset(); setShowPaymentModal(false); window.location.href = '/subscriptions'; }}>
                      Upgrade to Unlimited
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <p><strong>Price:</strong> KES {lessonFees.non_subscribed.fee}</p>
                  <p className="text-xs mt-1">You get {lessonFees.non_subscribed.duration} minutes of watch time that can be paused and resumed.</p>
                </div>
              )}

<MpesaPaymentModule
                  amount={isSubscriber ? lessonFees.subscribed.fee : lessonFees.non_subscribed.fee}
                  accountReference={`lesson_${selectedLessonForPlay.id}_${isSubscriber ? 'subscriber' : 'guest'}`}
                  defaultPhone={isAuthenticated ? (user?.phone || '') : (phone || '')}
                  businessMetadata={{
                    activationType: isSubscriber ? 'subscribelessonactivation' : 'guestlessonactivation',
                    lessonId: selectedLessonForPlay.id,
                    lessonFees: isSubscriber ? lessonFees.subscribed.fee : lessonFees.non_subscribed.fee,
                  }}
                  onSuccess={handlePaymentSuccess}
                  onFailure={handlePaymentFailure}
                />
            </CardContent>
          </Card>
        </div>
      )}

    </Layout>
  );
}