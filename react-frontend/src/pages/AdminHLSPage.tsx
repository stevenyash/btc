/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Film, Play, CheckCircle, XCircle, RefreshCw, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Layout from "@/components/Layout"
import { api } from "@/services/api"

interface VideoItem {
  id: number
  title: string
  s3_key: string
}

interface TranscodeResult {
  videoKey: string
  outputPrefix: string
  success: boolean
  jobId?: string
  status?: string
  error?: string
}

export default function AdminHLSPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [transcoding, setTranscoding] = useState(false)
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<TranscodeResult[]>([])
  const [total, setTotal] = useState(0)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/hls/list-videos?limit=10000&offset=0`)
      setVideos(response.data?.videos || [])
      setTotal(response.data?.total || 0)
    } catch (err) {
      console.error("Failed to fetch videos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const toggleVideo = (s3Key: string) => {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(s3Key)) {
      newSelected.delete(s3Key)
    } else {
      newSelected.add(s3Key)
    }
    setSelectedVideos(newSelected)
  }

  const selectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(videos.map(v => v.s3_key)))
    }
  }

  const batchTranscode = async () => {
    if (selectedVideos.size === 0) return

    const videoList = Array.from(selectedVideos).map(key => ({
      key,
      prefix: key.replace('.mp4', '')
    }))

    try {
      setTranscoding(true)
      setResults([])
      const response = await api.post("/hls/batch-transcode", {
        videos: videoList,
        transcoder: "mediaconvert"
      })
      const initialResults = response.data?.results || []
      setResults(initialResults)
      
      // Poll for job completion
      pollJobStatus(initialResults)
    } catch (err: any) {
      console.error("Batch transcode failed:", err)
      alert(err.response?.data?.error || "Transcode failed")
    } finally {
      setTranscoding(false)
    }
  }

  const pollJobStatus = async (initialResults: TranscodeResult[]) => {
    const jobMap = initialResults
      .filter(r => r.success && r.jobId)
      .map(r => ({ jobId: r.jobId!, videoKey: r.videoKey }))
    
    if (jobMap.length === 0) return

    const poll = async () => {
      try {
        const statusPromises = jobMap.map(async ({ jobId, videoKey }) => {
          const res = await api.get(`/hls/job-status/${jobId}`)
          return { ...res.data, videoKey }
        })
        const statuses = await Promise.all(statusPromises)
        
        setResults(prev => prev.map(result => {
          const statusUpdate = statuses.find(s => s.videoKey === result.videoKey)
          if (statusUpdate && result.jobId) {
            return { ...result, status: statusUpdate.status }
          }
          return result
         }))

        // Continue polling while any job is still active
        const activeJobs = statuses.filter(s => 
          !['COMPLETE', 'ERROR', 'CANCELED'].includes(s.status)
        )
        if (activeJobs.length > 0) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    setTimeout(poll, 10000)
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-6 w-6" />
              HLS Transcoding
            </CardTitle>
            <CardDescription>
              Transcode videos to HLS format for streaming. Total: {total} videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Selected: {selectedVideos.size} videos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={selectAll}
                  disabled={loading || transcoding}
                >
                  {selectedVideos.size === videos.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  onClick={batchTranscode}
                  disabled={selectedVideos.size === 0 || transcoding}
                >
                  {transcoding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transcoding...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Transcode Selected
                    </>
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <Checkbox
                          checked={selectedVideos.size === videos.length && videos.length > 0}
                          onCheckedChange={selectAll}
                        />
                      </th>
                      <th className="p-3 text-left">Title</th>
                      <th className="p-3 text-left">S3 Key</th>
                      <th className="p-3 text-left w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map(video => {
                      const result = results.find(r => r.videoKey === video.s3_key)
                      return (
                        <tr key={video.id} className="border-t">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedVideos.has(video.s3_key)}
                              onCheckedChange={() => toggleVideo(video.s3_key)}
                              disabled={transcoding}
                            />
                          </td>
                          <td className="p-3">{video.title}</td>
                          <td className="p-3 text-sm text-muted-foreground truncate max-w-md">
                            {video.s3_key}
                          </td>
                           <td className="p-3">
                            {result ? (
                              result.success === false ? (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Failed
                                </Badge>
                              ) : result.status === 'COMPLETE' ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Complete
                                </Badge>
                              ) : result.status === 'ERROR' || result.status === 'CANCELED' ? (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  {result.status === 'ERROR' ? 'Error' : 'Canceled'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                  {result.status || 'Processing'}
                                </Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                 </table>
               </div>
             )}

            {!loading && videos.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {videos.length} of {total} total videos
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}