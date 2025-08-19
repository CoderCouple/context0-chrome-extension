/**
 * Sample Next.js frontend integration for Chrome Extension authentication.
 * Add this to your sign-in success handler.
 */

// In your sign-in component or auth callback
async function handleSignInSuccess(clerkSession, clerkUser) {
  try {
    // Check if this is an extension authentication flow
    const urlParams = new URLSearchParams(window.location.search);
    const extSessionId = urlParams.get('ext_session');
    
    if (extSessionId) {
      console.log('Chrome extension authentication detected:', extSessionId);
      
      // Send auth data to backend
      const response = await fetch('/api/v1/ext-auth-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkSession.sessionToken || clerkSession.token}`
        },
        body: JSON.stringify({
          session_id: extSessionId,
          clerk_token: clerkSession.sessionToken || clerkSession.token,
          user_data: {
            userId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.profileImageUrl || clerkUser.imageUrl
          }
        })
      });
      
      if (response.ok) {
        // Show success message
        showNotification({
          title: 'Extension Connected!',
          message: 'You can now close this tab and return to your Chrome extension.',
          type: 'success'
        });
        
        // Optional: Auto-close after a delay
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        throw new Error('Failed to complete extension authentication');
      }
    }
    
    // Continue with normal sign-in flow
    // ...
    
  } catch (error) {
    console.error('Extension authentication error:', error);
    showNotification({
      title: 'Connection Failed',
      message: 'Failed to connect Chrome extension. Please try again.',
      type: 'error'
    });
  }
}

// Example with Clerk React hooks
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function ExtensionAuthHandler() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function handleExtensionAuth() {
      const extSessionId = searchParams.get('ext_session');
      
      if (!extSessionId || !isSignedIn || !isLoaded || !user) {
        return;
      }
      
      try {
        // Get fresh token
        const token = await getToken();
        
        // Send to backend
        const response = await fetch('/api/proxy/ext-auth-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            session_id: extSessionId,
            clerk_token: token,
            user_data: {
              userId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.profileImageUrl
            }
          })
        });
        
        if (response.ok) {
          // Success - show message
          console.log('Extension authentication completed');
        }
      } catch (error) {
        console.error('Extension auth error:', error);
      }
    }
    
    handleExtensionAuth();
  }, [isSignedIn, isLoaded, user, searchParams]);
  
  return null; // This is a non-visual component
}

// Add to your Next.js API routes (pages/api/proxy/ext-auth-complete.js or app/api/proxy/ext-auth-complete/route.js)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Forward to your backend
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/ext-auth-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization')
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to complete authentication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}