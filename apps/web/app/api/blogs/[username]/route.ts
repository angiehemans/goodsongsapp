import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';

    // Forward the request to your backend API
    const response = await fetch(`${API_BASE_URL}/users/${username}?page=${page}&per_page=${perPage}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch blogger profile' },
        { status: response.status }
      );
    }

    // If user is disabled, return 404
    if (data.disabled === true) {
      return NextResponse.json(
        { error: 'Blogger not found' },
        { status: 404 }
      );
    }

    // Check if user is a blogger
    // Support both new 'role' field and legacy 'account_type' field
    const role = data.role;
    const accountType = data.account_type;
    const isBlogger =
      role === 'blogger' ||
      accountType === 'blogger' ||
      accountType === 'music_blogger' ||
      accountType === 3;

    if (!isBlogger) {
      return NextResponse.json(
        { error: 'Blogger not found' },
        { status: 404 }
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
