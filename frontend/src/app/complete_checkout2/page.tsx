'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Playfair_Display, Lato } from 'next/font/google';
import { useSearchParams } from 'next/navigation';

// Initialize fonts
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
});

// Define TypeScript types
type OrderStatus = 'loading' | 'success' | 'failed' | 'pending' | 'error';
interface OrderResponse {
  sessionState: 'SessionCompleted' | 'SessionFailed' | 'SessionCancelled' | string;
  reference?: string;
}

export default function CheckoutCompletePage() {
  const searchParams = useSearchParams();
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('loading');
  const [orderReference, setOrderReference] = useState<string>('');
  
  useEffect(() => {
    const reference = searchParams.get('reference');
    const status = searchParams.get('status') as OrderStatus || 'success'; // Default to success if not specified
    
    if (reference) {
      setOrderReference(reference);
      
      // Check the order status with the backend
      const checkOrderStatus = async () => {
        try {
          const response = await fetch(`/api/checkout/session/${reference}/`);
          
          // Check if response is OK before parsing JSON
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          const data: OrderResponse = await response.json();
          
          // Update status based on the response
          if (data.sessionState === 'SessionCompleted') {
            setOrderStatus('success');
          } else if (data.sessionState === 'SessionFailed' || data.sessionState === 'SessionCancelled') {
            setOrderStatus('failed');
          } else {
            setOrderStatus('pending');
          }
        } catch (error) {
          console.error('Error checking order status:', error);
          setOrderStatus('error');
        }
      };
      
      checkOrderStatus();
    } else {
      // No reference parameter, set status based on URL parameter or default
      setOrderStatus(status);
    }
  }, [searchParams]);
  
  return (
    <main className={`${playfair.variable} ${lato.variable} min-h-screen bg-neutral-50 py-12`}>
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {orderStatus === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <svg className="animate-spin h-12 w-12 text-rose-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-serif font-playfair text-gray-800 mb-4">Bekræfter din ordre...</h1>
              <p className="text-gray-600 mb-8">Vent venligst mens vi behandler din betaling.</p>
            </>
          )}
          
          {orderStatus === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-serif font-playfair text-gray-800 mb-4">Tak for din bestilling!</h1>
              <p className="text-gray-600 mb-4">Vi har modtaget din bestilling og din betaling er blevet gennemført.</p>
              {orderReference && (
                <p className="text-gray-600 mb-6">Din ordreference: <span className="font-medium">{orderReference}</span></p>
              )}
              <p className="text-gray-600 mb-8">Du vil modtage en bekræftelses-e-mail med detaljer om din ordre.</p>
              <div className="text-center">
                <Link href="/" className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 inline-block">
                  Tilbage til forsiden
                </Link>
              </div>
            </>
          )}
          
          {orderStatus === 'failed' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-serif font-playfair text-gray-800 mb-4">Der opstod en fejl</h1>
              <p className="text-gray-600 mb-6">Din betaling kunne ikke gennemføres. Prøv venligst igen eller kontakt vores kundeservice.</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/checkout" className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 inline-block">
                  Prøv igen
                </Link>
                <Link href="/kontakt" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 inline-block">
                  Kontakt support
                </Link>
              </div>
            </>
          )}
          
          {orderStatus === 'pending' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-serif font-playfair text-gray-800 mb-4">Afventer bekræftelse</h1>
              <p className="text-gray-600 mb-6">Din betaling er ved at blive behandlet. Vi sender en e-mail, når betalingen er gennemført.</p>
              <div className="text-center">
                <Link href="/" className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 inline-block">
                  Tilbage til forsiden
                </Link>
              </div>
            </>
          )}
          
          {orderStatus === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-serif font-playfair text-gray-800 mb-4">Noget gik galt</h1>
              <p className="text-gray-600 mb-6">Vi kunne ikke bekræfte status på din ordre. Kontakt venligst vores kundeservice for hjælp.</p>
              <div className="text-center">
                <Link href="/kontakt" className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 inline-block">
                  Kontakt support
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}