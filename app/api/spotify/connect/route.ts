import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const response = await fetch(`${API_BASE_URL}/spotify/connect`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      redirect: 'manual', // Don't follow redirects automatically
    });

    // If backend returns a redirect (which contains the Spotify auth URL)
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        return NextResponse.json({ auth_url: redirectUrl });
      }
    }

    // Try to parse as JSON if it's not a redirect
    let data;
    try {
      data = await response.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid response from backend API' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get Spotify connect URL' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}