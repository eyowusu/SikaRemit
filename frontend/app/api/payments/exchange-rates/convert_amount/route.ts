import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const amount = searchParams.get('amount')

  if (!from || !to || !amount) {
    return NextResponse.json(
      { error: 'Missing required parameters: from, to, amount' },
      { status: 400 }
    )
  }

  try {
    // Forward the request to the backend API
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const token = request.headers.get('authorization')
    
    const response = await fetch(
      `${API_URL}/api/v1/payments/exchange-rates/convert_amount/?from=${from}&to=${to}&amount=${amount}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: token })
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to convert currency' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
