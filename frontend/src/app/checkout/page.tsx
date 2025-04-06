'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Playfair_Display, Lato } from 'next/font/google';
import { useForm } from 'react-hook-form';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

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

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal } = useCart();

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('mobilepay');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const formData = watch();

  const [calculatedTotals, setCalculatedTotals] = useState({ subtotal: 0, vat: 0, shipping: 0, total: 0 });

  useEffect(() => {
    const subtotal = getCartTotal();
    const shippingCost = shippingMethod === 'home' ? 49 : 39;
    const vat = subtotal * 0.25;
    const total = subtotal + shippingCost;

    setCalculatedTotals({
      subtotal: subtotal,
      vat: parseFloat(vat.toFixed(2)),
      shipping: shippingCost,
      total: total
    });
  }, [cartItems, shippingMethod, getCartTotal]);

  const handlePayment = async (customerData: Record<string, any>) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Format customer data
      const customer = {
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        address: customerData.address || "",
        postalCode: customerData.zipCode || "",
        city: customerData.city || "",
        country: customerData.country || "Denmark",
        marketingConsent: customerData.marketingConsent || false
      };

      // Format items data with customization properties
      const items = cartItems.map(item => ({
        name: item.name,
        price: Math.round(item.price * 100), // Convert to øre
        quantity: item.quantity,
        description: item.name,
        // Add customization properties using the backend's expected field names
        fabricType: item.customization?.fabricOption || null,
        bodyFabric: item.customization?.bodyFabric || null,
        headFabric: item.customization?.headFabric || null,
        underArmsFabric: item.customization?.underArmsFabric || null,
        bellyFabric: item.customization?.bellyFabric || null,
        hasVest: item.customization?.hasVest === 'Yes',
        vestFabric: item.customization?.vestFabric || null,
        faceStyle: item.customization?.faceOption || null
      }));

      // Prepare data for the API endpoint
      const paymentData = {
        amount: Math.round(calculatedTotals.total * 100), // Total in øre
        currency: "DKK",
        description: "Purchase from MemoryBear",
        customer: customer,
        items: items,
        shippingMethod: shippingMethod,
        shippingCost: shippingMethod === 'home' ? 4900 : 3900, // Cost in øre
        returnUrl: `${window.location.origin}/checkout/complete`
      };

      // Call our API endpoint to initiate payment
      const response = await fetch('/api/checkout/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initiation failed');
      }

      const result = await response.json();

      // If there's a redirect URL for MobilePay, redirect the user
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error('No redirect URL received from payment provider');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during payment.');
      setIsProcessing(false);
    }
  };

  const handleStepSubmit = (data: Record<string, any>) => {
    if (checkoutStep < 4) {
      setCheckoutStep(checkoutStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Final step - initiate payment
      if (paymentMethod === 'mobilepay') {
        handlePayment(data); // Pass collected form data to payment handler
      } else {
        // Handle other payment methods if needed
        setError('Selected payment method not implemented yet.');
      }
    }
  };
  
  const goBack = () => {
    if (checkoutStep > 1) {
      setCheckoutStep(checkoutStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  return (
    <main className={`${playfair.variable} ${lato.variable} font-sans min-h-screen bg-neutral-50 py-12 relative`}>
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md text-center">
            <svg className="animate-spin h-10 w-10 text-rose-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-serif font-medium mb-2">Behandler din betaling</h3>
            <p className="text-gray-600">Vent venligst mens vi behandler din ordre...</p>
          </div>
        </div>
      )}
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
          {/* Left Column - Form steps */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <form onSubmit={handleSubmit(handleStepSubmit)}>
                {/* Step 1: Review cart */}
                {checkoutStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Gennemse din ordre</h2>
                    
                    {cartItems.length === 0 ? (
                       <p className="text-gray-600">Your cart is empty.</p>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.id} className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-gray-200">
                          {/* Optional: Add image placeholder if needed */}
                          {/* <div className="w-full md:w-1/4 aspect-square relative rounded-md overflow-hidden bg-gray-100"> */}
                          {/*   <span className="text-gray-400">No Image</span> */}
                          {/* </div> */}
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-serif text-gray-800">{item.name}</h3>
                              <span className="font-medium text-gray-800">{item.price} DKK</span>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">Quantity: {item.quantity}</p>
                            
                            {item.customization && (
                                <div className="mt-4 space-y-2 text-sm">
                                    <h4 className="font-medium text-gray-700">Customization:</h4>
                                    {Object.entries(item.customization).map(([key, value]) => (
                                        value && value !== 'N/A' && (
                                            <div key={key} className="flex">
                                                <span className="font-medium w-1/3 text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                                <span className="text-gray-600">{value}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
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
                            <span className="font-medium">{calculatedTotals.subtotal} DKK</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Moms (25%):</span>
                            <span className="font-medium">{calculatedTotals.vat} DKK</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Levering:</span>
                            <span className="font-medium">{shippingMethod === 'home' ? '49' : '39'} DKK</span>
                          </div>
                          <div className="flex justify-between font-medium mt-2 pt-2 border-t border-gray-200">
                            <span>Total:</span>
                            <span className="text-lg">{calculatedTotals.total + (shippingMethod === 'home' ? 0 : -10)} DKK</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Form navigation buttons */}
                <div className="mt-8 flex justify-between">
                  {checkoutStep > 1 ? (
                    <button 
                      type="button" 
                      onClick={goBack}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Tilbage
                    </button>
                  ) : (
                    <div></div>
                  )}
                  
                  <button 
                    type="submit" 
                    className={`px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center justify-center ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={isProcessing}
                  >
                    {isProcessing && checkoutStep === 4 ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Behandler...
                      </>
                    ) : (
                      checkoutStep < 4 ? 'Fortsæt' : 'Gennemfør betaling'
                    )}
                  </button>
                </div>
                
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
                          {errors.firstName && <p className="text-red-600 text-sm mt-1">{String(errors.firstName.message)}</p>}
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-gray-700 mb-1">Efternavn *</label>
                          <input
                            id="lastName"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("lastName", { required: "Efternavn er påkrævet" })}
                          />
                          {errors.lastName && <p className="text-red-600 text-sm mt-1">{String(errors.lastName.message)}</p>}
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
                        {errors.email && <p className="text-red-600 text-sm mt-1">{String(errors.email.message)}</p>}
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
                        {errors.phone && <p className="text-red-600 text-sm mt-1">{String(errors.phone.message)}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="block text-gray-700 mb-1">Adresse *</label>
                        <input
                          id="address"
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                          {...register("address", { required: "Adresse er påkrævet" })}
                        />
                        {errors.address && <p className="text-red-600 text-sm mt-1">{String(errors.address.message)}</p>}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label htmlFor="zipCode" className="block text-gray-700 mb-1">Postnummer *</label>
                          <input
                            id="zipCode"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("zipCode", {
                              required: "Postnummer er påkrævet",
                              pattern: {
                                value: /^[0-9]{4}$/,
                                message: "Indtast et gyldigt dansk postnummer (4 cifre)"
                              }
                            })}
                          />
                          {errors.zipCode && <p className="text-red-600 text-sm mt-1">{String(errors.zipCode.message)}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="city" className="block text-gray-700 mb-1">By *</label>
                          <input
                            id="city"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                            {...register("city", { required: "By er påkrævet" })}
                          />
                          {errors.city && <p className="text-red-600 text-sm mt-1">{String(errors.city.message)}</p>}
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
                            {...register("marketingConsent")}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Ja tak, jeg vil gerne modtage nyhedsbreve og tilbud fra MemoryBear. Læs vores <a href="/privacy" className="text-rose-600 underline">persondatapolitik</a>.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Shipping Method */}
                {checkoutStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Leveringsmetode</h2>
                    
                    <div className="space-y-4">
                      <div 
                        className={`border rounded-md p-4 cursor-pointer ${shippingMethod === 'home' ? 'border-rose-600 bg-rose-50' : 'border-gray-200'}`}
                        onClick={() => setShippingMethod('home')}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${shippingMethod === 'home' ? 'border-rose-600' : 'border-gray-400'}`}>
                            {shippingMethod === 'home' && <div className="w-3 h-3 rounded-full bg-rose-600"></div>}
                          </div>
                          <div className="ml-3">
                            <span className="font-medium">Hjemmelevering</span>
                            <span className="ml-2 text-gray-600">— 49 DKK</span>
                          </div>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-gray-600">
                          Levering med PostNord til din adresse, 1-3 hverdage
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-md p-4 cursor-pointer ${shippingMethod === 'pickup' ? 'border-rose-600 bg-rose-50' : 'border-gray-200'}`}
                        onClick={() => setShippingMethod('pickup')}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${shippingMethod === 'pickup' ? 'border-rose-600' : 'border-gray-400'}`}>
                            {shippingMethod === 'pickup' && <div className="w-3 h-3 rounded-full bg-rose-600"></div>}
                          </div>
                          <div className="ml-3">
                            <span className="font-medium">Pakkeshop</span>
                            <span className="ml-2 text-gray-600">— 39 DKK</span>
                          </div>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-gray-600">
                          Levering til PostNord eller GLS pakkeshop, 1-3 hverdage
                        </div>
                        
                        {shippingMethod === 'pickup' && (
                          <div className="mt-3 pl-8">
                            <label htmlFor="pickupPoint" className="block text-gray-700 mb-1 text-sm">Vælg pakkeshop *</label>
                            <select
                              id="pickupPoint"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                              {...register("pickupPoint", { required: shippingMethod === 'pickup' })}
                            >
                              <option value="">Vælg pakkeshop</option>
                              <option value="1">PostNord - Brugsen, Hovedgaden 12</option>
                              <option value="2">PostNord - Netto, Storegade 45</option>
                              <option value="3">GLS - Shell, Vesterbrogade 68</option>
                              <option value="4">GLS - 7-Eleven, Østergade 21</option>
                            </select>
                            {errors.pickupPoint && <p className="text-red-600 text-sm mt-1">Vælg venligst en pakkeshop</p>}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-6">
                        <p className="flex items-start text-sm text-blue-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Din MemoryBear er et speciallavet produkt. Forventet produktion og levering: 2-3 uger plus leveringstid.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Payment */}
                {checkoutStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Betaling</h2>
                    
                    <div className="space-y-4">
                      <div 
                        className={`border rounded-md p-4 cursor-pointer ${paymentMethod === 'mobilepay' ? 'border-rose-600 bg-rose-50' : 'border-gray-200'}`}
                        onClick={() => setPaymentMethod('mobilepay')}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'mobilepay' ? 'border-rose-600' : 'border-gray-400'}`}>
                            {paymentMethod === 'mobilepay' && <div className="w-3 h-3 rounded-full bg-rose-600"></div>}
                          </div>
                          <div className="ml-3 flex items-center">
                            <span className="font-medium">MobilePay</span>
                            <div className="ml-2 h-6 w-6 bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-gray-600">
                          Betal nemt og hurtigt med MobilePay
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-md p-4 cursor-pointer ${paymentMethod === 'card' ? 'border-rose-600 bg-rose-50' : 'border-gray-200'}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-rose-600' : 'border-gray-400'}`}>
                            {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-rose-600"></div>}
                          </div>
                          <div className="ml-3 flex items-center">
                            <span className="font-medium">Kreditkort</span>
                            <div className="ml-3 flex space-x-1">
                              <div className="h-6 w-10 bg-gray-200 rounded"></div>
                              <div className="h-6 w-10 bg-gray-200 rounded"></div>
                              <div className="h-6 w-10 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-gray-600">
                          Alle korttyper accepteres. Sikker betaling via Nets.
                        </div>
                        
                        {paymentMethod === 'card' && (
                          <div className="mt-4 pl-8 space-y-4">
                            <div>
                              <label htmlFor="cardNumber" className="block text-gray-700 mb-1 text-sm">Kortnummer *</label>
                              <input
                                id="cardNumber"
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                                {...register("cardNumber", { 
                                  required: paymentMethod === 'card',
                                  pattern: {
                                    value: /^[0-9]{16}$/,
                                    message: "Indtast et gyldigt kortnummer"
                                  }
                                })}
                              />
                              {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{String(errors.cardNumber.message)}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="expiryDate" className="block text-gray-700 mb-1 text-sm">Udløbsdato *</label>
                                <input
                                  id="expiryDate"
                                  type="text"
                                  placeholder="MM/ÅÅ"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                                  {...register("expiryDate", { 
                                    required: paymentMethod === 'card',
                                    pattern: {
                                      value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                                      message: "Indtast en gyldig udløbsdato"
                                    }
                                  })}
                                />
                                {errors.expiryDate && <p className="text-red-600 text-sm mt-1">{String(errors.expiryDate.message)}</p>}
                              </div>
                              
                              <div>
                                <label htmlFor="cvv" className="block text-gray-700 mb-1 text-sm">CVV *</label>
                                <input
                                  id="cvv"
                                  type="text"
                                  placeholder="CVV"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                                  {...register("cvv", { 
                                    required: paymentMethod === 'card',
                                    pattern: {
                                      value: /^[0-9]{3}$/,
                                      message: "Indtast en gyldig CVV"
                                    }
                                  })}
                                />
                                {errors.cvv && <p className="text-red-600 text-sm mt-1">{String(errors.cvv.message)}</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 5: Review and Confirm */}
                {checkoutStep === 5 && (
                  <div>
                    <h2 className="text-2xl font-serif text-gray-800 mb-6">Gennemse og bekræfte</h2>
                    
                    <div className="space-y-4">
                      <div className="bg-rose-50 p-4 rounded-md border border-rose-100">
                        <h3 className="font-serif text-lg text-gray-800 mb-2">Ordreoversigt</h3>    
                        <div className="space-y-2">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600 truncate pr-2" title={item.name}>{item.name} (x{item.quantity})</span>
                              <span className="text-gray-600 flex-shrink-0">{item.price * item.quantity} DKK</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Order Summary (Corrected) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h3 className="font-serif text-lg text-gray-800 mb-4">Ordreoversigt</h3>
              {/* Items Loop */}
              <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
                {cartItems.length === 0 ? (
                  <p className="text-sm text-gray-500">Din indkøbskurv er tom.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate pr-2" title={item.name}>{item.name} (x{item.quantity})</span>
                      <span className="text-gray-600 flex-shrink-0">{item.price * item.quantity} DKK</span>
                    </div>
                  ))
                )}
              </div>
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-600">{calculatedTotals.subtotal} DKK</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Moms (25%)</span>
                  <span className="text-gray-600">{calculatedTotals.vat} DKK</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Levering</span>
                  <span className="text-gray-600">{calculatedTotals.shipping} DKK</span>
                </div>
                <div className="flex justify-between text-lg font-medium mt-2 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{calculatedTotals.total} DKK</span>
                </div>
              </div>
            </div>
          </div>
          {/* End of Right Column */}

        </div> {/* End of Main Grid */}
      </div> {/* End of Container */}
    </main>
  );
}
