export async function processConversation(conversation: string): Promise<string> {
  console.log("Calling compliance API with conversation:", conversation)
  try {
    const response = await fetch('http://localhost:5001/process-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    })
    if (!response.ok) {
      console.log(`Compliance API responded with status ${response.status}`)
    }
    const data = await response.json()
    if (data.error) {
      console.log(data.error)
    }
    console.log("Compliance API response:", data)
    return data.response
  } catch (error) {
    console.error("Error in processConversation:", error)
    throw error
  }
} 