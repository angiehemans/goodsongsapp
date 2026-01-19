import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Debug logging
    console.log('Backend API URL:', API_BASE_URL);
    console.log('Attempting login with:', { email: body.email });

    if (!API_BASE_URL) {
      return NextResponse.json(
        { error: 'Backend API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.' },
        { status: 500 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Backend response text (first 200 chars):', responseText.substring(0, 200));

    // Check if response is HTML (likely an error page)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      return NextResponse.json(
        { error: 'Backend API returned HTML instead of JSON. Please check if your backend API is running and accessible.' },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from backend API' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || 'Login failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}