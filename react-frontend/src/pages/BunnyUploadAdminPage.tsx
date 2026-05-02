import { useState, useEffect, useCallback, useRef } from "react"
import { useRole } from "../hooks/useRole"
import { useNavigate } from "react-router-dom"
import {
  Upload,
  Video,
  Loader2,
  Plus,
  Trash2,
  FileVideo
} from "lucide-react"
import { bunnyUploadService, type UploadFile as ServiceUploadFile, type UploadJob as ServiceUploadJob } from "../services/bunny-upload"
import { adminService } from "../services/admin"

interface UploadFile extends ServiceUploadFile {
  file: File
  name: string
  preview?: string
}

interface UploadJob extends ServiceUploadJob {}

interface Lesson {
  id: number
  title: string
  description?: string
}

export default function BunnyUploadAdminPage() {
  const { isAdmin, isSuperadmin } = useRole()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [showCreateLesson, setShowCreateLesson] = useState<string | null>(null)
  const [attachToLesson, setAttachToLesson] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
  })
  const [selectedLessonId, setSelectedLessonId] = useState<number | ''>('')

  const fetchLessons = useCallback(async () => {
    try {
      const response = await adminService.getLessons()
      setLessons(response.data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }, [])

  useEffect(() => {
    if (isAdmin || isSuperadmin) {
      fetchLessons()
      const interval = setInterval(fetchJobs, 5000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, isSuperadmin, fetchLessons])

  const fetchJobs = async () => {
    try {
      const response = await bunnyUploadService.getJobs()
      if (response.success) {
        setUploadJobs(response.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    const generateId = () => {
      const array = new Uint8Array(8)
      window.crypto.getRandomValues(array)
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
    }

    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      filename: file.name,
      originalName: file.name,
      mimetype: file.type,
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const startUpload = async () => {
    if (files.length === 0) return

    try {
      const data = await bunnyUploadService.uploadVideos(files.map(f => f.file))
      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      setFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      alert(`Upload started for ${data.uploads.length} file(s)`)
      fetchJobs()
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + error.message)
    }
  }

  const processUpload = async (jobId: string) => {
    try {
      const data = await bunnyUploadService.processUpload(jobId)
      if (!data.success) {
        throw new Error(data.error || 'Processing failed')
      }

      fetchJobs()
    } catch (error: any) {
      console.error('Process error:', error)
      alert('Processing failed: ' + error.message)
    }
  }

  const processBatch = async () => {
    const pendingJobs = uploadJobs
      .filter((j) => j.status === 'pending')
      .map((j) => j.id)

    if (pendingJobs.length === 0) return

    try {
      const data = await bunnyUploadService.processBatch(pendingJobs)
      alert(`Processed ${data.results.length} upload(s)`)
      fetchJobs()
    } catch (error: any) {
      console.error('Batch process error:', error)
      alert('Batch processing failed')
    }
  }

  const createLessonFromUpload = async (jobId: string) => {
    if (!lessonForm.title) {
      alert('Please enter a title')
      return
    }

    try {
      const data = await bunnyUploadService.createLessonFromUpload({
        jobId,
        title: lessonForm.title,
        description: lessonForm.description,
      })
      if (data.success) {
        alert('Lesson created successfully!')
        setShowCreateLesson(null)
        setLessonForm({ title: '', description: '' })
        fetchJobs()
        fetchLessons()
        navigate(`/admin/lessons`)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Create lesson error:', error)
      alert('Failed to create lesson: ' + error.message)
    }
  }

  const attachToExistingLesson = async (jobId: string) => {
    if (!selectedLessonId) {
      alert('Please select a lesson')
      return
    }

    try {
      const data = await bunnyUploadService.attachToLesson({
        jobId,
        lessonId: selectedLessonId,
      })
      if (data.success) {
        alert('Video attached to lesson!')
        setAttachToLesson(null)
        setSelectedLessonId('')
        fetchJobs()
        fetchLessons()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Attach error:', error)
      alert('Failed to attach: ' + error.message)
    }
  }

  const getStatusBadge = (job: UploadJob) => {
    switch (job.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Uploaded
          </span>
        )
      case 'uploading':
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Loader2 className="animate-spin mr-1 h-3 w-3" />
            {job.status === 'uploading' ? 'Uploading' : 'Processing'} {job.progress}%
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ❌ Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ⏸ Pending
          </span>
        )
    }
  }

  if (!isAdmin && !isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="mt-2 text-gray-600">You need admin access to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📤 Upload Videos to Bunny
          </h1>
          <p className="mt-2 text-gray-600">
            Upload multiple videos from your computer and attach them to lessons
          </p>
        </div>

        {/* Upload Zone */}
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-700">
              Click to select videos or drag and drop
            </p>
            <p className="mt-2 text-sm text-gray-500">
              MP4, MOV, AVI, WebM, MKV up to 2GB per file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileVideo className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={startUpload}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload {files.length} File(s)
              </button>
            </div>
          )}
        </div>

        {/* Upload Jobs */}
        {uploadJobs.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Upload Jobs
              </h2>
              <button
                onClick={processBatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Process Pending
              </button>
            </div>

            <div className="space-y-3">
              {uploadJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{job.originalName}</p>
                      <p className="text-xs text-gray-500">
                        Started: {new Date(job.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(job)}
                      {job.status === 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowCreateLesson(job.id)}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            <Plus className="inline h-3 w-3 mr-1" />
                            Create Lesson
                          </button>
                          <button
                            onClick={() => setAttachToLesson(job.id)}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            <Video className="inline h-3 w-3 mr-1" />
                            Attach to Lesson
                          </button>
                        </div>
                      )}
                      {job.status === 'pending' && (
                        <button
                          onClick={() => processUpload(job.id)}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Process Now
                        </button>
                      )}
                    </div>
                  </div>

                  {job.status === 'uploading' || job.status === 'processing' ? (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  ) : null}

                  {job.error && (
                    <p className="text-sm text-red-600 mt-2">{job.error}</p>
                  )}

                  {job.bunnyVideoId && job.status === 'completed' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Bunny Video ID: {job.bunnyVideoId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Lesson Modal */}
        {showCreateLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create New Lesson</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Lesson description"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCreateLesson(null)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createLessonFromUpload(showCreateLesson)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Lesson
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attach to Lesson Modal */}
        {attachToLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Attach Video to Existing Lesson</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Lesson
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a lesson...</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        #{lesson.id} - {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setAttachToLesson(null)
                      setSelectedLessonId('')
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => attachToExistingLesson(attachToLesson)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={!selectedLessonId}
                  >
                    Attach
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
