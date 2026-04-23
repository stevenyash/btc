import { useEffect, useState } from "react"
import { 
  GraduationCap,
  BookOpen,
  FolderOpen,
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Save,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminService } from "@/services/admin"
import Layout from "@/components/Layout"
import { useNavigate } from "react-router-dom"

interface LearningLevel {
  id: number
  name: string
  description: string
  sort_order: number
  is_active: boolean
}

interface Grade {
  id: number
  name: string
  description: string
  level_id: number
  sort_order: number
  is_active: boolean
  learning_level_name?: string
}

interface LearningArea {
  id: number
  name: string
  description: string
  grade_id: number
  color: string
  icon: string
  sort_order: number
  is_active: boolean
  grade_name?: string
}

interface Topic {
  id: number
  name: string
  description: string
  area_id: number
  sort_order: number
  is_active: boolean
  learning_area_name?: string
}

interface Subtopic {
  id: number
  name: string
  description: string
  topic_id: number
  sort_order: number
  is_active: boolean
  topic_name?: string
}

type TabType = 'levels' | 'grades' | 'areas' | 'topics' | 'subtopics'

export default function LearningHierarchyPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('levels')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [levels, setLevels] = useState<LearningLevel[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [areas, setAreas] = useState<LearningArea[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])

  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [levelsRes, gradesRes, areasRes, topicsRes, subtopicsRes] = await Promise.all([
        adminService.getLearningLevels(),
        adminService.getAllGrades(),
        adminService.getAllLearningAreas(),
        adminService.getAllTopics(),
        adminService.getAllSubtopics(),
      ])
      setLevels(levelsRes)
      setGrades(gradesRes)
      setAreas(areasRes)
      setTopics(topicsRes)
      setSubtopics(subtopicsRes)
    } catch (error) {
      console.error("Failed to fetch hierarchy:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      switch (activeTab) {
        case 'levels':
          if (editingItem?.id) {
            await adminService.updateLearningLevel(editingItem.id, formData)
          } else {
            await adminService.createLearningLevel(formData)
          }
          break
        case 'grades':
          if (editingItem?.id) {
            await adminService.updateGrade(editingItem.id, formData)
          } else {
            await adminService.createGrade(formData)
          }
          break
        case 'areas':
          if (editingItem?.id) {
            await adminService.updateLearningArea(editingItem.id, formData)
          } else {
            await adminService.createLearningArea(formData)
          }
          break
        case 'topics':
          if (editingItem?.id) {
            await adminService.updateTopic(editingItem.id, formData)
          } else {
            await adminService.createTopic(formData)
          }
          break
        case 'subtopics':
          if (editingItem?.id) {
            await adminService.updateSubtopic(editingItem.id, formData)
          } else {
            await adminService.createSubtopic(formData)
          }
          break
      }
      closeModal()
      fetchAll()
      toast.success("Saved successfully")
    } catch (error) {
      console.error("Failed to save:", error)
      toast.error("Failed to save")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (item: any) => {
    setIsLoading(true)
    try {
      const updateData = { is_active: !item.is_active }
      switch (activeTab) {
        case 'levels':
          await adminService.updateLearningLevel(item.id, updateData)
          break
        case 'grades':
          await adminService.updateGrade(item.id, updateData)
          break
        case 'areas':
          await adminService.updateLearningArea(item.id, updateData)
          break
        case 'topics':
          await adminService.updateTopic(item.id, updateData)
          break
        case 'subtopics':
          await adminService.updateSubtopic(item.id, updateData)
          break
      }
      fetchAll()
      toast.success("Status updated")
    } catch (error) {
      console.error("Failed to toggle status:", error)
      toast.error("Failed to update status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This cannot be undone.")) return
    setIsLoading(true)
    try {
      switch (activeTab) {
        case 'levels':
          await adminService.deleteLearningLevel(id)
          break
        case 'grades':
          await adminService.deleteGrade(id)
          break
        case 'areas':
          await adminService.deleteLearningArea(id)
          break
        case 'topics':
          await adminService.deleteTopic(id)
          break
        case 'subtopics':
          await adminService.deleteSubtopic(id)
          break
      }
      fetchAll()
      toast.success("Deleted successfully")
    } catch (error) {
      console.error("Failed to delete:", error)
      toast.error("Failed to delete")
    } finally {
      setIsLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    const baseData = { name: "", description: "", sort_order: 0, is_active: true }
    if (activeTab === 'grades') {
      setFormData({ ...baseData, level_id: '' })
    } else if (activeTab === 'areas') {
      setFormData({ ...baseData, grade_id: '', color: '#3B82F6', icon: 'book' })
    } else if (activeTab === 'topics') {
      setFormData({ ...baseData, area_id: '' })
    } else if (activeTab === 'subtopics') {
      setFormData({ ...baseData, topic_id: '' })
    } else {
      setFormData(baseData)
    }
    setIsModalOpen(true)
  }

  const openEditModal = (item: any) => {
    setEditingItem(item)
    setFormData({ ...item })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({})
  }

  const tabs = [
    { id: 'levels', label: 'Learning Levels', icon: GraduationCap },
    { id: 'grades', label: 'Grades', icon: BookOpen },
    { id: 'areas', label: 'Subjects', icon: Layers },
    { id: 'topics', label: 'Topics', icon: FolderOpen },
    { id: 'subtopics', label: 'Subtopics', icon: ChevronRight },
  ] as const

  const currentData = () => {
    switch (activeTab) {
      case 'levels': return levels
      case 'grades': return grades
      case 'areas': return areas
      case 'topics': return topics
      case 'subtopics': return subtopics
    }
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <GraduationCap className="h-8 w-8" />
                Learning Hierarchy
              </h1>
              <p className="text-slate-300">
                Manage learning levels, grades, subjects, topics, and subtopics
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
                onClick={fetchAll}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap"
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {tabs.find(t => t.id === activeTab)?.label}
                </CardTitle>
                <CardDescription>
                  {currentData().length} items
                </CardDescription>
              </div>
              <Button onClick={openAddModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading && currentData().length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : currentData().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No {activeTab} found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Description</th>
                        <th className="text-left p-3">Parent</th>
                        <th className="text-left p-3">Order</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData().map((item: any) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{item.id}</td>
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3 text-muted-foreground">{item.description || '-'}</td>
                          <td className="p-3">
                            {item.level_id || item.grade_id || item.area_id || item.topic_id || '-'}
                          </td>
                          <td className="p-3">{item.sort_order || '-'}</td>
                          <td className="p-3">
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleStatus(item)}
                                title={item.is_active ? "Deactivate" : "Activate"}
                              >
                                {item.is_active ? (
                                  <EyeOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditModal(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingItem ? "Edit" : "Add"} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                />
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input 
                  id="sort_order"
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>

              {activeTab === 'grades' && (
                <div>
                  <Label htmlFor="level_id">Learning Level *</Label>
                  <select 
                    id="level_id"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.level_id || ""}
                    onChange={(e) => setFormData({ ...formData, level_id: parseInt(e.target.value) })}
                  >
                    <option value="">Select Level</option>
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'areas' && (
                <>
                  <div>
                    <Label htmlFor="grade_id">Grade *</Label>
                    <select 
                      id="grade_id"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      value={formData.grade_id || ""}
                      onChange={(e) => setFormData({ ...formData, grade_id: parseInt(e.target.value) })}
                    >
                      <option value="">Select Grade</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input 
                      id="color"
                      type="color"
                      value={formData.color || "#3B82F6"}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </>
              )}

              {activeTab === 'topics' && (
                <div>
                  <Label htmlFor="area_id">Subject *</Label>
                  <select 
                    id="area_id"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.area_id || ""}
                    onChange={(e) => setFormData({ ...formData, area_id: parseInt(e.target.value) })}
                  >
                    <option value="">Select Subject</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'subtopics' && (
                <div>
                  <Label htmlFor="topic_id">Topic *</Label>
                  <select 
                    id="topic_id"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.topic_id || ""}
                    onChange={(e) => setFormData({ ...formData, topic_id: parseInt(e.target.value) })}
                  >
                    <option value="">Select Topic</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}