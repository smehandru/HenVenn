import { useState, useRef, useEffect } from 'react'
import './FloatingChatBot.css'
import { ChatMessage } from '../types'

interface FloatingChatBotProps {
  onSend: (message: string) => void
  messages: ChatMessage[]
  isLoading?: boolean
}

// Format AI response text with markdown-like formatting
const formatMessageText = (text: string): JSX.Element[] => {
  // Split by double newlines to create paragraphs
  const paragraphs = text.split(/\n\n+/)

  return paragraphs.map((para, idx) => {
    // Process inline formatting (bold text with **)
    const parts = para.split(/(\*\*.*?\*\*)/)
    const formatted = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Bold text
        return <strong key={partIdx}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    return <p key={idx}>{formatted}</p>
  })
}

const FloatingChatBot = ({ onSend, messages, isLoading = false }: FloatingChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSend(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button className="floating-chat-button" onClick={toggleChat}>
          💬 Spør Henvenn
        </button>
      )}

      {/* Expanded chat window */}
      {isOpen && (
        <div className="floating-chat-window">
          <div className="chat-header">
            <h3>Spør Henvenn</h3>
            <button className="close-button" onClick={toggleChat}>
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>Hei! Jeg kan svare på spørsmål om ortopedi basert på prioriteringsveilederen og metodeboken.</p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`chat-message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                >
                  <div className="message-content">
                    {message.sender === 'ai' ? formatMessageText(message.text) : message.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chat-message ai-message">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Still et spørsmål om ortopedi..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className="chat-send-button"
              disabled={isLoading || !inputValue.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingChatBot
