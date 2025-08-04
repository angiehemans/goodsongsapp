import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to create band' };
      }

      return NextResponse.json(
        { error: errorData.error || errorData.errors || 'Failed to create band' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Band creation error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}