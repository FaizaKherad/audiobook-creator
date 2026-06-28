import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=no_code_provided`);
  }

  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.redirect(`${origin}/auth?error=env_not_configured`);
  }

  const redirect_uri = `${origin}/api/auth/callback`;

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Failed to exchange code for token:', errorData);
      return NextResponse.redirect(`${origin}/auth?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Fetch user profile details from Google's userinfo endpoint
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${origin}/auth?error=failed_to_fetch_user`);
    }

    const googleUser = await userResponse.json();

    const email = googleUser.email;
    const name = googleUser.name || email.split('@')[0];
    const image = googleUser.picture || '';

    // Redirect to the client-side callback page with parameters
    const callbackUrl = new URL(`${origin}/auth/callback`);
    callbackUrl.searchParams.set('email', email);
    callbackUrl.searchParams.set('name', name);
    if (image) {
      callbackUrl.searchParams.set('image', image);
    }

    return NextResponse.redirect(callbackUrl.toString());
  } catch (err) {
    console.error('OAuth Callback Exception:', err);
    return NextResponse.redirect(`${origin}/auth?error=oauth_internal_error`);
  }
}
