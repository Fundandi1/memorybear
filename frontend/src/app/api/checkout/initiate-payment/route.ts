import { NextRequest, NextResponse } from 'next/server';

// Get the backend API URL from environment variables with a production fallback
const BACKEND_URL = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.memorybear.dk' 
    : 'http://localhost:8000');

export async function POST(req: NextRequest) {
  try {
    // Parse the request data
    const data = await req.json();
    
    // Remove console logs in production
    // console.log('Payment initiation request:', data);
    
    // Enhanced validation
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid items array' },
        { status: 400 }
      );
    }
    
    // Validate total matches sum of items (prevent tampering)
    const calculatedTotal = data.items.reduce((sum: number, item: any) => {
      const itemPrice = parseInt(item.price, 10) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return sum + (itemPrice * quantity);
    }, 0) + (data.shippingCost || 0);
    
    // Allow small difference (1 DKK) to account for rounding issues
    if (Math.abs(calculatedTotal - data.amount) > 100) { // 100 øre = 1 DKK
      return NextResponse.json(
        { error: 'Amount validation failed: total does not match items sum' },
        { status: 400 }
      );
    }

    // Prepare the data for the MobilePay checkout endpoint
    const payloadForBackend = {
      amount: data.amount,
      reference: data.reference || `order-${Date.now()}`,
      currency: data.currency || 'DKK',
      description: data.description || 'Purchase from MemoryBear',
      customer: data.customer || {},
      items: data.items || [],
      shippingMethod: data.shippingMethod || 'home',
      shippingCost: data.shippingCost || 4900,
      returnUrl: data.returnUrl || `${req.nextUrl.origin}/checkout/complete`,
      paymentMethod: 'mobilepay'
    };

    // Remove console logs in production
    // console.log('Sending to backend:', payloadForBackend);
    // console.log('Backend URL:', `${BACKEND_URL}/mobilepay/checkout/`);

    // Forward the request to the Django backend
    const response = await fetch(`${BACKEND_URL}/mobilepay/checkout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadForBackend),
    });

    // If the backend returns an error
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Payment initiation failed' },
        { status: response.status }
      );
    }

    // Return the successful response from the backend
    const responseData = await response.json();
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error in initiate-payment API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  // Restrict CORS to specific origins
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    process.env.FRONTEND_URL || '',
    'https://memorybear.dk',
    'https://www.memorybear.dk'
  ];
  
  // Ensure we never have a null allowedOrigin
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 