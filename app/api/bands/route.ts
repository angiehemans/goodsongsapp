import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const contentType = request.headers.get('content-type');

    let body;
    let headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    // Handle FormData (with file uploads)
    if (contentType?.includes('multipart/form-data')) {
      body = await request.formData();
    } else {
      // Handle JSON
      body = JSON.stringify(await request.json());
      headers = {
        ...headers,
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(`${API_BASE_URL}/bands`, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || 'Failed to create band' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}