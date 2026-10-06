import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Plus, 
  Search, 
  ChevronRight, 
  FileText, 
  Download, 
  Check, 
  X, 
  Calendar,
  Sparkles,
  Paperclip,
  RefreshCw,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Play,
  Edit2,
  Ban,
  UserCheck,
  Users,
  ShieldCheck,
  User,
  UserPlus,
  Trash2,
  Mail,
  Loader2
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { contractService } from '../services/contractService'
import { userService } from '../services/userService'
import { conversationService } from '../services/conversationService'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

export default function ProjectWorkspacePage() {
  const { id, tab } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)

  // Tabs: 'overview' | 'tasks' | 'contract' | 'messages'
  const [activeTab, setActiveTab] = useState(tab || 'overview')
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tasks state
  const [tasks, setTasks] = useState([])
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, in_progress: 0, todo: 0 })
  const [taskSearch, setTaskSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskHours, setNewTaskHours] = useState(4)
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)

  // Edit Task state
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDesc, setEditTaskDesc] = useState('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [editTaskHours, setEditTaskHours] = useState(4)
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState('')
  const [updatingTask, setUpdatingTask] = useState(false)

  // Contract state
  const [contracts, setContracts] = useState([])
  const [contractLoading, setContractLoading] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payModalData, setPayModalData] = useState(null)
  const [paying, setPaying] = useState(false)

  // Project Team Member Management state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchingEmail, setSearchingEmail] = useState(false)
  const [searchedUser, setSearchedUser] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState(null)

  // Messages state
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const chatContainerRef = useRef(null)

  // Sync tab with URL parameter if provided
  useEffect(() => {
    if (tab && ['overview', 'tasks', 'contract', 'messages'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [tab])

  const fetchProjectData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectService.getProjectById(id)
      setProject(res.data)
    } catch (err) {
      console.error('Failed to load project:', err)
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchProjectData()
    }
  }, [id])

  // Fetch tasks
  const fetchTasks = async () => {
    if (!id) return
    try {
      const res = await taskService.getTasksByProject(id)
      const taskList = res.data?.tasks || res.data || []
      setTasks(taskList)

      // Calculate stats
      const total = taskList.length
      const completed = taskList.filter((t) => t.status === 'done').length
      const in_progress = taskList.filter((t) => t.status === 'in_progress').length
      const todo = taskList.filter((t) => t.status === 'todo').length
      setTaskStats({ total, completed, in_progress, todo })
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  // Fetch contracts
  const fetchContracts = async () => {
    if (!id) return
    setContractLoading(true)
    try {
      const directContractId = project?.contract?._id || project?.contract?.id
      if (directContractId) {
        try {
          const detailRes = await contractService.getContractById(directContractId)
          if (detailRes?.data) {
            setContracts([detailRes.data])
            return
          }
        } catch (e) {}
      }

      const res = await contractService.getMyContracts()
      const projectContracts = (res.data || []).filter(
        (c) =>
          String(c.projectId) === String(id) ||
          String(c.projectId?._id) === String(id) ||
          String(c.project?.id) === String(id) ||
          String(c.project?._id) === String(id)
      )
      if (projectContracts.length > 0 && (projectContracts[0]._id || projectContracts[0].id)) {
        try {
          const cId = projectContracts[0]._id || projectContracts[0].id
          const detailRes = await contractService.getContractById(cId)
          if (detailRes?.data) {
            projectContracts[0] = { ...projectContracts[0], ...detailRes.data }
          }
        } catch (e) {}
      }
      setContracts(projectContracts)
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
    } finally {
      setContractLoading(false)
    }
  }

  // Fetch or sync conversation and messages with the global chat system
  const fetchConversationAndMessages = async () => {
    const orderId = project?.orderId || project?.order?._id || project?.order?.id
    if (!orderId) return
    try {
      let conv = null
      try {
        const convRes = await conversationService.getConversationByOrderId(orderId)
        conv = convRes?.data
      } catch (e) {
        try {
          const createRes = await conversationService.createConversation(orderId)
          conv = createRes?.data
        } catch (createErr) {
          // Continue to fallback if create fails
        }
      }

      // Fallback: If not found by direct orderId, find matching conversation in user's conversations
      if (!conv) {
        try {
          const allConvsRes = await conversationService.getMyConversations()
          const allConvs = allConvsRes?.data || []
          const found = allConvs.find((c) =>
            String(c.orderId || c.orderID) === String(orderId) ||
            String(c.partner?._id || c.partner?.id) === String(project?.order?.freelancer?._id || project?.order?.buyer?._id)
          )
          if (found) {
            conv = found
          }
        } catch (e) {}
      }

      if (conv) {
        setConversation(conv)
        const convId = conv.id || conv._id || conv.conversationID || conv.conversationId
        if (convId) {
          const msgRes = await conversationService.getMessages(convId)
          setMessages(msgRes.data || conv.messages || [])
        } else if (conv.messages && Array.isArray(conv.messages)) {
          setMessages(conv.messages)
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  useEffect(() => {
    if (project) {
      fetchTasks()
      fetchContracts()
      fetchConversationAndMessages()
    }
  }, [project])

  // Sync conversation whenever activeTab switches to 'messages'
  useEffect(() => {
    if (activeTab === 'messages' && project) {
      fetchConversationAndMessages()
    }
  }, [activeTab, project])

  // Periodic polling for incoming messages while user stays on the Messages tab
  useEffect(() => {
    if (activeTab !== 'messages' || !conversation) return

    const convId = conversation.id || conversation._id || conversation.conversationID || conversation.conversationId
    if (!convId) return

    const interval = setInterval(async () => {
      try {
        const res = await conversationService.getMessages(convId)
        if (res?.data && res.data.length !== messages.length) {
          setMessages(res.data)
        }
      } catch (e) {}
    }, 4000)

    return () => clearInterval(interval)
  }, [activeTab, conversation, messages.length])

  // Scroll only the chat messages container to bottom (never scroll the browser window)
  useEffect(() => {
    if (activeTab === 'messages' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, activeTab])

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const convId = conversation?.id || conversation?._id || conversation?.conversationID || conversation?.conversationId
    if (!convId) {
      toast.error('Chưa kết nối được cuộc trò chuyện')
      return
    }

    const content = inputMessage.trim()
    setInputMessage('')
    setSendingMessage(true)

    try {
      const res = await conversationService.sendMessage(convId, content)
      if (res?.data) {
        setMessages((prev) => [...prev, res.data])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message')
      setInputMessage(content)
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const contractId = contracts[0]?.id || contracts[0]?._id
    if (!contractId) {
      toast.error('No contract associated with this project')
      return
    }

    setCreatingTask(true)
    try {
      const payload = {
        contractId,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        dueDate: newTaskDueDate || undefined,
        estimatedHours: Number(newTaskHours) || 4,
      }
      if (newTaskAssigneeId) {
        payload.assigneeId = newTaskAssigneeId
      }
      await taskService.createTask(id, payload)
      toast.success(t('workspace.createTaskSuccess', 'Thêm nhiệm vụ thành công!'))
      setShowCreateTaskModal(false)
      setNewTaskTitle('')
      setNewTaskDesc('')
      setNewTaskDueDate('')
      setNewTaskAssigneeId('')
      fetchTasks()
    } catch (err) {
      console.error('Failed to create task:', err)
      toast.error(err.response?.data?.message || err.message || 'Cannot create task')
    } finally {
      setCreatingTask(false)
    }
  }

  // Handle Start Task (todo -> in_progress)
  const handleStartTask = async (task) => {
    if (project.status === 'planning') {
      toast.error(t('workspace.projectPlanningTaskNotice', 'Dự án đang lên kế hoạch, chưa thể bắt đầu thực hiện nhiệm vụ.'))
      return
    }
    const taskId = task.id || task._id
    try {
      await taskService.updateTaskStatus(taskId, 'in_progress')
      toast.success(t('workspace.taskStartedSuccess', 'Đã bắt đầu thực hiện nhiệm vụ!'))
      await fetchTasks()
      if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
        setSelectedTask((prev) => ({ ...prev, status: 'in_progress', startedAt: new Date() }))
      }
    } catch (err) {
      console.error('Failed to start task:', err)
      toast.error(err.response?.data?.message || err.message || 'Cannot start task')
    }
  }

  // Handle Complete Task (in_progress -> done)
  const handleCompleteTask = async (task) => {
    const taskId = task.id || task._id
    try {
      await taskService.updateTaskStatus(taskId, 'done')
      toast.success(t('workspace.taskCompletedSuccess', 'Đã đánh dấu hoàn thành nhiệm vụ!'))
      await fetchTasks()
      if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
        setSelectedTask((prev) => ({ ...prev, status: 'done', completedAt: new Date() }))
      }
    } catch (err) {
      console.error('Failed to complete task:', err)
      toast.error(err.response?.data?.message || err.message || 'Cannot complete task')
    }
  }

  // Handle Cancel Task (todo/in_progress -> cancelled)
  const handleCancelTask = async (task) => {
    const confirmMsg = t('workspace.cancelTaskConfirm', 'Bạn có chắc chắn muốn hủy nhiệm vụ này không?')
    if (!window.confirm(confirmMsg)) return

    const taskId = task.id || task._id
    try {
      await taskService.updateTaskStatus(taskId, 'cancelled')
      toast.success(t('workspace.taskCancelledSuccess', 'Đã hủy nhiệm vụ thành công!'))
      await fetchTasks()
      if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
        setSelectedTask((prev) => ({ ...prev, status: 'cancelled' }))
      }
    } catch (err) {
      console.error('Failed to cancel task:', err)
      toast.error(err.response?.data?.message || err.message || 'Cannot cancel task')
    }
  }

  // Handle Open Edit Task Modal
  const handleOpenEditTaskModal = (task) => {
    if (task.status !== 'todo') {
      toast.error(t('workspace.cannotEditStartedTask', 'Nhiệm vụ đã bắt đầu hoặc hoàn thành, không thể chỉnh sửa'))
      return
    }
    setEditingTask(task)
    setEditTaskTitle(task.title || '')
    setEditTaskDesc(task.description || '')
    setEditTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
    setEditTaskHours(task.estimatedHours || 4)
    const rawAssignee = task.assigneeId
    const aId = typeof rawAssignee === 'object' ? (rawAssignee?._id || rawAssignee?.id) : rawAssignee
    setEditTaskAssigneeId(aId ? String(aId) : '')
    setShowEditTaskModal(true)
  }

  // Handle Update Task
  const handleUpdateTask = async (e) => {
    e.preventDefault()
    if (!editingTask || !editTaskTitle.trim()) return

    const taskId = editingTask.id || editingTask._id
    setUpdatingTask(true)
    try {
      const payload = {
        title: editTaskTitle.trim(),
        description: editTaskDesc.trim(),
        dueDate: editTaskDueDate || undefined,
        estimatedHours: Number(editTaskHours) || 4,
      }
      if (editTaskAssigneeId) {
        payload.assigneeId = editTaskAssigneeId
      }
      const res = await taskService.updateTask(taskId, payload)
      toast.success(t('workspace.taskUpdatedSuccess', 'Cập nhật nhiệm vụ thành công!'))
      setShowEditTaskModal(false)
      await fetchTasks()
      if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
        setSelectedTask(res.data || { ...selectedTask, title: editTaskTitle, description: editTaskDesc, assigneeId: editTaskAssigneeId })
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      toast.error(err.response?.data?.message || err.message || 'Cannot update task')
    } finally {
      setUpdatingTask(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateFormatted = d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    })
    return `${timeStr} · ${dateFormatted}`
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '—'
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return t('workspace.justNow', 'Vừa xong')
    }
    if (diffHours < 1) {
      return i18n.language === 'vi' ? `${diffMins} phút trước` : `${diffMins} mins ago`
    }
    if (diffHours < 24) {
      return i18n.language === 'vi' ? `${diffHours} giờ trước` : `${diffHours} hours ago`
    }
    if (diffDays < 7) {
      return i18n.language === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`
    }
    return formatDate(dateStr)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-4 bg-muted rounded-md w-48 animate-pulse" />
        <div className="h-32 bg-card rounded-2xl border border-border animate-pulse p-6" />
        <div className="h-96 bg-card rounded-2xl border border-border animate-pulse p-6" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">
          {error || 'Project not found'}
        </h2>
        <Button onClick={() => navigate('/app/projects')} variant="outline" className="gap-2 mx-auto cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('project.backToProjects', 'Quay lại Dự án')}</span>
        </Button>
      </div>
    )
  }

  const getProjectStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: t('project.completed', 'Đã hoàn thành'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dotClass: 'bg-emerald-500',
        }
      case 'cancelled':
        return {
          label: t('project.cancelled', 'Đã hủy'),
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70',
          dotClass: 'bg-rose-500',
        }
      case 'in_progress':
        return {
          label: t('project.inProgress', 'Đang thực hiện'),
          className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/70',
          dotClass: 'bg-blue-500',
        }
      default: // planning
        return {
          label: t('project.planning', 'Lên kế hoạch'),
          className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/70',
          dotClass: 'bg-amber-500',
        }
    }
  }

  // Computations
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userID
  const currentContract = contracts[0] || project?.contract || null

  const isBuyer = Boolean(
    currentUserId && (
      String(project.buyerId) === String(currentUserId) ||
      String(project.order?.buyer?._id) === String(currentUserId)
    )
  )
  const leadFreelancerId = String(
    currentContract?.freelancerId?._id ||
    currentContract?.freelancerId ||
    project.order?.freelancer?._id ||
    project.order?.freelancer?.id ||
    ''
  )
  const isContractLead = Boolean(
    currentUserId && leadFreelancerId && String(currentUserId) === leadFreelancerId
  )
  const isFreelancer = currentUser?.role === 'freelancer' || isContractLead

  const buyer = project.order?.buyer || currentContract?.buyer || { name: 'Client', avatar: null }
  const leadFreelancer = currentContract?.freelancer || project.order?.freelancer || (isContractLead ? currentUser : { name: 'Freelancer', avatar: null })
  const freelancer = leadFreelancer
  const partner = isBuyer ? freelancer : buyer
  const partnerRoleLabel = isBuyer ? t('contract.freelancer', 'Freelancer') : t('contract.client', 'Khách hàng')
  const deadlineDate = project.order?.deliveredAt || new Date(new Date(project.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000)

  // Contract members (only freelancers, exclude buyer and lead freelancer)
  const contractMembers = (currentContract?.members || []).filter((m) => {
    const mId = m?._id || m?.id
    const leadId = leadFreelancer?._id || leadFreelancer?.id || currentContract?.freelancerId
    const buyerId = buyer?._id || buyer?.id || currentContract?.buyerId
    return mId && String(mId) !== String(leadId) && String(mId) !== String(buyerId) && m.role !== 'buyer'
  })

  // Eligible assignees strictly for task assignments (Lead Freelancer + Contract Freelancer Members)
  const eligibleAssignees = []
  if (leadFreelancer && (leadFreelancer._id || leadFreelancer.id)) {
    eligibleAssignees.push({
      _id: String(leadFreelancer._id || leadFreelancer.id),
      id: String(leadFreelancer._id || leadFreelancer.id),
      name: leadFreelancer.name || t('workspace.projectLeadRole', 'Trưởng dự án'),
      avatar: leadFreelancer.avatar || null,
      email: leadFreelancer.email || '',
      role: 'freelancer',
      isLead: true,
    })
  }
  contractMembers.forEach((m) => {
    const mId = String(m._id || m.id)
    if (!eligibleAssignees.some((a) => String(a.id || a._id) === mId)) {
      eligibleAssignees.push({
        _id: mId,
        id: mId,
        name: m.name || `Freelancer #${mId.slice(-4)}`,
        avatar: m.avatar || null,
        email: m.email || '',
        role: m.role || 'freelancer',
        isLead: false,
      })
    }
  })

  const getTaskAssigneeId = (t) => {
    if (!t?.assigneeId) return null
    return typeof t.assigneeId === 'object' ? (t.assigneeId._id || t.assigneeId.id) : t.assigneeId
  }

  const getTaskAssignee = (t) => {
    if (!t?.assigneeId) return null
    if (typeof t.assigneeId === 'object' && (t.assigneeId.name || t.assigneeId._id)) {
      return t.assigneeId
    }
    const aId = String(t.assigneeId)
    return eligibleAssignees.find((a) => String(a.id || a._id) === aId) || null
  }

  const isTaskAssignee = (t) => {
    if (!currentUserId || !t) return false
    const assigneeId = getTaskAssigneeId(t)
    return Boolean(assigneeId && String(currentUserId) === String(assigneeId))
  }

  const getTaskAssigneeName = (t) => {
    const assigneeObj = getTaskAssignee(t)
    if (assigneeObj?.name) {
      return assigneeObj.name
    }
    const aId = getTaskAssigneeId(t)
    if (!aId) return null
    if (String(aId) === String(leadFreelancer?._id || leadFreelancer?.id)) return leadFreelancer.name
    if (isTaskAssignee(t)) return t('workspace.assignedToYou', 'Giao cho bạn')
    return null
  }

  // Calculate progress percentage strictly from real tasks (0 if no tasks)
  const totalTasksCount = taskStats.total || 0
  const completedTasksCount = taskStats.completed || 0
  const remainingTasksCount = Math.max(0, totalTasksCount - completedTasksCount)
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

  // Contract data calculation strictly from real contract/order
  const totalContractPrice = Number(currentContract?.price ?? project.order?.price ?? 0)
  const paidAmount = Number(currentContract?.paidAmount ?? 0)
  const remainingAmount = Math.max(0, totalContractPrice - paidAmount)
  const paidPercent = totalContractPrice > 0 ? Math.round((paidAmount / totalContractPrice) * 100) : 0
  const contractId = currentContract?._id || currentContract?.id || project?.contract?._id || project?.contract?.id
  const contractCode = contractId 
    ? `#HD${String(contractId).slice(-6).toUpperCase()}` 
    : (project.orderId ? `#HD${String(project.orderId).slice(-6).toUpperCase()}` : '—')
  const contractCreatedDate = currentContract?.createdAt || project.createdAt

  // Real activities feed strictly from real data
  const activities = []

  // 1. Completed tasks
  tasks.filter((t) => t.status === 'done').forEach((t) => {
    activities.push({
      id: `task-done-${t.id || t._id}`,
      type: 'task_done',
      avatar: freelancer.avatar,
      name: freelancer.name,
      text: t('workspace.activityCompletedTask', {
        name: freelancer.name,
        task: t.title,
        defaultValue: `${freelancer.name} đã hoàn thành nhiệm vụ "${t.title}"`
      }),
      time: t.updatedAt || t.createdAt,
    })
  })

  // 2. In-progress tasks
  tasks.filter((t) => t.status === 'in_progress').slice(0, 2).forEach((t) => {
    activities.push({
      id: `task-prog-${t.id || t._id}`,
      type: 'task_in_progress',
      avatar: freelancer.avatar,
      name: freelancer.name,
      text: i18n.language === 'vi' 
        ? `${freelancer.name} đang thực hiện nhiệm vụ "${t.title}"`
        : `${freelancer.name} is working on task "${t.title}"`,
      time: t.updatedAt || t.createdAt,
    })
  })

  // 3. Project creation event
  if (project?.createdAt) {
    activities.push({
      id: 'project-created',
      type: 'project_created',
      avatar: null,
      name: null,
      text: t('workspace.activityProjectCreated', 'Dự án được tạo'),
      time: project.createdAt,
    })
  }

  activities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))

  // Filtered tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (taskSearch.trim() && !task.title?.toLowerCase().includes(taskSearch.toLowerCase())) return false
    return true
  })

  // Payment handlers
  const handleOpenPayModal = (amount) => {
    const cid = currentContract?._id || currentContract?.id
    if (!cid) {
      toast.error(t('workspace.noContractError', 'Không tìm thấy hợp đồng của dự án'))
      return
    }
    setPayModalData({
      amount: Number(amount),
      contractId: cid
    })
    setShowPayModal(true)
  }

  const handleConfirmPayment = async () => {
    if (!payModalData?.contractId || !payModalData?.amount) return
    setPaying(true)
    try {
      await contractService.payContract(payModalData.contractId, payModalData.amount)
      toast.success(t('workspace.paymentSuccess', 'Thanh toán hợp đồng thành công!'))
      setShowPayModal(false)
      // Refresh contracts and project to reflect real DB state
      await Promise.all([fetchContracts(), fetchProjectData()])
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err.response?.data?.message || err.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  // Search user by email for adding to contract
  const handleSearchUserByEmail = async (e) => {
    e?.preventDefault()
    const trimmed = searchEmail.trim().toLowerCase()
    if (!trimmed) return
    setSearchingEmail(true)
    setSearchError('')
    setSearchedUser(null)
    try {
      const res = await userService.lookupByEmail(trimmed)
      const found = res?.data
      if (!found) {
        setSearchError(t('workspace.userNotFound', 'Không tìm thấy người dùng với email này.'))
        return
      }
      setSearchedUser(found)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('workspace.searchUserError', 'Lỗi khi tìm kiếm người dùng.')
      setSearchError(msg)
    } finally {
      setSearchingEmail(false)
    }
  }

  // Add member to contract
  const handleAddMember = async () => {
    const contractId = currentContract?._id || currentContract?.id || project?.contract?._id || project?.contract?.id
    if (!contractId || !searchedUser) return

    setAddingMember(true)
    try {
      const res = await contractService.addMember(contractId, searchedUser.email)
      toast.success(t('workspace.addMemberSuccess', 'Đã thêm thành viên vào dự án thành công!'))
      setShowAddMemberModal(false)
      setSearchEmail('')
      setSearchedUser(null)
      setSearchError('')
      // Immediately reflect returned contract with updated members
      if (res?.data) {
        setContracts([res.data])
      }
      // Revalidate contracts and project data
      await Promise.all([fetchContracts(), fetchProjectData()])
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('workspace.addMemberError', 'Không thể thêm thành viên.')
      toast.error(msg)
    } finally {
      setAddingMember(false)
    }
  }

  // Remove member from contract
  const handleRemoveMember = async (memberId) => {
    const contractId = currentContract?._id || currentContract?.id || project?.contract?._id || project?.contract?.id
    if (!contractId || !memberId) return

    if (!window.confirm(t('workspace.removeMemberConfirm', 'Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?'))) {
      return
    }

    setRemovingMemberId(memberId)
    try {
      const res = await contractService.removeMember(contractId, memberId)
      toast.success(t('workspace.removeMemberSuccess', 'Đã xóa thành viên khỏi dự án!'))
      // Immediately reflect returned contract with updated members
      if (res?.data) {
        setContracts([res.data])
      }
      // Revalidate contracts and project data
      await Promise.all([fetchContracts(), fetchProjectData()])
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('workspace.removeMemberError', 'Không thể xóa thành viên.')
      toast.error(msg)
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">
      {/* 1. Header Section (Screens 3-7 Header) */}
      <div className="space-y-4 pt-1">
        {/* Back Link with generous spacing */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1)
              } else {
                navigate('/app/projects')
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('project.backToProjects', 'Quay lại Dự án')}</span>
          </button>

          {project.orderId && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <Link
                to={`/app/orders/${project.orderId}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                <span>{t('project.linkedOrder', 'Đơn hàng')}: #{String(project.orderId).slice(-6).toUpperCase()}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>

        {/* Project Title & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {project.title}
              </h1>
              {(() => {
                const statusCfg = getProjectStatusConfig(project.status)
                return (
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0', statusCfg.className)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusCfg.dotClass)} />
                    {statusCfg.label}
                  </span>
                )
              })()}
            </div>

            {/* Participants & Deadline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Avatar
                  src={freelancer.avatar}
                  fallback={(freelancer.name || 'F').charAt(0).toUpperCase()}
                  className="w-5 h-5 text-[9px]"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {freelancer.name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                  {t('workspace.freelancer', 'Freelancer')}
                </span>
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5">
                <Avatar
                  src={buyer.avatar}
                  fallback={(buyer.name || 'C').charAt(0).toUpperCase()}
                  className="w-5 h-5 text-[9px]"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {buyer.name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                  {t('workspace.client', 'Khách hàng')}
                </span>
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>
                  {t('workspace.deadline', 'Hạn chót')}: {formatDate(deadlineDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-border text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'overview'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('workspace.overviewTab', 'Tổng quan')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'tasks'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('workspace.tasksTab', 'Nhiệm vụ')} ({tasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contract')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'contract'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('workspace.contractTab', 'Hợp đồng')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'messages'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('workspace.messagesTab', 'Tin nhắn')}
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: TỔNG QUAN (Overview) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Row: Progress Ring & Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card: Tiến độ dự án */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex flex-col justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* SVG Progress Ring */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-700/90"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {progressPercent > 0 && (
                      <path
                        className="text-emerald-500 transition-all duration-1000 ease-out"
                        strokeDasharray={`${progressPercent}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-extrabold text-lg text-foreground">
                    {progressPercent}%
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    {t('workspace.projectProgress', 'Tiến độ dự án')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('workspace.tasksCompletedOf', {
                      completed: completedTasksCount,
                      total: totalTasksCount,
                    })}
                  </p>
                </div>
              </div>

              {/* 3 Counter Boxes */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/60 text-center">
                <div className="p-3 rounded-xl bg-muted/40">
                  <div className="text-lg sm:text-xl font-extrabold text-foreground">
                    {totalTasksCount}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {t('workspace.totalTasks', 'Tổng nhiệm vụ')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40">
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {completedTasksCount}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {t('workspace.completedTasks', 'Đã hoàn thành')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40">
                  <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400">
                    {remainingTasksCount}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {t('workspace.remainingTasks', 'Còn lại')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Thông tin dự án */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex flex-col justify-between gap-6">
              <div className="space-y-3">
                {/* Header: Title + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground">
                    {t('workspace.projectInfo', 'Thông tin dự án')}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 whitespace-nowrap shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {t('workspace.inProgress', 'Đang thực hiện')}
                  </span>
                </div>

                {/* Project Details: Key-value rows */}
                <div className="space-y-2.5 pt-1">
                  {/* Row 1: Tên dự án */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{t('workspace.projectName', 'Tên dự án')}</span>
                    <span className="font-semibold text-foreground text-xs sm:text-sm text-right truncate max-w-[220px]" title={project.title}>
                      {project.title}
                    </span>
                  </div>

                  {/* Row 2: Đối tác */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{partnerRoleLabel}</span>
                    <div className="flex items-center gap-2 text-right">
                      <Avatar
                        src={partner.avatar}
                        fallback={(partner.name || 'U').charAt(0).toUpperCase()}
                        className="w-5 h-5 text-[10px] shrink-0"
                      />
                      <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[180px]">
                        {partner.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Metric Stat Boxes: Ngân sách | Hạn chót | Hợp đồng */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/60 text-center">
                {/* 1. Ngân sách */}
                <div className="p-3 rounded-xl bg-muted/40 flex flex-col justify-center">
                  <div className="text-sm sm:text-base md:text-lg font-extrabold text-foreground truncate">
                    {formatCurrency(totalContractPrice)}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                    {t('contract.totalValue', 'Ngân sách')}
                  </div>
                </div>

                {/* 2. Hạn chót */}
                <div className="p-3 rounded-xl bg-muted/40 flex flex-col justify-center">
                  <div className="text-xs sm:text-sm font-extrabold text-foreground py-0.5 truncate">
                    {formatDate(deadlineDate)}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                    {t('workspace.deadline', 'Hạn chót')}
                  </div>
                </div>

                {/* 3. Hợp đồng */}
                <div
                  onClick={() => setActiveTab('contract')}
                  className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer group flex flex-col justify-center"
                  title={t('workspace.contractTab', 'Hợp đồng')}
                >
                  <div className="text-xs sm:text-sm font-mono font-bold text-primary-600 dark:text-primary-400 py-0.5 truncate flex items-center justify-center gap-1">
                    <span>{contractCode}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline shrink-0" />
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate group-hover:text-primary-600 transition-colors">
                    {t('workspace.contractTab', 'Hợp đồng')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Project Team (Đội ngũ dự án) */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>{t('workspace.projectTeam', 'Đội ngũ dự án')}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('workspace.projectTeamDesc', 'Các thành viên tham gia thực hiện và quản trị dự án')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMembersModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:hover:bg-primary-900/60 text-primary-600 dark:text-primary-400 border border-primary-200/60 dark:border-primary-800/60 transition-colors cursor-pointer shadow-2xs group"
                  title={t('workspace.viewAssigneesList', 'Xem danh sách người thực hiện')}
                >
                  <Users className="w-3.5 h-3.5 opacity-80 group-hover:scale-110 transition-transform" />
                  <span>
                    {1 + contractMembers.length === 1
                      ? t('workspace.assigneeCountSingular', '1 Assignee')
                      : t('workspace.assigneeCountPlural', '{{count}} Assignees', { count: 1 + contractMembers.length })}
                  </span>
                </button>
                {isContractLead && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSearchEmail('')
                      setSearchedUser(null)
                      setSearchError('')
                      setShowAddMemberModal(true)
                    }}
                    className="gap-1.5 h-8 text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t('workspace.addFreelancer', 'Thêm Freelancer')}</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {/* 1. Project Lead */}
              <div className="p-4 rounded-xl border border-primary-200/70 dark:border-primary-800/60 bg-primary-50/30 dark:bg-primary-950/20 flex items-start gap-3 relative">
                <Avatar
                  src={leadFreelancer?.avatar}
                  fallback={(leadFreelancer?.name || 'L').charAt(0).toUpperCase()}
                  className="w-10 h-10 text-xs shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={leadFreelancer?.name}>
                      {leadFreelancer?.name || 'Freelancer Lead'}
                    </h4>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary-600 text-white shadow-2xs">
                      <ShieldCheck className="w-3 h-3" />
                      {t('workspace.projectLeadRole', 'Trưởng dự án')}
                    </span>
                  </div>
                  {leadFreelancer?.email && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={leadFreelancer.email}>
                      {leadFreelancer.email}
                    </p>
                  )}
                  <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium inline-block mt-1">
                    {t('workspace.contractLeadDesc', 'Phụ trách lập kế hoạch & giao việc')}
                  </span>
                </div>
              </div>

              {/* 2. Client / Buyer */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-start gap-3">
                <Avatar
                  src={buyer?.avatar}
                  fallback={(buyer?.name || 'C').charAt(0).toUpperCase()}
                  className="w-10 h-10 text-xs shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={buyer?.name}>
                      {buyer?.name || 'Client'}
                    </h4>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <User className="w-3 h-3" />
                      {t('workspace.clientRole', 'Khách hàng')}
                    </span>
                  </div>
                  {buyer?.email && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={buyer.email}>
                      {buyer.email}
                    </p>
                  )}
                  <span className="text-[10px] text-muted-foreground inline-block mt-1">
                    {t('workspace.clientDesc', 'Chủ đơn hàng & phê duyệt nghiệm thu')}
                  </span>
                </div>
              </div>

              {/* 3. Team Members (if any) */}
              {contractMembers.map((member) => {
                const memberId = member._id || member.id
                return (
                  <div
                    key={memberId}
                    className="p-4 rounded-xl border border-border/80 bg-card flex items-start justify-between gap-3 relative group hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar
                        src={member.avatar}
                        fallback={(member.name || 'M').charAt(0).toUpperCase()}
                        className="w-10 h-10 text-xs shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={member.name}>
                            {member.name}
                          </h4>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                            {t('workspace.teamMemberRole', 'Thành viên Freelancer')}
                          </span>
                        </div>
                        {member.email && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={member.email}>
                            {member.email}
                          </p>
                        )}
                        <span className="text-[10px] text-muted-foreground inline-block mt-1">
                          {t('workspace.memberDesc', 'Thực hiện các nhiệm vụ được phân công')}
                        </span>
                      </div>
                    </div>
                    {isContractLead && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={removingMemberId === memberId}
                        title={t('workspace.removeMember', 'Xóa thành viên khỏi dự án')}
                        className="shrink-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {removingMemberId === memberId ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                )
              })}

              {contractMembers.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/10 flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 stroke-1 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {t('workspace.noAdditionalMembersTitle', 'Chưa có thành viên freelancer bổ sung')}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('workspace.noAdditionalMembersDesc', 'Dự án này hiện đang được xử lý trực tiếp bởi Trưởng dự án.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Nhiệm vụ gần đây & Hoạt động gần đây */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nhiệm vụ gần đây */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground mb-4">
                  {t('workspace.recentTasks', 'Nhiệm vụ gần đây')}
                </h3>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      {t('workspace.noRecentTasks', 'Chưa có nhiệm vụ nào được tạo.')}
                    </div>
                  ) : (
                    tasks.slice(0, 3).map((task) => {
                      const isDone = task.status === 'done'
                      return (
                        <div
                          key={task.id || task._id}
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle2
                              className={cn(
                                'w-4 h-4 shrink-0 transition-colors',
                                isDone ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-300 dark:text-slate-700'
                              )}
                            />
                            <span className={cn('text-xs font-semibold truncate', isDone && 'line-through text-muted-foreground')}>
                              {task.title}
                            </span>
                          </div>

                          <span className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2',
                            isDone 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                              : task.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
                              : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                          )}>
                            {isDone ? t('workspace.done', 'Hoàn thành') : task.status === 'in_progress' ? t('workspace.inProgress', 'Đang thực hiện') : t('workspace.todo', 'Chờ xử lý')}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                >
                  {t('workspace.viewAllTasks', 'Xem tất cả nhiệm vụ')} →
                </button>
              </div>
            </div>

            {/* Hoạt động gần đây */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs">
              <h3 className="font-bold text-base text-foreground mb-4">
                {t('workspace.recentActivity', 'Hoạt động gần đây')}
              </h3>

              <div className="space-y-4 text-xs">
                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {t('workspace.noActivityYet', 'Chưa có hoạt động nào.')}
                  </div>
                ) : (
                  activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      {act.avatar ? (
                        <Avatar
                          src={act.avatar}
                          fallback={(act.name || 'U').charAt(0).toUpperCase()}
                          className="w-7 h-7 text-[10px] shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <p className="text-foreground">
                          {act.text}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimeAgo(act.time)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NHIỆM VỤ (Tasks) */}
      {activeTab === 'tasks' && (
        <div className="space-y-5">
          {/* Top Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder={t('workspace.searchTasks', 'Tìm nhiệm vụ...')}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Dropdown Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">{t('workspace.allStatuses', 'Tất cả trạng thái')}</option>
              <option value="todo">{t('workspace.todo', 'Chờ xử lý')}</option>
              <option value="in_progress">{t('workspace.inProgress', 'Đang thực hiện')}</option>
              <option value="done">{t('workspace.done', 'Hoàn thành')}</option>
            </select>

            {/* Add Task Button for Freelancer (Contract Lead) */}
            {isContractLead ? (
              <Button
                onClick={() => setShowCreateTaskModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('workspace.addTaskBtn', 'Thêm nhiệm vụ')}</span>
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1.5 rounded-xl hidden sm:inline-block">
                {t('project.buyerTaskNotice', 'Chỉ Freelancer phụ trách mới có quyền lập kế hoạch nhiệm vụ')}
              </span>
            )}
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border space-y-2">
                <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                <h4 className="font-bold text-foreground text-sm">
                  {t('workspace.noTasksYet', 'Chưa có nhiệm vụ nào trong dự án.')}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isContractLead
                    ? t('workspace.freelancerTaskDesc', 'Hãy thêm các đầu việc để bắt đầu thực hiện dự án và theo dõi tiến độ.')
                    : t('workspace.buyerTaskDesc', 'Freelancer phụ trách sẽ lập kế hoạch và thêm các nhiệm vụ cho dự án này.')}
                </p>
                {isContractLead && (
                  <Button
                    onClick={() => setShowCreateTaskModal(true)}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('workspace.addTaskBtn', 'Thêm nhiệm vụ')}
                  </Button>
                )}
              </div>
            ) : (
              filteredTasks.map((task, idx) => {
                const isDone = task.status === 'done'
                const isInProgress = task.status === 'in_progress'
                const isCancelled = task.status === 'cancelled'
                const isTodo = task.status === 'todo'
                const assigneeName = getTaskAssigneeName(task)
                const isAssignee = isTaskAssignee(task)

                return (
                  <div
                    key={task.id || task._id}
                    onClick={() => setSelectedTask(task)}
                    className="group p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Left: Status Icon + Title + Description + Metadata chips */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="shrink-0 mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                        ) : isInProgress ? (
                          <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                        ) : isCancelled ? (
                          <Ban className="w-5 h-5 text-rose-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-400/80 dark:border-amber-600 flex items-center justify-center" />
                        )}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={cn('text-sm font-bold text-foreground', isDone && 'line-through text-muted-foreground')}>
                            {task.title}
                          </h4>

                          {/* Assignee Badge */}
                          {isAssignee ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md border border-primary-200/60 dark:border-primary-800/60">
                              <UserCheck className="w-3 h-3" />
                              <span>{t('workspace.assignedToYou', 'Giao cho bạn')}</span>
                            </span>
                          ) : (
                            (() => {
                              const aObj = getTaskAssignee(task)
                              const aName = getTaskAssigneeName(task)
                              if (!aName) return null
                              return (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                  <Avatar
                                    src={aObj?.avatar}
                                    fallback={aName.charAt(0).toUpperCase()}
                                    className="w-3.5 h-3.5 text-[8px]"
                                  />
                                  <span>{aName}</span>
                                </span>
                              )
                            })()
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        {/* Task Subline Metadata: Hours & Due Date */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(task.dueDate)}</span>
                            </span>
                          )}

                          {task.actualHours ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {task.actualHours} {t('workspace.hours', 'giờ')} ({t('workspace.actualHours', 'thực tế')})
                            </span>
                          ) : task.estimatedHours ? (
                            <span>
                              {task.estimatedHours} {t('workspace.hours', 'giờ')} ({t('workspace.estimatedHours', 'ước tính')})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions, Status Badge, Chevron */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      {/* Status Badge */}
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0',
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                          : isInProgress
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60'
                          : isCancelled
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
                      )}>
                        {isDone 
                          ? t('workspace.done', 'Hoàn thành') 
                          : isInProgress 
                          ? t('workspace.inProgress', 'Đang thực hiện') 
                          : isCancelled
                          ? t('workspace.cancelled', 'Đã hủy')
                          : t('workspace.todo', 'Chờ xử lý')}
                      </span>

                      {/* Contextual Action Buttons */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* If Task is TODO */}
                        {isTodo && (
                          <>
                            {/* Start Task: only for Assignee */}
                            {isAssignee && (
                              <button
                                type="button"
                                disabled={project.status === 'planning'}
                                onClick={() => handleStartTask(task)}
                                title={project.status === 'planning' ? t('workspace.projectPlanningTaskNotice', 'Dự án đang lên kế hoạch, chưa thể bắt đầu thực hiện nhiệm vụ.') : t('workspace.startTask', 'Bắt đầu làm')}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs',
                                  project.status === 'planning'
                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-60'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer active:scale-95'
                                )}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{t('workspace.startTask', 'Bắt đầu làm')}</span>
                              </button>
                            )}

                            {/* Edit Task: only for Contract Lead */}
                            {isContractLead && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditTaskModal(task)}
                                title={t('workspace.editTaskBtn', 'Chỉnh sửa')}
                                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Cancel Task: Contract Lead or Buyer */}
                            {(isContractLead || isBuyer) && (
                              <button
                                type="button"
                                onClick={() => handleCancelTask(task)}
                                title={t('workspace.cancelTask', 'Hủy nhiệm vụ')}
                                className="p-1.5 rounded-lg border border-border bg-background hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}

                        {/* If Task is IN_PROGRESS */}
                        {isInProgress && (
                          <>
                            {/* Complete Task: only for Assignee */}
                            {isAssignee && (
                              <button
                                type="button"
                                onClick={() => handleCompleteTask(task)}
                                title={t('workspace.completeTask', 'Hoàn thành')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs active:scale-95 transition-all"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{t('workspace.completeTask', 'Hoàn thành')}</span>
                              </button>
                            )}

                            {/* Cancel Task: Contract Lead or Buyer */}
                            {(isContractLead || isBuyer) && (
                              <button
                                type="button"
                                onClick={() => handleCancelTask(task)}
                                title={t('workspace.cancelTask', 'Hủy nhiệm vụ')}
                                className="p-1.5 rounded-lg border border-border bg-background hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HỢP ĐỒNG (Contract) */}
      {activeTab === 'contract' && (
        <div className="space-y-6">
          {/* Card 1: Hợp đồng dịch vụ */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base text-foreground">
                {t('workspace.serviceContract', 'Hợp đồng dịch vụ')}
              </h3>
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 whitespace-nowrap shrink-0">
                  {t('workspace.signed', 'Đã ký')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground block mb-1.5">{t('workspace.contractCode', 'Mã hợp đồng')}</span>
                <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">{contractCode}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1.5">{t('workspace.signedDate', 'Ngày ký')}</span>
                <span className="font-bold text-foreground">{formatDate(contractCreatedDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1.5">{t('workspace.contractType', 'Loại hợp đồng')}</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 whitespace-nowrap shrink-0">{t('workspace.fixedContract', 'Hợp đồng dịch vụ (Cố định)')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Chi tiết thanh toán */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground border-b border-border/60 pb-3">
              {t('workspace.paymentDetails', 'Chi tiết thanh toán')}
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('workspace.totalValue', 'Tổng giá trị')}</span>
                <span className="font-extrabold text-foreground">{formatCurrency(totalContractPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('workspace.paid', 'Đã thanh toán')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(paidAmount)} ({paidPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('workspace.remaining', 'Còn lại')}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(remainingAmount)} ({100 - paidPercent}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>{t('contract.paymentProgress', 'Tiến độ')}</span>
                <span className="text-foreground">{paidPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    paidPercent === 100
                      ? 'bg-emerald-500'
                      : paidPercent > 0
                      ? 'bg-emerald-600'
                      : 'bg-slate-300 dark:bg-slate-700'
                  )}
                  style={{ width: `${Math.max(paidPercent === 0 ? 0 : 5, paidPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Lịch sử thanh toán */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground border-b border-border/60 pb-3">
              {t('workspace.paymentHistory', 'Lịch sử thanh toán')}
            </h3>

            <div className="space-y-3">
              {paidAmount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs sm:text-sm gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('contract.paymentMilestoneInitial', 'Thanh toán dịch vụ')}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDate(currentContract?.updatedAt || contractCreatedDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(paidAmount)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 whitespace-nowrap shrink-0">
                      {t('workspace.statusPaid', 'Đã thanh toán')}
                    </span>
                  </div>
                </div>
              )}

              {remainingAmount > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs sm:text-sm gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      {t('contract.remainingBalance', 'Số dư còn lại')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDate(deadlineDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">
                      {formatCurrency(remainingAmount)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 whitespace-nowrap shrink-0">
                      {t('workspace.statusPendingPayment', 'Chờ thanh toán')}
                    </span>
                    {isBuyer && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPayModal(remainingAmount)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 px-3 py-1.5 h-auto rounded-xl shadow-xs cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{t('workspace.payNowBtn', 'Thanh toán ngay')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}

              {paidAmount === 0 && remainingAmount === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {t('contract.noPaymentsYet', 'Chưa có giao dịch thanh toán nào được ghi nhận.')}
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  const targetContractId = contractId || contracts[0]?.id || contracts[0]?._id || project?.contract?.id || project?.contract?._id
                  if (targetContractId) {
                    navigate(`/app/contracts/${targetContractId}`)
                  } else {
                    navigate('/app/contracts')
                  }
                }}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{t('workspace.viewContractDetails', 'Xem chi tiết hợp đồng')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIN NHẮN (Messages) */}
      {activeTab === 'messages' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex flex-col h-[580px] overflow-hidden">
          {/* Messages Header */}
          <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <Avatar
                src={partner.avatar}
                fallback={(partner.name || 'U').charAt(0).toUpperCase()}
                className="w-9 h-9 text-xs"
              />
              <div>
                <div className="font-bold text-sm text-foreground">{partner.name}</div>
                <div className="text-[11px] text-muted-foreground">{partnerRoleLabel}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const orderId = project?.orderId || project?.order?._id || project?.order?.id
                if (orderId) {
                  navigate(`/app/messages?orderId=${orderId}`)
                } else {
                  navigate('/app/messages')
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('workspace.openFullChat', 'Mở trang tin nhắn')}</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div ref={chatContainerRef} className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                <Paperclip className="w-8 h-8 opacity-40" />
                <p className="text-xs sm:text-sm">
                  {t('workspace.noMessages', 'Chưa có tin nhắn nào. Gửi lời chào để bắt đầu trao đổi!')}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const senderId = String(msg.senderId || msg.senderID || msg.sender?._id || msg.sender?.id || '')
                const myId = String(currentUser?.id || currentUser?._id || currentUser?.userID || '')
                const isMe = senderId === myId
                const senderName = isMe ? (currentUser?.name || t('workspace.you', 'Bạn')) : (partner.name || t('workspace.partner', 'Đối tác'))
                const senderAvatar = isMe ? currentUser?.avatar : partner.avatar

                return (
                  <div
                    key={msg.id || msg._id || idx}
                    className={cn('flex items-start gap-2.5 max-w-[80%]', isMe ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                  >
                    <Avatar
                      src={senderAvatar}
                      fallback={(senderName || 'U').charAt(0).toUpperCase()}
                      className="w-7 h-7 text-[10px] shrink-0 mt-1"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className={cn('flex items-center gap-2 text-[10px] text-muted-foreground', isMe && 'justify-end')}>
                        <span className="font-semibold">{senderName}</span>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                      </div>

                      <div
                        className={cn(
                          'p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs',
                          isMe
                            ? 'bg-primary-600 text-white rounded-tr-xs'
                            : 'bg-muted text-foreground rounded-tl-xs'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Messages Composer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center gap-2 bg-background">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('workspace.typeMessagePlaceholder', 'Nhập tin nhắn...')}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={sendingMessage || !inputMessage.trim()}
              className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {sendingMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {t('workspace.addTaskBtn', 'Thêm nhiệm vụ')}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('workspace.taskTitle', 'Tiêu đề nhiệm vụ')}
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={t('workspace.taskTitlePlaceholder', 'Ví dụ: Thiết kế trang chủ')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('workspace.taskDescription', 'Mô tả')}
                </label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder={t('workspace.taskDescriptionPlaceholder', 'Mô tả chi tiết các bước cần thực hiện...')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {eligibleAssignees.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('workspace.assignee', 'Người thực hiện')}
                  </label>
                  <select
                    value={newTaskAssigneeId || eligibleAssignees[0]?.id || ''}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    {eligibleAssignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} {assignee.isLead ? `(${t('workspace.projectLeadRole', 'Trưởng dự án')})` : `(${t('workspace.teamMemberRole', 'Thành viên Freelancer')})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('workspace.dueDate', 'Ngày đến hạn')}
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('workspace.estimatedHours', 'Số giờ ước tính')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="text-xs font-semibold"
                >
                  {t('workspace.close', 'Hủy')}
                </Button>
                <Button
                  type="submit"
                  disabled={creatingTask}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-2"
                >
                  {creatingTask ? t('workspace.saving', 'Đang lưu...') : t('workspace.addTaskBtn', 'Thêm nhiệm vụ')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL DRAWER / MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 min-w-0">
                {selectedTask.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : selectedTask.status === 'in_progress' ? (
                  <Clock className="w-5 h-5 text-blue-500 shrink-0 animate-pulse" />
                ) : selectedTask.status === 'cancelled' ? (
                  <Ban className="w-5 h-5 text-rose-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 shrink-0" />
                )}
                <h3 className="font-bold text-base text-foreground truncate">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Notice if project is planning and task is todo */}
              {project.status === 'planning' && selectedTask.status === 'todo' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200/60 dark:border-amber-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('workspace.projectPlanningTaskNotice', 'Dự án đang lên kế hoạch, chưa thể bắt đầu thực hiện nhiệm vụ.')}</span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block mb-1 font-semibold">{t('workspace.taskDescription', 'Mô tả')}</span>
                <p className="text-foreground bg-muted/40 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description || t('workspace.noTasksYet', 'Chưa có mô tả chi tiết cho nhiệm vụ này.')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground block mb-0.5 font-semibold">{t('workspace.status', 'Trạng thái')}</span>
                  <span className={cn(
                    'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                    selectedTask.status === 'done'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                      : selectedTask.status === 'in_progress'
                      ? 'bg-blue-50 text-blue-600 border-blue-200/60'
                      : selectedTask.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                      : 'bg-amber-50 text-amber-600 border-amber-200/60'
                  )}>
                    {selectedTask.status === 'done' 
                      ? t('workspace.done', 'Hoàn thành') 
                      : selectedTask.status === 'in_progress' 
                      ? t('workspace.inProgress', 'Đang thực hiện') 
                      : selectedTask.status === 'cancelled'
                      ? t('workspace.cancelled', 'Đã hủy')
                      : t('workspace.todo', 'Chờ xử lý')}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5 font-semibold">{t('workspace.assignee', 'Người thực hiện')}</span>
                  <div className="text-foreground font-semibold flex items-center gap-1.5 pt-0.5">
                    {isTaskAssignee(selectedTask) ? (
                      <span className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md border border-primary-200/60 text-xs">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t('workspace.assignedToYou', 'Giao cho bạn')}</span>
                      </span>
                    ) : (
                      (() => {
                        const aObj = getTaskAssignee(selectedTask)
                        const aName = getTaskAssigneeName(selectedTask) || '—'
                        return (
                          <div className="flex items-center gap-2 text-xs">
                            <Avatar
                              src={aObj?.avatar}
                              fallback={aName.charAt(0).toUpperCase()}
                              className="w-5 h-5 text-[10px]"
                            />
                            <span>{aName}</span>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5 font-semibold">{t('workspace.dueDate', 'Hạn chót')}</span>
                  <span className="font-bold text-foreground">{formatDate(selectedTask.dueDate)}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-0.5 font-semibold">
                    {selectedTask.actualHours ? t('workspace.actualHours', 'Thời gian thực tế') : t('workspace.estimatedHours', 'Số giờ ước tính')}
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedTask.actualHours 
                      ? `${selectedTask.actualHours} ${t('workspace.hours', 'giờ')}` 
                      : selectedTask.estimatedHours 
                      ? `${selectedTask.estimatedHours} ${t('workspace.hours', 'giờ')}` 
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-border">
              {/* Contextual Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* When Task is TODO */}
                {selectedTask.status === 'todo' && (
                  <>
                    {/* Start Task for Assignee */}
                    {isTaskAssignee(selectedTask) && (
                      <Button
                        size="sm"
                        disabled={project.status === 'planning'}
                        onClick={() => handleStartTask(selectedTask)}
                        className={cn(
                          'text-xs font-bold gap-1.5 cursor-pointer shadow-xs',
                          project.status === 'planning'
                            ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        )}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t('workspace.startTask', 'Bắt đầu làm')}</span>
                      </Button>
                    )}

                    {/* Edit Task for Contract Lead */}
                    {isContractLead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleOpenEditTaskModal(selectedTask)
                        }}
                        className="text-xs font-semibold gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('workspace.editTaskBtn', 'Chỉnh sửa')}</span>
                      </Button>
                    )}

                    {/* Cancel Task for Lead or Buyer */}
                    {(isContractLead || isBuyer) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelTask(selectedTask)}
                        className="text-xs font-semibold gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{t('workspace.cancelTask', 'Hủy')}</span>
                      </Button>
                    )}
                  </>
                )}

                {/* When Task is IN_PROGRESS */}
                {selectedTask.status === 'in_progress' && (
                  <>
                    {/* Complete Task for Assignee */}
                    {isTaskAssignee(selectedTask) && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(selectedTask)}
                        className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{t('workspace.completeTask', 'Hoàn thành')}</span>
                      </Button>
                    )}

                    {/* Cancel Task for Lead or Buyer */}
                    {(isContractLead || isBuyer) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelTask(selectedTask)}
                        className="text-xs font-semibold gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{t('workspace.cancelTask', 'Hủy')}</span>
                      </Button>
                    )}
                  </>
                )}

                {/* When Task is DONE */}
                {selectedTask.status === 'done' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('workspace.done', 'Hoàn thành')}</span>
                  </span>
                )}

                {/* When Task is CANCELLED */}
                {selectedTask.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200/60 dark:border-rose-800/60">
                    <Ban className="w-4 h-4" />
                    <span>{t('workspace.cancelled', 'Đã hủy')}</span>
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTask(null)}
                className="text-xs font-semibold cursor-pointer ml-auto"
              >
                {t('workspace.close', 'Đóng')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditTaskModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary-600" />
                <span>{t('workspace.editTaskModalTitle', 'Chỉnh sửa nhiệm vụ')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditTaskModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('workspace.taskTitle', 'Tiêu đề nhiệm vụ')}
                </label>
                <input
                  type="text"
                  required
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  placeholder={t('workspace.taskTitlePlaceholder', 'Ví dụ: Thiết kế trang chủ')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('workspace.taskDescription', 'Mô tả')}
                </label>
                <textarea
                  rows={3}
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  placeholder={t('workspace.taskDescriptionPlaceholder', 'Mô tả chi tiết các bước cần thực hiện...')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {eligibleAssignees.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('workspace.assignee', 'Người thực hiện')}
                  </label>
                  <select
                    value={editTaskAssigneeId || eligibleAssignees[0]?.id || ''}
                    onChange={(e) => setEditTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    {eligibleAssignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} {assignee.isLead ? `(${t('workspace.projectLeadRole', 'Trưởng dự án')})` : `(${t('workspace.teamMemberRole', 'Thành viên Freelancer')})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('workspace.dueDate', 'Ngày đến hạn')}
                  </label>
                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t('workspace.estimatedHours', 'Số giờ ước tính')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editTaskHours}
                    onChange={(e) => setEditTaskHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditTaskModal(false)}
                  className="text-xs font-semibold cursor-pointer"
                >
                  {t('workspace.close', 'Đóng')}
                </Button>
                <Button
                  type="submit"
                  disabled={updatingTask}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                >
                  {updatingTask ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('workspace.saving', 'Đang lưu...')}</span>
                    </>
                  ) : (
                    <span>{t('workspace.saveChanges', 'Lưu thay đổi')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT CONFIRMATION MODAL */}
      {showPayModal && payModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <span>{t('workspace.confirmPaymentTitle', 'Xác nhận thanh toán')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-muted/40 space-y-2.5">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>{t('workspace.contractCode', 'Hợp đồng')}:</span>
                  <span className="font-bold text-foreground">{contractCode}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>{t('contract.paymentType', 'Loại thanh toán')}:</span>
                  <span className="font-bold text-foreground">
                    {t('contract.payContract', 'Thanh toán hợp đồng')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-2 border-t border-border/60">
                  <span className="font-bold text-foreground text-sm">{t('workspace.amountToPay', 'Số tiền thanh toán')}:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(payModalData.amount)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-primary-50/50 dark:bg-primary-950/20 p-3 rounded-xl border border-primary-100 dark:border-primary-900/40 leading-relaxed">
                {t('workspace.paymentNotice', 'Sau khi bấm xác nhận, số tiền sẽ được ghi nhận và trạng thái hợp đồng được cập nhật ngay lập tức.')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayModal(false)}
                disabled={paying}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('workspace.close', 'Hủy')}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paying}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('workspace.processing', 'Đang xử lý...')}</span>
                  </>
                ) : (
                  <span>{t('workspace.confirmPayBtn', 'Xác nhận thanh toán')}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assignees / Project Members List Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>{t('workspace.assigneesModalTitle', 'Người thực hiện dự án')}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('workspace.assigneesModalDesc', 'Các thành viên chịu trách nhiệm thực hiện công việc trong dự án')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMembersModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assignees list */}
            <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-1">
              {/* 1. Project Lead */}
              <div className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={leadFreelancer?.avatar}
                    fallback={(leadFreelancer?.name || 'L').charAt(0).toUpperCase()}
                    className="w-10 h-10 text-xs shrink-0 rounded-xl"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={leadFreelancer?.name}>
                        {leadFreelancer?.name || 'Project Lead'}
                      </h4>
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary-600 text-white shadow-2xs">
                        <ShieldCheck className="w-3 h-3" />
                        {t('workspace.projectLeadRole', 'Trưởng dự án')}
                      </span>
                    </div>
                    {leadFreelancer?.email && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5" title={leadFreelancer.email}>
                        {leadFreelancer.email}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground italic shrink-0 px-2.5 py-1 rounded-md bg-muted/40 border border-border/40">
                  {t('workspace.leadCannotBeRemoved', 'Không thể xóa Trưởng dự án')}
                </span>
              </div>

              {/* 2. Team Members */}
              {contractMembers.map((member) => {
                const memberId = member._id || member.id
                return (
                  <div key={memberId} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={member.avatar}
                        fallback={(member.name || 'M').charAt(0).toUpperCase()}
                        className="w-10 h-10 text-xs shrink-0 rounded-xl"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={member.name}>
                            {member.name}
                          </h4>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                            {t('workspace.teamMemberRole', 'Thành viên Freelancer')}
                          </span>
                        </div>
                        {member.email && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5" title={member.email}>
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {isContractLead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={removingMemberId === memberId}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/60 h-8 px-2.5 text-xs font-semibold shrink-0 cursor-pointer gap-1.5"
                      >
                        {removingMemberId === memberId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{removingMemberId === memberId ? t('workspace.removing', 'Đang xóa...') : t('workspace.removeMemberBtn', 'Xóa')}</span>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMembersModal(false)}
                className="cursor-pointer"
              >
                {t('workspace.close', 'Đóng')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Freelancer Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>{t('workspace.addFreelancerModalTitle', 'Thêm Freelancer vào dự án')}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('workspace.addFreelancerModalDesc', 'Tìm kiếm tài khoản Freelancer qua email để thêm vào nhóm dự án')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Search Form */}
            <form onSubmit={handleSearchUserByEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('workspace.enterFreelancerEmail', 'Nhập email Freelancer')}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="freelancer@example.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={searchingEmail || !searchEmail.trim()}
                    className="gap-1.5 shrink-0 h-9 text-xs cursor-pointer shadow-xs"
                  >
                    {searchingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{searchingEmail ? t('workspace.searching', 'Đang tìm...') : t('workspace.searchAccount', 'Tìm kiếm')}</span>
                  </Button>
                </div>
              </div>
            </form>

            {/* Search Error */}
            {searchError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Searched User Preview Card */}
            {searchedUser && (() => {
              const isNotFreelancer = searchedUser.role !== 'freelancer'
              const isLead = String(leadFreelancer?._id || leadFreelancer?.id) === String(searchedUser._id || searchedUser.id) ||
                leadFreelancer?.email?.toLowerCase() === searchedUser.email?.toLowerCase()
              const isBuyerAccount = String(buyer?._id || buyer?.id) === String(searchedUser._id || searchedUser.id) ||
                buyer?.email?.toLowerCase() === searchedUser.email?.toLowerCase()
              const isAlreadyMember = contractMembers.some(
                (m) => String(m._id || m.id) === String(searchedUser._id || searchedUser.id) ||
                m.email?.toLowerCase() === searchedUser.email?.toLowerCase()
              )

              let validationError = null
              if (isNotFreelancer) {
                validationError = t('workspace.userNotFreelancer', 'Người dùng này không có tài khoản Freelancer.')
              } else if (isLead) {
                validationError = t('workspace.userIsLead', 'Người dùng này hiện đang là Trưởng dự án.')
              } else if (isBuyerAccount) {
                validationError = t('workspace.userIsBuyer', 'Khách hàng không thể được thêm làm thành viên thực hiện dự án.')
              } else if (isAlreadyMember) {
                validationError = t('workspace.userAlreadyMember', 'Freelancer này đã là thành viên của dự án.')
              }

              return (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-start gap-3">
                    <Avatar
                      src={searchedUser.avatar}
                      fallback={(searchedUser.name || 'U').charAt(0).toUpperCase()}
                      className="w-11 h-11 text-xs shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {searchedUser.name}
                        </h4>
                        <span className={cn(
                          'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md border',
                          searchedUser.role === 'freelancer'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        )}>
                          {searchedUser.role === 'freelancer' ? 'Freelancer' : searchedUser.role}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {searchedUser.email}
                      </p>
                      {(searchedUser.professionalTitle || searchedUser.bio) && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1">
                          {searchedUser.professionalTitle || searchedUser.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {validationError ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t('workspace.accountEligible', 'Tài khoản hợp lệ và sẵn sàng tham gia dự án.')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMemberModal(false)}
                      disabled={addingMember}
                      className="cursor-pointer"
                    >
                      {t('workspace.close', 'Hủy')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={Boolean(validationError) || addingMember}
                      onClick={handleAddMember}
                      className="gap-1.5 cursor-pointer shadow-xs"
                    >
                      {addingMember ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>{addingMember ? t('workspace.adding', 'Đang thêm...') : t('workspace.confirmAddFreelancer', 'Thêm vào dự án')}</span>
                    </Button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
