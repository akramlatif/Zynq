import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // TODO: In a real implementation, you would call the backend server here
    // e.g., const res = await fetch('http://localhost:3001/api/auth/login', { ... })
    // For now, we mock the successful response and token
    
    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    // Mock Backend Validation (Accept any for demo purposes)
    const mockUser = {
      id: '1',
      phone,
       shopName: 'Zynq',
      ownerName: 'Ali',
    };
    const mockToken = 'mock-jwt-token-12345';

    // Create the response
    const response = NextResponse.json({
      message: 'Login successful',
      user: mockUser,
    });

    // Set the token in an httpOnly cookie
    response.cookies.set({
      name: 'auth_token',
      value: mockToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
