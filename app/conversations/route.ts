import { neon, neonConfig } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

neonConfig.poolQueryViaFetch = true

export async function GET() {
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL provided')
    return NextResponse.json({ error: 'Database URL not configured' })
  }
  
  const sql = neon(process.env.DATABASE_URL)
  
  try {
    // Simple count query to check if we have any messages
    const count = await sql`SELECT COUNT(*) FROM messages`
    console.log('Total messages in database:', count)

    if (count[0].count === '0') {
      return NextResponse.json({ 
        message: 'No conversations found - database is empty',
        totalMessages: 0 
      })
    }

    const rows = await sql(`
      SELECT 
        session_id,
        array_agg(
          json_build_object(
            'created_at', created_at,
            'role', role,
            'content', content_transcript
          ) ORDER BY created_at
        ) as messages
      FROM messages 
      GROUP BY session_id
      ORDER BY session_id;
    `)
    
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Detailed error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 