import { NextResponse } from 'next/server';

export async function GET() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  if (!client_id) {
    return new NextResponse('Google Client ID is not configured in environment variables.', { status: 500 });
  }

  // Determine the redirect URI dynamically (using default localhost for local dev)
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirect_uri = `${origin}/api/auth/callback`;

  const scopes = ['openid', 'email', 'profile'].join(' ');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(client_id)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&prompt=select_account`;

  return NextResponse.redirect(authUrl);
}
