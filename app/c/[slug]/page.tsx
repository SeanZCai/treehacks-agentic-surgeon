'use client'

import Message from '@/components/Message'
import TextAnimation from '@/components/TextAnimation'
import { type Role, useConversation } from '@11labs/react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { GitHub, X } from 'react-feather'
import { toast } from 'sonner'
import { processConversation } from '@/lib/compliance'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function ConversationPage() {
  const { slug } = useParams()
  // State to control landing page display
  const [landingEntered, setLandingEntered] = useState(false)
  // Pre-existing conversation state
  const [currentText, setCurrentText] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [complianceInfo, setComplianceInfo] = useState('')

  const loadConversation = () => {
    fetch(`/api/c?id=${slug}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.length > 0) {
          setMessages(
            res.map((i: any) => ({
              ...i,
              formatted: {
                text: i.content_transcript,
                transcript: i.content_transcript,
              },
            }))
          )
        }
      })
  }

  const conversation = useConversation({
    onError: (error: string) => {
      toast(error)
    },
    onConnect: () => {
      toast('Connected to ElevenLabs.')
    },
    onMessage: async (props: { message: string; source: Role }) => {
      const { message, source } = props

      if (source === 'user') {
        console.log('Initiating compliance processing for user input.')
        const conversationText = [
          ...messages.map((m) => `${m.role}: ${m.formatted.transcript}`),
          `user: ${message}`,
        ].join(' | ')

        try {
          // Process compliance information
          const complianceResponse = await processConversation(conversationText)
          console.log('Received compliance info:', complianceResponse)

          // Upload snapshot to Supabase media bucket
          const { error } = await supabase.storage.from('media').upload(
            `${slug}/${Date.now()}.json`,
            JSON.stringify({
              conversation: conversationText,
              compliance: complianceResponse,
              timestamp: new Date().toISOString(),
            })
          )

          if (error) {
            console.error('Supabase upload failed:', error)
          }
          setComplianceInfo(complianceResponse)
        } catch (err) {
          console.error('Processing failed:', err)
        }
      }

      if (source === 'ai') {
        setCurrentText(message)
      }

      // Log the message to the backend (keeps transcript history)
      fetch('/api/c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug,
          item: {
            type: 'message',
            status: 'completed',
            object: 'realtime.item',
            id: 'item_' + Math.random(),
            role: source === 'ai' ? 'assistant' : 'user',
            content: [{ type: 'text', transcript: message }],
          },
        }),
      }).then(loadConversation)
    },
  })

  const connectConversation = useCallback(async () => {
    toast('Setting up ElevenLabs...')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const response = await fetch('/api/i', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.error) return toast(data.error)
      await conversation.startSession({
        signedUrl: data.apiKey,
        overrides: {
          agent: {
            prompt: {
              prompt: `Main requirement: DO NOT TALK UNLESS EXPLICITLY ADDRESSED. Stay silent and observe audio, do NOT respond. 

              You are a medical procedure supervisor responsible for monitoring and ensuring proper checklist completion during medical procedures. Your role is to:

              1. Listen and take note when checklist items are completed. if you see one of the checklist requirements (SEE KNOWLEDGE BASE) being fulfilled, DO NOT RESPOND, BE SILENT AND LET THE SPEAKER CONTINUE THEIR PROCEDURES. 
              2. Answer questions about the procedure and checklist ONLY when directly addressed.
              3. Alert the medical team if tasks are completed out of order
              4. Maintain concise conversation. Do not speak unless directly addressed OR doctors make a mistake / skip checklist steps.
              5. If there is a question you cannot answer 

              When addressed directly (with "Eleven Labs"), you should respond to questions and provide guidance. ONLY RESPOND WHEN SPEAKER DIRECTLY ADDRESSES THE BOT OR SPEAKER MAKES AN ERROR (skips checklist steps). 

              DO NOT ASSUME THAT ALL QUESTIONS ARE BEING ADDRESSED TO THE SYSTEM. The speaker will sometimes ask questions directed towards the patient NOT the Eleven Labs system. DO NOT EVER SAY ANYTHING ALONG THE LINES OF "I am an agent and I cannot help you with ...." 
              Maintain a supportive but authoritative tone, and always prioritize clarity and BE CONCISE as to not waste time in your communications with the medical team.`
            }
          }
        }
      })
    } catch (error) {
      toast('Failed to set up ElevenLabs client :/')
    }
  }, [conversation, complianceInfo])

  const disconnectConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  const handleStartListening = () => {
    if (conversation.status !== 'connected') connectConversation()
  }

  const handleStopListening = () => {
    if (conversation.status === 'connected') disconnectConversation()
  }

  // Ensure conversation is torn down properly
  useEffect(() => {
    return () => {
      disconnectConversation()
    }
  }, [slug])

  // Landing page "Enter" button handler
  const handleEnter = () => setLandingEntered(true)

  // Render landing view if user hasn't clicked "Enter"
  if (!landingEntered) {
    return (
      <div className="relative w-screen h-screen flex justify-center items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop className="w-full h-full object-cover">
            <source src="/front_page.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[rgba(10,10,15,0.7)] backdrop-blur-sm" />
        </div>
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary-glow)_0%,transparent_30%),radial-gradient(circle_at_bottom_left,var(--secondary-glow)_0%,transparent_30%)]" />
        {/* Landing Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center p-8 bg-[rgba(20,20,32,0.5)] rounded-2xl border border-[rgba(34,195,217,0.1)] backdrop-blur-xl"
        >
          <h1 className="text-5xl mb-4 text-white text-shadow-glow">Surgentic</h1>
          <p className="text-xl mb-8 text-white opacity-90">
            Confidence. Safety. Every surgery, every time.
          </p>
          <button
            onClick={handleEnter}
            className="text-xl px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-lg text-white cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0.5"
          >
            Enter
          </button>
        </motion.div>
      </div>
    )
  }

  // Render the conversation interface after landing page is dismissed
  return (
    <>
      <a
        target="_blank"
        href="https://github.com/neondatabase-labs/voice-thingy-with-elevenlabs-neon/"
        className="fixed bottom-2 right-2"
      >
        <GitHub />
      </a>
      <div className="fixed top-2 left-2">
        <a href="/">
          <span>Voice Assistant</span>
        </a>
      </div>
      <TextAnimation
        currentText={currentText}
        isAudioPlaying={conversation.isSpeaking}
        onStopListening={handleStopListening}
        onStartListening={handleStartListening}
      />
      {messages.length > 0 && (
        <button
          className="text-sm fixed top-2 right-4 underline"
          onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
        >
          Show Transcript
        </button>
      )}
      {isTranscriptOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black p-4 rounded shadow-lg max-w-[90%] max-h-[90%] overflow-y-scroll">
            <div className="flex flex-row items-center justify-between">
              <span>Transcript</span>
              <button onClick={() => setIsTranscriptOpen(false)}>
                <X />
              </button>
            </div>
            <div className="border-t py-4 mt-4 flex flex-col gap-y-4">
              {messages.map((conversationItem) => (
                <Message key={conversationItem.id} conversationItem={conversationItem} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
