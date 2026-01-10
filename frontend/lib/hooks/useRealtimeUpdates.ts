import { useEffect, useRef, useState } from 'react'

interface RealtimeUpdate {
  type: string
  data: any
  timestamp: string
}

export function useRealtimeUpdates(channel: string, onUpdate?: (update: RealtimeUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      console.warn('No access token found for WebSocket connection')
      return
    }

    // Connect to WebSocket
    const ws = new WebSocket(`${wsUrl}/ws/${channel}/?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log(`WebSocket connected to ${channel}`)
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const update: RealtimeUpdate = JSON.parse(event.data)
        setLastUpdate(update)
        if (onUpdate) {
          onUpdate(update)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log(`WebSocket disconnected from ${channel}`)
      setIsConnected(false)
    }

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [channel, onUpdate])

  const send = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  return {
    isConnected,
    lastUpdate,
    send
  }
}
