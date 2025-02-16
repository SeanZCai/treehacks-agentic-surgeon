'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RecordingPage() {
  const searchParams = useSearchParams()
  const recordingUrl = searchParams.get('url')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recordingUrl) {
      setError('No recording URL provided')
    }
  }, [recordingUrl])

  return (
    <div className="min-h-screen bg-[var(--bg-color)] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-[var(--text-color)] text-2xl font-bold">Recorded Session</h1>
          <button 
            onClick={() => window.history.back()}
            className="back-button"
          >
            ← Back
          </button>
        </header>
        
        {error ? (
          <div className="text-red-500 text-center p-4 bg-[var(--surface-color)] rounded-lg">
            {error}
          </div>
        ) : (
          <div className="bg-[var(--surface-color)] rounded-lg p-4 border border-[var(--primary-color)]">
            <video 
              src={recordingUrl || ''} 
              controls 
              className="w-full rounded-lg"
              style={{ maxHeight: "80vh" }}
            />
          </div>
        )}
      </div>
    </div>
  )
} 