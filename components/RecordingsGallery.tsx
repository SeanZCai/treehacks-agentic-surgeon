import { useEffect, useState } from 'react'
import { X } from 'react-feather'

interface Recording {
  id: string;
  filename: string;
  timestamp: string;
  url: string;
}

interface Props {
  onClose: () => void;
}

export default function RecordingsGallery({ onClose }: Props) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)

  useEffect(() => {
    // Fetch the list of recordings from the API
    fetch('/api/recordings')
      .then(res => res.json())
      .then(data => setRecordings(data))
      .catch(err => console.error('Failed to fetch recordings:', err))
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow-lg max-w-[90%] max-h-[90%] overflow-y-auto border border-[var(--primary-color)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">Recordings</h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-color)] hover:text-[var(--primary-color)]"
          >
            <X />
          </button>
        </div>

        {selectedRecording ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedRecording(null)}
              className="text-sm text-[var(--text-color)] hover:text-[var(--primary-color)]"
            >
              ← Back to gallery
            </button>
            <video
              src={selectedRecording.url}
              controls
              className="w-full rounded-lg border border-[var(--primary-color)]"
              style={{ maxHeight: "70vh" }}
            />
            <p className="text-[var(--text-color)] text-sm">
              Recorded on {new Date(selectedRecording.timestamp).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recordings.map(recording => (
              <div
                key={recording.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedRecording(recording)}
              >
                <video
                  src={recording.url}
                  className="w-full h-48 object-cover rounded-lg border border-[var(--primary-color)] transition-all duration-200 group-hover:border-[var(--secondary-color)]"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                    {new Date(recording.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 