import { useEffect, useState, useRef, useCallback } from "react"
import { 
  Video, 
  Plus, 
  RefreshCw, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Upload,
  CheckCircle,
  XCircle,
  FileVideo,
  Clock,
  HardDrive,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService, type Lesson, type CreateLessonData } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"

export default function LessonManagementPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
   
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([])
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([])
  const [strands, setStrands] = useState<{ id: number; name: string }[]>([])
    
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
    
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterGrade, setFilterGrade] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
    
   const [formData, setFormData] = useState<CreateLessonData & { s3_key?: string; file_size_mb?: number }>({
     title: "",
     description: "",
     grade: "", // deprecated, kept for compatibility
     subject: "", // deprecated
     strand: "", // deprecated
     areaId: undefined,
     topicId: undefined,
     subtopicId: undefined,
     video_url: "",
     s3_url: "",
     s3_key: "",
     thumbnail_url: "",
     duration_minutes: undefined,
     status: "active",
     file_size_mb: undefined,
   })

   const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchLessons = useCallback(async (page: number, grade: string, status: string) => {
    try {
      const response = await adminService.getLessons(page, 20)
      let filtered = response.data
      
      if (grade) {
        filtered = filtered.filter(l => l.grade === grade)
      }
      if (status) {
        filtered = filtered.filter(l => l.status === status)
      }
      
      setLessons(filtered)
      setTotal(response.total)
      setTotalPages(Math.ceil(response.total / 20))
    } catch (error) {
      console.error("Failed to fetch lessons:", error)
    }
  }, [])

   useEffect(() => {
     setIsLoading(true)
     fetchLessons(currentPage, filterGrade, filterStatus).finally(() => setIsLoading(false))
   }, [currentPage, filterGrade, filterStatus, fetchLessons])

   useEffect(() => {
     const fetchOptions = async () => {
       try {
         const [gradesRes, subjectsRes, strandsRes] = await Promise.all([
           adminService.getGrades(),
           adminService.getSubjects(),
           adminService.getStrands(),
         ])
         setGrades(gradesRes)
         setSubjects(subjectsRes)
         setStrands(strandsRes)
       } catch (error) {
         console.error("Failed to fetch options:", error)
       }
     }
     fetchOptions()
   }, [])

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setSelectedFile(file);
     }
   };

   const handleCreateLesson = async () => {
     if (!formData.title || !formData.areaId || !formData.topicId) {
       toast.error("Please fill in required fields (title, grade, subject)")
       return
     }
     if (!selectedFile) {
       toast.error("Please select a video file to upload")
       return
     }

     setIsLoading(true)
     setUploadProgress(0)
     try {
       const fd = new FormData()
       fd.append('title', formData.title)
       fd.append('description', formData.description || '')
       fd.append('area_id', formData.areaId.toString())
       fd.append('topic_id', formData.topicId.toString())
       if (formData.subtopicId) fd.append('subtopic_id', formData.subtopicId.toString())
       fd.append('video', selectedFile)
       // Optional defaults (backend handles)
       fd.append('price', formData.price?.toString() || '0')
       fd.append('is_preview_available', formData.is_preview_available ? 'true' : 'false')
       fd.append('preview_duration', formData.preview_duration?.toString() || '0')

       await adminService.createLessonWithVideo(fd, setUploadProgress)
       closeModal()
       fetchLessons(currentPage, filterGrade, filterStatus)
       toast.success("Lesson created successfully")
     } catch (error) {
       console.error("Failed to create lesson:", error)
       toast.error("Failed to create lesson")
     } finally {
       setIsLoading(false)
       setUploadProgress(0)
     }
   }

   const handleUpdateLesson = async () => {
     if (!editingLesson) return

     setIsLoading(true)
     try {
       const payload = {
         title: formData.title,
         description: formData.description,
         area_id: formData.areaId,
         topic_id: formData.topicId,
         subtopic_id: formData.subtopicId,
         duration: formData.duration_minutes,
         status: formData.status,
         video_url: formData.video_url,
         thumbnail_url: formData.thumbnail_url,
       }
       await adminService.updateLesson(editingLesson.id, payload)
       closeModal()
       fetchLessons(currentPage, filterGrade, filterStatus)
       toast.success("Lesson updated successfully")
     } catch (error) {
       console.error("Failed to update lesson:", error)
       toast.error("Failed to update lesson")
     } finally {
       setIsLoading(false)
     }
   }

  const handleDeleteLesson = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lesson? This cannot be undone.")) return

    setIsLoading(true)
    try {
      await adminService.deleteLesson(id)
      fetchLessons(currentPage, filterGrade, filterStatus)
      toast.success("Lesson deleted successfully")
    } catch (error) {
      console.error("Failed to delete lesson:", error)
      toast.error("Failed to delete lesson")
    } finally {
      setIsLoading(false)
    }
  }

   const handleToggleStatus = async (lesson: Lesson) => {
     setIsLoading(true)
     try {
       const result = await adminService.toggleLesson(lesson.id)
       setLessons(prev => prev.map(l => 
         l.id === lesson.id 
           ? { ...l, is_active: result.is_active, status: result.status as 'active' | 'inactive' }
           : l
       ))
     } catch (error) {
       console.error("Failed to toggle lesson:", error)
       fetchLessons(currentPage, filterGrade, filterStatus)
     } finally {
       setIsLoading(false)
     }
   }

   const openEditModal = async (lesson: Lesson) => {
     // Fetch full lesson details to get area/topic/subtopic IDs
     const fullLesson = await adminService.getLesson(lesson.id);
     setEditingLesson(fullLesson);
     setIsEditing(true);
     setFormData({
       title: fullLesson.title,
       description: fullLesson.description,
       grade: fullLesson.grade || "",
       subject: fullLesson.subject || "",
       strand: fullLesson.strand || "",
       areaId: fullLesson.area_id ?? undefined,
       topicId: fullLesson.topic_id ?? undefined,
       subtopicId: fullLesson.subtopic_id ?? undefined,
       video_url: fullLesson.video_url || "",
       s3_url: fullLesson.s3_url || "",
       thumbnail_url: fullLesson.thumbnail_url || "",
       duration_minutes: fullLesson.duration_minutes,
       status: fullLesson.status,
     });
     setSelectedFile(null); // no file change for edit
     setIsModalOpen(true);
   };

   const closeModal = () => {
     setIsModalOpen(false)
     setIsEditing(false)
     setEditingLesson(null)
     setFormData({
       title: "",
       description: "",
       grade: "",
       subject: "",
       strand: "",
       areaId: undefined,
       topicId: undefined,
       subtopicId: undefined,
       video_url: "",
       s3_url: "",
       thumbnail_url: "",
       duration_minutes: undefined,
       status: "active",
     })
     setSelectedFile(null);
     setUploadProgress(0)
   }

  const filteredLessons = lessons.filter(l => 
    l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
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

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Video className="h-8 w-8" />
                Lesson Management
              </h1>
              <p className="text-slate-300">
                Upload and manage video lessons stored in AWS S3
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="bg-white text-slate-800 hover:bg-slate-100"
                onClick={() => navigate("/admin")}
              >
                Back to Dashboard
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by title, subject, or grade..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <select 
                  className="px-3 py-2 border rounded-md bg-background"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                >
                  <option value="">All Grades</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
                <select 
                  className="px-3 py-2 border rounded-md bg-background"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      await fetchLessons(currentPage, filterGrade, filterStatus)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Lessons ({total})</CardTitle>
              <CardDescription>Manage video lessons and AWS S3 storage</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && lessons.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No lessons found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
                          {lesson.thumbnail_url ? (
                            <img 
                              src={lesson.thumbnail_url} 
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <FileVideo className="h-12 w-12 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className={lesson.status === "active" ? "bg-green-500" : "bg-red-500"}>
                              {lesson.status === "active" ? (
                                <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                              )}
                            </Badge>
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              {lesson.grade}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{lesson.subject}</p>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            {lesson.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration_minutes} min
                              </span>
                            )}
                            {lesson.file_size_mb && (
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {Number(lesson.file_size_mb).toFixed(1)} MB
                              </span>
                            )}
                            <span className="uppercase">{lesson.file_type}</span>
                          </div>

                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {lesson.description || "No description"}
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(lesson.created_at)}
                            </span>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleStatus(lesson)}
                                title={lesson.status === "active" ? "Deactivate" : "Activate"}
                              >
                                {lesson.status === "active" ? (
                                  <EyeOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditModal(lesson)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteLesson(lesson.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isEditing ? "Edit Lesson" : "Add New Lesson"}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Lesson title"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea 
                    id="description"
                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Lesson description"
                  />
                </div>

                <div>
                  <Label htmlFor="grade">Grade *</Label>
                  <select 
                    id="grade"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.areaId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, areaId: e.target.value ? Number(e.target.value) : undefined }))}
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <select 
                    id="subject"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.topicId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, topicId: e.target.value ? Number(e.target.value) : undefined }))}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="strand">Strand/Topic</Label>
                  <select 
                    id="strand"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.subtopicId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtopicId: e.target.value ? Number(e.target.value) : undefined }))}
                  >
                    <option value="">Select Strand (Optional)</option>
                    {strands.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration"
                    type="number"
                    value={formData.duration_minutes || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="e.g. 30"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select 
                    id="status"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value as 'active' | 'inactive' 
                    }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                 <div 
                   className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => fileInputRef.current?.click()}
                 >
                   <input 
                     ref={fileInputRef}
                     type="file"
                     accept="video/*"
                     className="hidden"
                     onChange={handleFileSelect}
                   />
                   <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                   <p className="text-sm text-muted-foreground">
                     Click to upload or drag and drop
                   </p>
                   <p className="text-xs text-muted-foreground mt-1">
                     MP4, MOV, AVI up to 500MB
                   </p>
                   {selectedFile && (
                     <p className="text-xs text-green-600 mt-2">
                       Selected: {selectedFile.name}
                     </p>
                   )}
                  </div>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                <div className="col-span-2">
                  <Label htmlFor="video_url">Video URL (Bunny.net)</Label>
                  <Input 
                    id="video_url"
                    value={formData.video_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://video.bunnycdn.com/lesson-id"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input 
                    id="thumbnail_url"
                    value={formData.thumbnail_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://video.bunnycdn.com/lesson-id/thumbnail/0.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={isEditing ? handleUpdateLesson : handleCreateLesson}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isEditing ? "Update Lesson" : "Create Lesson"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}
