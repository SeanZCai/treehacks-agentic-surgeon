'use client'

import Message from '@/components/Message'
import TextAnimation from '@/components/TextAnimation'
import Checklist from '@/components/Checklist'
import { type Role, useConversation } from '@11labs/react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState, useRef } from 'react'
import { X } from 'react-feather'
import { toast } from 'sonner'
import { processConversation } from '@/lib/compliance'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useTypingEffect } from '@/components/useTypingEffect'

export default function ConversationPage() {
  const { slug } = useParams()
  // State to control landing page display
  const [landingEntered, setLandingEntered] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  // Pre-existing conversation state
  const [currentText, setCurrentText] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [complianceInfo, setComplianceInfo] = useState('')
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const screenshareVideoRef = useRef<HTMLVideoElement>(null)
  const animatedText = useTypingEffect(currentText || "Listening for audio...", 125)

  // When the screenStream changes, attach it to the video element
  useEffect(() => {
    if (screenshareVideoRef.current && screenStream) {
      screenshareVideoRef.current.srcObject = screenStream
    }
  }, [screenStream])

  // Function to start screen recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      setScreenStream(stream)
      
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
    } catch (err) {
      console.error("Error starting screen recording:", err)
      toast('Failed to start screen recording')
    }
  }

  // Function to stop screen recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
  }

  // Cleanup function
  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [recordingUrl, screenStream])

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
        // Only update text if it's different to prevent duplicates
        if (currentText !== message) {
          setCurrentText(message)
        }
      }

      // Only log the message if it's not a duplicate
      const isDuplicate = messages.some(m => 
        m.role === (source === 'ai' ? 'assistant' : 'user') && 
        m.formatted.transcript === message
      );

      if (!isDuplicate) {
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
      }
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

  const handleBackClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmBack = (confirmed: boolean) => {
    setShowConfirmDialog(false)
    if (confirmed) {
      window.location.href = '/'
    }
  }

  // Render landing view if user hasn't clicked "Enter"
  if (!landingEntered) {
    return (
      <div className="relative w-screen h-screen flex justify-center items-center overflow-hidden" style={{ background: 'var(--bg-color)' }}>
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
        <div className="landing-content">
          <h1 className="landing-title">Surgentic</h1>
          <p className="landing-subtitle">
            Confidence. Safety. Every surgery, every time.
          </p>
          <button
            onClick={handleEnter}
            className="enter-button"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  // Render the conversation interface after landing page is dismissed
  return (
    <div className="container">
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h2><strong>Are you sure?</strong></h2>
            <p>Do you want to return to the home page?</p>
            <div className="confirm-buttons">
              <button onClick={() => handleConfirmBack(true)}>Yes</button>
              <button onClick={() => handleConfirmBack(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      <div className="left-column">
        <header className="app-header">
          <button className="back-button" onClick={handleBackClick}>
            ← Back
          </button>
          <button
            className="start-button ml-4 bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)]"
            onClick={conversation.status !== 'connected' ? handleStartListening : handleStopListening}
          >
            {conversation.status !== 'connected' ? 'Start Surgentic' : 'Stop Surgentic'}
          </button>
          <button
            className="start-button ml-4 bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)]"
            onClick={screenStream ? stopRecording : startRecording}
          >
            {screenStream ? 'Stop Screen Recording' : recordingUrl ? 'Record Screen Again' : 'Record Screen'}
          </button>
        </header>

        {screenStream && (
          <div className="mt-4">
            <video
              ref={screenshareVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg border border-[var(--primary-color)] bg-[var(--surface-color)]"
              style={{ maxHeight: "390px" }}
            />
          </div>
        )}

        <div className="main-content" style={{ marginRight: "20px" }}>
          <div className="transcription-section">
            <div className="transcription-header">
              <h2>Live Transcription</h2>
              <TextAnimation
                isAudioPlaying={conversation.isSpeaking}
                onStopListening={handleStopListening}
                onStartListening={handleStartListening}
              />
            </div>
            <div className="transcription-content">
              <p>
                {animatedText}
                <span className="blinking-cursor" />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="right-column">
        <h2 className="checklist-title">Surgical Safety Checklist</h2>
        <div className="checklist">
          <Checklist />
        </div>
        <div className="mt-auto pt-4 flex flex-col items-center w-full gap-2">
          {messages.length > 0 && (
            <button
              className="text-sm underline mb-2 w-3/4 py-2 px-4 bg-[var(--surface-color)] border border-[var(--primary-color)] rounded-md hover:bg-[rgba(34,195,217,0.1)]"
              onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
            >
              Show Transcript
            </button>
          )}
          {recordingUrl && (
            <button
              className="text-sm underline mb-2 w-3/4 py-2 px-4 bg-[var(--surface-color)] border border-[var(--primary-color)] rounded-md hover:bg-[rgba(34,195,217,0.1)]"
              onClick={() => window.open(`/recording?url=${encodeURIComponent(recordingUrl)}`, '_blank')}
            >
              Show Recording
            </button>
          )}
        </div>
      </div>

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
    </div>
  )
}
