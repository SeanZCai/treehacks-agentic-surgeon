import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const recordingsDir = path.join(process.cwd(), 'public', 'videos')
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true })
    }

    const files = fs.readdirSync(recordingsDir)
    const recordings = files
      .filter(file => file.endsWith('.webm'))
      .map(filename => {
        const stats = fs.statSync(path.join(recordingsDir, filename))
        return {
          id: filename.replace('.webm', ''),
          filename,
          timestamp: stats.birthtime.toISOString(),
          url: `/videos/${filename}`
        }
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(recordings)
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('recording') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const recordingsDir = path.join(process.cwd(), 'public', 'videos')
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true })
    }

    const filename = `recording_${Date.now()}.webm`
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(recordingsDir, filename), buffer)

    return NextResponse.json({
      id: filename.replace('.webm', ''),
      filename,
      timestamp: new Date().toISOString(),
      url: `/videos/${filename}`
    })
  } catch (error) {
    console.error('Error saving recording:', error)
    return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 })
  }
} 