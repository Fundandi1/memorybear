import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const reference = params.reference;
    
    // Log the reference
    console.log('Payment status request for reference:', reference);
    
    // Return a mock response
    return NextResponse.json({
      reference: reference,
      state: 'AUTHORIZED',
      paymentMethod: 'VIPPS',
      amount: {
        value: 100000,
        currency: 'NOK'
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error handling payment status request:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}