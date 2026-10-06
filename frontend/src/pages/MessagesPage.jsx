import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { conversationService } from '../services/conversationService'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import TypewriterText from '../components/common/TypewriterText'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentUser = useAuthStore((state) => state.user)

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const messagesContainerRef = useRef(null)
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userID

  // Fetch all conversations for user
  const fetchConversations = async (autoSelectOrderId = null) => {
    try {
      setError(null)
      const res = await conversationService.getMyConversations()
      const convs = res.data || []
      setConversations(convs)

      // Handle query param orderId, conversationId, or partnerId
      const qOrderId = autoSelectOrderId || searchParams.get('orderId')
      const qConvId = searchParams.get('conversationId')
      const qPartnerId = searchParams.get('partnerId') || searchParams.get('userId') || searchParams.get('freelancerId')

      if (qOrderId) {
        const found = convs.find((c) => String(c.orderId) === String(qOrderId))
        if (found) {
          setSelectedConversation(found)
        } else {
          // If conversation for this order doesn't exist yet, fetch or create it
          try {
            let directConv = await conversationService.getConversationByOrderId(qOrderId)
            if (!directConv?.data) {
              directConv = await conversationService.createConversation(qOrderId)
            }
            if (directConv?.data) {
              const freshRes = await conversationService.getMyConversations()
              setConversations(freshRes.data || [])
              const target = (freshRes.data || []).find((c) => String(c.orderId) === String(qOrderId)) || directConv.data
              setSelectedConversation(target)
            }
          } catch (e) {
            console.error('Failed to create/get conversation for order:', e)
          }
        }
      } else if (qConvId) {
        const found = convs.find((c) => String(c.id || c._id || c.conversationId) === String(qConvId))
        if (found) {
          setSelectedConversation(found)
        }
      } else if (qPartnerId) {
        const found = convs.find((c) =>
          String(c.partner?._id || c.partner?.id) === String(qPartnerId) ||
          c.participants?.some((p) => String(p._id || p.id || p) === String(qPartnerId))
        )
        if (found) {
          setSelectedConversation(found)
        } else {
          // Do NOT save to DB yet! Keep in-memory draft so no empty conversation is persisted.
          // It will only be created in the database when the user actually sends their first message.
          const qPartnerName = searchParams.get('partnerName') || 'Freelancer'
          const draftConv = {
            id: `draft_${qPartnerId}`,
            _id: `draft_${qPartnerId}`,
            conversationId: `draft_${qPartnerId}`,
            isDraft: true,
            targetUserId: qPartnerId,
            partner: {
              id: qPartnerId,
              _id: qPartnerId,
              name: qPartnerName,
              avatar: null
            },
            participants: [currentUserId, qPartnerId],
            unreadCount: 0
          }
          setSelectedConversation(draftConv)
          setMessages([])
        }
      } else if (!selectedConversation && convs.length > 0 && window.innerWidth >= 768) {
        // On desktop, auto-select first conversation if none selected
        setSelectedConversation(convs[0])
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError(err.response?.data?.message || err.message || t('message.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  // Fetch messages for selected conversation
  const fetchMessages = async (convId) => {
    if (!convId || selectedConversation?.isDraft) return
    try {
      setLoadingMessages(true)
      const res = await conversationService.getMessages(convId)
      setMessages(res.data || [])
      // Update unread count for this conversation in list
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c.id || c._id || c.conversationId) === String(convId)) {
            return { ...c, unreadCount: 0 }
          }
          return c
        })
      )
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (selectedConversation) {
      if (selectedConversation.isDraft) {
        setMessages([])
      } else {
        const convId = selectedConversation.id || selectedConversation._id || selectedConversation.conversationId
        fetchMessages(convId)
      }
    } else {
      setMessages([])
    }
  }, [selectedConversation?.id, selectedConversation?._id, selectedConversation?.conversationId, selectedConversation?.isDraft])

  // Scroll only the messages container to bottom (never scroll the browser window)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Periodic polling for new messages in active chat
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isDraft) return
    const convId = selectedConversation.id || selectedConversation._id || selectedConversation.conversationId
    const interval = setInterval(async () => {
      try {
        const res = await conversationService.getMessages(convId)
        if (res?.data && res.data.length !== messages.length) {
          setMessages(res.data)
        }
      } catch (e) {}
    }, 8000)
    return () => clearInterval(interval)
  }, [selectedConversation, messages.length])

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !selectedConversation) return

    const content = inputMessage.trim()
    let convId = selectedConversation.id || selectedConversation._id || selectedConversation.conversationId
    setInputMessage('')
    setSending(true)

    try {
      if (selectedConversation.isDraft) {
        // Create conversation in DB ONLY now upon sending the first message!
        const createRes = await conversationService.createConversation({ targetUserId: selectedConversation.targetUserId })
        if (createRes?.data) {
          convId = createRes.data.id || createRes.data._id || createRes.data.conversationID
        }
      }

      const res = await conversationService.sendMessage(convId, content)
      const newMsg = res.data || {
        content,
        senderId: currentUserId,
        senderID: currentUserId,
        createdAt: new Date().toISOString()
      }
      setMessages((prev) => [...prev, newMsg])

      // Refresh conversations list from server so it now properly contains the newly created conversation with its message
      const freshRes = await conversationService.getMyConversations()
      const freshConvs = freshRes.data || []
      setConversations(freshConvs)

      if (selectedConversation.isDraft) {
        const createdTarget = freshConvs.find((c) => String(c.id || c._id || c.conversationId) === String(convId)) || {
          ...selectedConversation,
          id: convId,
          _id: convId,
          conversationId: convId,
          isDraft: false,
          lastMessage: {
            content,
            createdAt: new Date().toISOString(),
            senderId: currentUserId
          }
        }
        setSelectedConversation(createdTarget)
      } else {
        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) => {
            if (String(c.id || c._id || c.conversationId) === String(convId)) {
              return {
                ...c,
                lastMessage: {
                  content,
                  createdAt: new Date().toISOString(),
                  senderId: currentUserId
                }
              }
            }
            return c
          })
        )
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error(t('message.failedToSend'))
      setInputMessage(content)
    } finally {
      setSending(false)
    }
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const partnerName = (c.partner?.name || '').toLowerCase()
    const orderTitle = (c.orderTitle || '').toLowerCase()
    return partnerName.includes(q) || orderTitle.includes(q)
  })

  // Format date helper
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return t('message.justNow', 'Vừa xong')
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 md:pt-6 md:pb-10 space-y-4">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1)
            } else {
              navigate('/app/home')
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t('orderDetail.back', 'Quay lại')}</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight min-h-[2.25rem]">
          <TypewriterText text={t('message.myMessages', 'Tin nhắn của tôi')} speed={30} />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground min-h-[1.5rem]">
          <TypewriterText
            text={t(
              'message.myMessagesSubtitle',
              'Trao đổi trực tiếp với đối tác về các đơn hàng và dự án của bạn.'
            )}
            speed={16}
            delay={250}
          />
        </p>
      </div>

      {/* Main Container */}
      <div className="h-[calc(100vh-220px)] min-h-[550px] max-h-[750px] rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs overflow-hidden flex">
        {/* Left: Conversation List */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 border-r border-border flex flex-col shrink-0 bg-background/50',
            selectedConversation ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Search bar */}
          <div className="p-3.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('message.searchConversations', 'Tìm kiếm hội thoại...')}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-3 text-muted-foreground">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-xs">{error}</p>
                <Button onClick={() => fetchConversations()} variant="outline" size="sm" className="gap-1.5 mx-auto">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('common.tryAgain', 'Thử lại')}
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <h3 className="font-semibold text-sm text-foreground">
                  {conversations.length === 0
                    ? t('message.noConversations', 'Chưa có cuộc trò chuyện nào')
                    : t('common.notFound', 'Không tìm thấy kết quả')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {conversations.length === 0
                    ? t('message.noConversationsDesc', 'Các cuộc trò chuyện sẽ tự động xuất hiện khi bạn trao đổi trong đơn hàng hoặc dự án.')
                    : t('common.tryAnotherSearch', 'Thử tìm kiếm với từ khóa khác')}
                </p>
                {conversations.length === 0 && (
                  <Button
                    onClick={() => navigate('/app/orders')}
                    size="sm"
                    className="mt-2 text-xs font-semibold"
                  >
                    {t('message.goToOrders', 'Đi đến Đơn hàng')}
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const convId = conv.id || conv._id || conv.conversationId
                const isSelected =
                  selectedConversation &&
                  String(selectedConversation.id || selectedConversation._id || selectedConversation.conversationId) === String(convId)
                const partner = conv.partner || { name: 'User', avatar: null }
                const unread = conv.unreadCount || 0

                return (
                  <div
                    key={convId}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      'p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative',
                      isSelected
                        ? 'bg-primary-50/80 dark:bg-primary-950/40 border-l-4 border-primary-600'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <Avatar
                      src={partner.avatar}
                      fallback={(partner.name || 'U').charAt(0).toUpperCase()}
                      className="w-10 h-10 text-xs shrink-0 ring-1 ring-border/50"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn('text-xs sm:text-sm font-semibold truncate', unread > 0 ? 'text-foreground font-bold' : 'text-foreground')}>
                          {partner.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                        </span>
                      </div>

                      {/* Order Title Tag */}
                      {conv.orderTitle && (
                        <div className="text-[11px] text-primary-600 dark:text-primary-400 font-medium truncate mt-0.5">
                          {conv.orderTitle}
                        </div>
                      )}

                      {/* Last Message Snippet */}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={cn(
                          'text-xs truncate',
                          unread > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'
                        )}>
                          {conv.lastMessage?.content || t('message.conversations', 'Cuộc trò chuyện mới')}
                        </p>
                        {unread > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 bg-card',
            selectedConversation ? 'flex' : 'hidden md:flex'
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedConversation(null)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Avatar
                    src={selectedConversation.partner?.avatar}
                    fallback={(selectedConversation.partner?.name || 'U').charAt(0).toUpperCase()}
                    className="w-9 h-9 text-xs shrink-0 ring-1 ring-border/60"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">
                      {selectedConversation.partner?.name || 'User'}
                    </div>
                    {selectedConversation.orderTitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {t('message.orderRef', 'Đơn hàng')}: {selectedConversation.orderTitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Link to order */}
                {selectedConversation.orderId && (
                  <Link
                    to={`/app/orders/${selectedConversation.orderId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 shrink-0 transition-colors"
                  >
                    <span>{t('message.viewOrder', 'Xem đơn hàng')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {/* Chat Messages Body */}
              <div
                ref={messagesContainerRef}
                className="flex-1 p-5 overflow-y-auto space-y-4 bg-muted/10"
              >
                {loadingMessages ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className={cn('flex items-start gap-2.5 max-w-[60%] animate-pulse', n % 2 === 0 ? 'ml-auto flex-row-reverse' : '')}>
                        <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                        <div className="h-10 bg-muted rounded-2xl w-48" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p className="text-xs sm:text-sm max-w-xs">
                      {t('message.noMessagesInChat', 'Chưa có tin nhắn nào trong hội thoại này. Gửi lời chào để bắt đầu trao đổi!')}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderId = msg.senderId || msg.senderID || msg.sender?._id || msg.sender?.id
                    const isMe = String(senderId) === String(currentUserId)
                    const senderName = isMe ? currentUser?.name : (selectedConversation.partner?.name || 'User')
                    const senderAvatar = isMe ? currentUser?.avatar : selectedConversation.partner?.avatar

                    return (
                      <div
                        key={msg.id || msg._id || idx}
                        className={cn('flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]', isMe ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                      >
                        <Avatar
                          src={senderAvatar}
                          fallback={(senderName || 'U').charAt(0).toUpperCase()}
                          className="w-7 h-7 text-[10px] shrink-0 mt-1 ring-1 ring-border/50"
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
                                : 'bg-muted/80 dark:bg-muted text-foreground rounded-tl-xs'
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

              {/* Chat Composer */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-border flex items-center gap-2 bg-background">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('message.typeMessage', 'Nhập tin nhắn...')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t('message.send', 'Gửi')}</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                <MessageSquare className="w-7 h-7 opacity-50" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                {t('message.selectConversation', 'Chọn một cuộc hội thoại')}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t('message.selectConversationDesc', 'Chọn cuộc trò chuyện bên trái để xem nội dung và gửi tin nhắn.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
