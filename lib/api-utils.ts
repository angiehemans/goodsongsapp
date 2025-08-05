import { NextRequest, NextResponse } from 'next/server';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Extract and validate authorization token from request headers
 */
export function extractAuthToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError('Authorization token required', 401);
  }
  
  return authHeader.substring(7);
}

/**
 * Create standardized error responses
 */
export class ApiError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API response with consistent error parsing
 */
export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText || 'Unknown error occurred' };
    }

    throw new ApiError(
      errorData.error || errorData.errors || 'Request failed',
      response.status
    );
  }

  return response.json();
}

/**
 * Make authenticated request to backend API
 */
export async function makeBackendRequest(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<any> {
  const { token, ...fetchOptions } = options;
  
  if (!API_BASE_URL) {
    throw new ApiError('Backend API URL not configured', 500);
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }

  const headers = {
    ...baseHeaders,
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  return handleApiResponse(response);
}

/**
 * Create standardized API route handler with error handling
 */
export function createApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<any>
) {
  return async function(request: NextRequest, context?: any) {
    try {
      const result = await handler(request, context);
      
      if (result instanceof NextResponse) {
        return result;
      }
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('API handler error:', error);
      
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }
      
      return NextResponse.json(
        { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  };
}

/**
 * Create authenticated API route handler
 */
export function createAuthApiHandler(
  handler: (request: NextRequest, token: string, context?: any) => Promise<any>
) {
  return createApiHandler(async (request: NextRequest, context?: any) => {
    const token = extractAuthToken(request);
    return handler(request, token, context);
  });
}