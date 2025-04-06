import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Log the received data
    console.log('Checkout request data:', data);
    
    // Validate required fields
    const requiredFields = ['amount', 'currency', 'country', 'customer_info', 'shipping_method', 'shipping_cost'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate a mock token
    const mockToken = `test_token_${Date.now()}`;
    
    // Return a mock response
    return NextResponse.json({
      token: mockToken,
      reference: `order_${Date.now()}`,
      status: 'SUCCESS'
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error handling checkout request:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout request' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
