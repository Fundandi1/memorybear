'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Get the backend API URL from environment variables with a production fallback
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.memorybear.dk' 
    : 'http://localhost:8000');

export default function CheckoutCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [orderReference, setOrderReference] = useState<string | null>(null);

  useEffect(() => {
    // Get the reference from the URL, which was passed when redirecting from MobilePay
    const reference = searchParams.get('reference');
    
    if (reference) {
      setOrderReference(reference);
      
      // Check payment status with the backend
      const checkPaymentStatus = async () => {
        try {
          // Call the backend endpoint to check payment status
          const response = await fetch(`${BACKEND_API_URL}/epayment/status/${reference}/`);
          
          if (!response.ok) {
            // If the API call itself fails, show a generic error
            setStatus('error');
            console.error(`Failed to fetch payment status: ${response.status}`);
            return; 
          }
          
          const data = await response.json();
          console.log('Payment status response:', data);
          
          // Check if the API reported success and returned payment details
          if (data.success && data.payment) {
            const paymentState = data.payment.state?.toUpperCase();
            
            // Check for successful states
            if (paymentState === 'AUTHORIZED' || paymentState === 'CAPTURED') {
              // If payment is authorized but not captured, try to auto-capture it
              if (paymentState === 'AUTHORIZED') {
                try {
                  // Attempt to capture the payment
                  const captureResponse = await fetch(`${BACKEND_API_URL}/payments/${reference}/capture/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      // Ensure amount is correctly extracted (handle potential variations)
                      amount: data.payment.summary?.authorizedAmount?.value || data.payment.amount?.value || data.payment.amount,
                      description: 'Auto-captured from checkout complete page'
                    })
                  });
                  
                  if (captureResponse.ok) {
                    console.log('Successfully auto-captured payment');
                  } else {
                    // Better fallback handling for failed capture
                    const errorData = await captureResponse.json();
                    console.warn('Auto-capture failed:', errorData);
                    
                    // Create a record of the failed capture for admin follow-up
                    await fetch(`${BACKEND_API_URL}/failed-captures/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        reference,
                        amount: data.payment.summary?.authorizedAmount?.value || data.payment.amount?.value || data.payment.amount,
                        error: errorData
                      })
                    }).catch(e => console.error('Failed to record capture failure:', e));
                    
                    // Still proceed with success for the user as the payment is authorized
                    // Admin will need to manually capture
                  }
                } catch (captureError) {
                  console.error('Error during auto-capture:', captureError);
                  // Record the error but still proceed as the payment is authorized
                }
              }
              // Set status to success only if AUTHORIZED or CAPTURED
              setStatus('success');
            } else if (paymentState === 'ABORTED') {
              // Set status specifically to 'cancelled' for the UI
              setStatus('cancelled'); 
            } else if (paymentState === 'FAILED' || paymentState === 'TERMINATED') {
              // Set status to error for other failure states
              setStatus('error');
            } else {
              // Handle other unexpected states as generic errors
              console.warn(`Unexpected payment state: ${paymentState}`);
              setStatus('error'); 
            }
          } else {
            // If the API response indicates failure or missing payment data, show generic error
            console.error("Payment status check failed or payment data missing:", data.error);
            setStatus('error');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // If there's an exception during the fetch/processing, show generic error
          setStatus('error');
        }
      };
      
      checkPaymentStatus();
    } else {
      // If no reference is found in the URL, show generic error
      console.error("No payment reference found in URL");
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8">
          {status === 'loading' && (
            <div className="text-center">
              <h1 className="text-2xl font-serif font-medium text-gray-800 mb-4">
                Behandler din ordre...
              </h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600 mx-auto"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-serif font-medium text-gray-800 mb-4">
                Tak for din bestilling!
              </h1>
              
              <p className="text-gray-600 mb-6">
                Din ordre er blevet bekræftet. Vi har sendt en bekræftelsesmail til dig.
                {orderReference && (
                  <span className="block mt-2">
                    Ordrebekræftelse: <span className="font-medium">{orderReference}</span>
                  </span>
                )}
              </p>
              
              <div className="bg-rose-50 border border-rose-100 rounded-md p-4 mb-6 text-left">
                <h2 className="font-medium text-gray-800 mb-2">Næste skridt:</h2>
                <p className="text-gray-600 text-sm">
                  Din MemoryBear er nu i produktion. Dette tager ca. 2-3 uger, hvorefter den sendes til dig med den valgte leveringsmetode.
                </p>
              </div>
              
              <Link href="/">
                <button className="bg-rose-600 hover:bg-rose-700 text-white font-normal py-2 px-6 rounded transition-colors duration-200">
                  Tilbage til forsiden
                </button>
              </Link>
            </div>
          )}

          {status === 'cancelled' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif font-medium text-gray-800 mb-4">
                Betaling annulleret
              </h1>
              <p className="text-gray-600 mb-6">
                Du har annulleret betalingsprocessen. Din ordre er ikke blevet gennemført.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/checkout">
                  <button className="bg-rose-600 hover:bg-rose-700 text-white font-normal py-2 px-6 rounded transition-colors duration-200">
                    Prøv igen
                  </button>
                </Link>
                <Link href="/">
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-normal py-2 px-6 rounded transition-colors duration-200">
                    Tilbage til forsiden
                  </button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-serif font-medium text-gray-800 mb-4">
                Der opstod en fejl
              </h1>
              
              <p className="text-gray-600 mb-6">
                Vi kunne ikke bekræfte din betaling. Kontakt venligst kundeservice for assistance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/checkout">
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-normal py-2 px-6 rounded transition-colors duration-200">
                    Prøv igen
                  </button>
                </Link>
                
                <Link href="/">
                  <button className="bg-rose-600 hover:bg-rose-700 text-white font-normal py-2 px-6 rounded transition-colors duration-200">
                    Tilbage til forsiden
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 