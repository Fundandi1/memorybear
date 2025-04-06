'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Playfair_Display, Lato } from 'next/font/google';
import { useForm } from 'react-hook-form';

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

// Mock order data (this would come from your previous page or context)
const mockOrderData = {
  items: [
    {
      id: 1,
      name: "MemoryBear",
      fabricType: "2 types of fabric",
      fabricDetails: {
        body: "Blue flannel shirt",
        head: "White cotton blouse",
        underArms: "",
        belly: ""
      },
      hasVest: true,
      vestFabric: "Red checkered fabric",
      faceStyle: "Classic smile",
      price: 599,
      image: "/images/fernanda-greppe-sxXxhuLdnuo-unsplash.jpg"
    }
  ],
  vestPrice: 250,
  subtotal: 849,
  vat: 212.25, // 25% VAT
  shipping: 49,
  total: 898
};

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
}

interface CheckoutFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  cardNumber?: string;
  // Add other form fields as needed
}

export default function CheckoutPage() {
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('mobilepay');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [mobilePaySession, setMobilePaySession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: ''
  });
  
  const { register, handleSubmit, formState: { errors }, getValues } = useForm();
  
  const handleStepSubmit = (data: CheckoutFormData) => {
    console.log("Form data:", data);
    
    // Save customer data if we're on step 2
    if (checkoutStep === 2) {
      setCustomerData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        postalCode: data.postalCode || '',
        city: data.city || ''
      });
    }
    
    // If payment step and MobilePay selected, create payment session
    if (checkoutStep === 4 && paymentMethod === 'mobilepay') {
      handleMobilePayPayment();
      return;
    }
    
    // Move to next step
    if (checkoutStep < 4) {
      setCheckoutStep(checkoutStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Submit order
      console.log("Order submitted!");
      // Here you would typically call your API to process the order
    }
  };
  
  const handleMobilePayPayment = async () => {
    try {
      setIsLoading(true);
      
      // Calculate total in øre (as required by Vipps/MobilePay)
      const totalInOre = Math.round(mockOrderData.total * 100);
      
      // Create a checkout session with your backend
      const response = await fetch('/api/checkout/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalInOre,
          currency: 'DKK',
          description: 'Purchase from Mindebamsen',
          return_url: window.location.origin + '/checkout/complete',
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.error('Error creating checkout session:', result.error);
        setIsLoading(false);
        return;
      }
      
      // Store the session data
      setMobilePaySession(result);
      
      // Redirect to MobilePay payment page
      if (result.checkoutFrontendUrl) {
        window.location.href = result.checkoutFrontendUrl;
      } else {
        console.error('No checkout URL returned from API');
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Error initiating MobilePay payment:', error);
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    if (checkoutStep > 1) {
      setCheckoutStep(checkoutStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Simplified MobilePay checkout Component
  const MobilePayButton = () => (
    <button 
      type="button"
      className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md mt-4"
      onClick={handleMobilePayPayment}
      disabled={isLoading}
    >
      {isLoading ? 'Indlæser...' : 'Betal med MobilePay'}
    </button>
  );
  
  return (
    <main className={`${playfair.variable} ${lato.variable} font-sans min-h-screen bg-neutral-50 py-12`}>
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mb-8 text-center">Checkout</h1>
        
        {/* Checkout progress bar */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex justify-between">
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${checkoutStep >= 1 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <div className={`text-sm mt-1 ${checkoutStep >= 1 ? 'text-gray-800' : 'text-gray-500'}`}>Gennemse</div>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${checkoutStep >= 2 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <div className={`text-sm mt-1 ${checkoutStep >= 2 ? 'text-gray-800' : 'text-gray-500'}`}>Information</div>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${checkoutStep >= 3 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                3
              </div>
              <div className={`text-sm mt-1 ${checkoutStep >= 3 ? 'text-gray-800' : 'text-gray-500'}`}>Levering</div>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${checkoutStep >= 4 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                4
              </div>
              <div className={`text-sm mt-1 ${checkoutStep >= 4 ? 'text-gray-800' : 'text-gray-500'}`}>Betaling</div>
            </div>
          </div>
          
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
            <div 
              className="absolute top-0 left-0 h-1 bg-rose-600 transition-all duration-300" 
              style={{ width: `${(checkoutStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        </div>
          {/* Left Column - Form steps */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <form onSubmit={handleSubmit(handleStepSubmit)}>
                {/* Step 1: Review cart */}
                {checkoutStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Gennemse din ordre</h2>
                    
                    {mockOrderData.items.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-gray-200">
                        <div className="w-full md:w-1/4 aspect-square relative rounded-md overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-serif text-gray-800">{item.name}</h3>
                            <span className="font-medium text-gray-800">{item.price} DKK</span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{item.fabricType}</p>
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex">
                              <span className="font-medium w-1/3 text-gray-700">Krop:</span>
                              <span className="text-gray-600">{item.fabricDetails.body}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium w-1/3 text-gray-700">Hoved:</span>
                              <span className="text-gray-600">{item.fabricDetails.head}</span>
                            </div>
                            {item.fabricDetails.underArms && (
                              <div className="flex">
                                <span className="font-medium w-1/3 text-gray-700">Underarme:</span>
                                <span className="text-gray-600">{item.fabricDetails.underArms}</span>
                              </div>
                            )}
                            {item.fabricDetails.belly && (
                              <div className="flex">
                                <span className="font-medium w-1/3 text-gray-700">Maven:</span>
                                <span className="text-gray-600">{item.fabricDetails.belly}</span>
                              </div>
                            )}
                            {item.hasVest && (
                              <div className="flex">
                                <span className="font-medium w-1/3 text-gray-700">Vest:</span>
                                <span className="text-gray-600">{item.vestFabric}</span>
                              </div>
                            )}
                            <div className="flex">
                              <span className="font-medium w-1/3 text-gray-700">Ansigt:</span>
                              <span className="text-gray-600">{item.faceStyle}</span>
                            </div>
                          </div>
                          
                          {item.hasVest && (
                            <div className="mt-3 text-sm text-gray-500">
                              + Vest tilvalg: 250 DKK
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 text-sm space-y-4">
                      <div className="bg-rose-50 p-4 rounded-md border border-rose-100">
                        <p className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Din MemoryBear bliver håndlavet med dine valgte stoffer. Produktionstiden er ca. 2-3 uger, hvorefter den sendes til dig med den valgte leveringsmetode.</span>
                        </p>
                      </div>
                      
                      <p className="text-gray-600">
                        Ved at fortsætte accepterer du vores <a href="/vilkår" className="text-rose-600 underline">handelsbetingelser</a> og <a href="/privacy" className="text-rose-600 underline">persondatapolitik</a>.
                      </p>
                      
                      {/* Order summary for payment step */}
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Din ordre</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{mockOrderData.subtotal} DKK</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Moms (25%):</span>
                            <span className="font-medium">{mockOrderData.vat} DKK</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Levering:</span>
                            <span className="font-medium">{shippingMethod === 'home' ? '49' : '39'} DKK</span>
                          </div>
                          <div className="flex justify-between font-medium mt-2 pt-2 border-t border-gray-200">
                            <span>Total:</span>
                            <span className="text-lg">{mockOrderData.total + (shippingMethod === 'home' ? 0 : -10)} DKK</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Customer Information */}
                {checkoutStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Dine oplysninger</h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-gray-700 mb-1">Fornavn *</label>
                          <input
                            id="firstName"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("firstName", { required: "Fornavn er påkrævet" })}
                          />
                          {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName.message?.toString()}</p>}
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-gray-700 mb-1">Efternavn *</label>
                          <input
                            id="lastName"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("lastName", { required: "Efternavn er påkrævet" })}
                          />
                          {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName.message?.toString()}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-gray-700 mb-1">Email *</label>
                        <input
                          id="email"
                          type="email"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                          {...register("email", { 
                            required: "Email er påkrævet",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Ugyldig email"
                            }
                          })}
                        />
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message?.toString()}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-gray-700 mb-1">Telefon *</label>
                        <input
                          id="phone"
                          type="tel"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                          {...register("phone", { 
                            required: "Telefonnummer er påkrævet",
                            pattern: {
                              value: /^[0-9]{8}$/,
                              message: "Indtast et gyldigt dansk telefonnummer (8 cifre)"
                            }
                          })}
                        />
                        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message?.toString()}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="block text-gray-700 mb-1">Adresse *</label>
                        <input
                          id="address"
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                          {...register("address", { required: "Adresse er påkrævet" })}
                        />
                        {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message?.toString()}</p>}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label htmlFor="postalCode" className="block text-gray-700 mb-1">Postnummer *</label>
                          <input
                            id="postalCode"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("postalCode", { 
                              required: "Postnummer er påkrævet",
                              pattern: {
                                value: /^[0-9]{4}$/,
                                message: "Indtast et gyldigt dansk postnummer (4 cifre)"
                              }
                            })}
                          />
                          {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode.message?.toString()}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="city" className="block text-gray-700 mb-1">By *</label>
                          <input
                            id="city"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("city", { required: "By er påkrævet" })}
                          />
                          {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message?.toString()}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="comments" className="block text-gray-700 mb-1">Kommentarer til ordren (valgfrit)</label>
                        <textarea
                          id="comments"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                          {...register("comments")}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            className="mt-1"
                            onChange={(e) => setMarketingConsent(e.target.checked)}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Ja tak, jeg vil gerne modtage nyhedsbreve og tilbud fra Mindebamsen. Læs vores <a href="/privacy" className="text-rose-600 underline">persondatapolitik</a>.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Shipping Method */}
                {checkoutStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Vælg leveringsmetode</h2>
                    
                    <div className="space-y-4">
                      <label className="block p-4 border border-gray-200 rounded-md hover:border-rose-300 cursor-pointer transition-colors">
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="shipping"
                            value="home"
                            className="mt-1"
                            checked={shippingMethod === 'home'}
                            onChange={() => setShippingMethod('home')}
                          />
                          <div className="ml-3">
                            <div className="font-medium">Levering til din adresse - 49 DKK</div>
                            <p className="text-sm text-gray-600 mt-1">
                              Vi sender din MemoryBear direkte til din adresse med PostNord. Forventet leveringstid: 1-2 hverdage efter produktion.
                            </p>
                          </div>
                        </div>
                      </label>
                      
                      <label className="block p-4 border border-gray-200 rounded-md hover:border-rose-300 cursor-pointer transition-colors">
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="shipping"
                            value="pickup"
                            className="mt-1"
                            checked={shippingMethod === 'pickup'}
                            onChange={() => setShippingMethod('pickup')}
                          />
                          <div className="ml-3">
                            <div className="font-medium">Afhentning i pakkeshop - 39 DKK</div>
                            <p className="text-sm text-gray-600 mt-1">
                              Vi sender din MemoryBear til din nærmeste pakkeshop. Forventet leveringstid: 1-3 hverdage efter produktion.
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-6">
                      <p className="flex items-start text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Bemærk: Leveringstider er vejledende og kan variere. Du modtager en bekræftelsesmail med tracking-information, når din MemoryBear er afsendt.</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Payment */}
                {checkoutStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Betaling</h2>
                    
                    <div className="space-y-4">
                      <label className="block p-4 border border-gray-200 rounded-md hover:border-rose-300 cursor-pointer transition-colors">
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="payment"
                            value="mobilepay"
                            className="mt-1"
                            checked={paymentMethod === 'mobilepay'}
                            onChange={() => setPaymentMethod('mobilepay')}
                          />
                          <div className="ml-3">
                            <div className="font-medium">MobilePay</div>
                            <p className="text-sm text-gray-600 mt-1">
                              Betal nemt og sikkert med MobilePay. Du vil blive omdirigeret til MobilePay's betalingsside.
                            </p>
                          </div>
                        </div>
                      </label>
                      
                      <label className="block p-4 border border-gray-200 rounded-md hover:border-rose-300 cursor-pointer transition-colors">
                        <div className="flex items-start">
                          <input
                            type="radio"
                            name="payment"
                            value="card"
                            className="mt-1"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                          />
                          <div className="ml-3">
                            <div className="font-medium">Betalingskort</div>
                            <p className="text-sm text-gray-600 mt-1">
                              Vi accepterer Visa, Mastercard, og Dankort. Din betaling bliver behandlet sikkert via vores betalingsudbyder.
                            </p>
                          </div>
                        </div>
                      </label>
                      
                      {paymentMethod === 'mobilepay' && <MobilePayButton />}
                      
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mt-6">
                        <p className="flex items-start text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Din betaling bliver håndteret sikkert. Vi gemmer ikke dine betalingsoplysninger.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  {checkoutStep > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Tilbage
                    </button>
                  ) : (
                    <div></div> // Empty div to maintain spacing
                  )}
                  
                  <button
                    type="submit"
                    className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Indlæser...' : checkoutStep === 4 && paymentMethod !== 'mobilepay' ? 'Betal med kort' : checkoutStep === 4 ? 'Betal nu' : 'Fortsæt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Ordreoversigt</h3>
              
              {mockOrderData.items.map((item) => (
                <div key={item.id} className="flex items-start py-3 border-b border-gray-100">
                  <div className="w-12 h-12 relative rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <span className="text-gray-700 text-sm">{item.price} DKK</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.fabricType}</p>
                  </div>
                </div>
              ))}
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{mockOrderData.subtotal} DKK</span>
                </div>
                
                {mockOrderData.items.some(item => item.hasVest) && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Inkl. vest tilvalg:</span>
                    <span>{mockOrderData.vestPrice} DKK</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Moms (25%):</span>
                  <span>{mockOrderData.vat} DKK</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Levering:</span>
                  <span>{shippingMethod === 'home' ? '49' : '39'} DKK</span>
                </div>
                
                <div className="flex justify-between font-medium text-gray-800 pt-2 mt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-lg">{mockOrderData.total + (shippingMethod === 'home' ? 0 : -10)} DKK</span>
                </div>
              </div>
              
              {checkoutStep > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bestillingsdetaljer</h4>
                  
                  {checkoutStep >= 2 && customerData.firstName && (
                    <div className="text-sm mb-2">
                      <p className="text-gray-800">{customerData.firstName} {customerData.lastName}</p>
                      <p className="text-gray-600">{customerData.email}</p>
                      <p className="text-gray-600">{customerData.phone}</p>
                    </div>
                  )}
                  
                  {checkoutStep >= 2 && customerData.address && (
                    <div className="text-sm">
                      <p className="text-gray-600">{customerData.address}</p>
                      <p className="text-gray-600">{customerData.postalCode} {customerData.city}</p>
                    </div>
                  )}
                  
                  {checkoutStep >= 3 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Levering: </span>
                        {shippingMethod === 'home' ? 'Til din adresse' : 'Afhentning i pakkeshop'}
                      </p>
                    </div>
                  )}
                  
                  {checkoutStep >= 4 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Betaling: </span>
                        {paymentMethod === 'mobilepay' ? 'MobilePay' : 'Betalingskort'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </main>
  );
}
