'use client';

import React, { useState } from 'react';
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

export default function CheckoutPage() {
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('mobilepay');
  const [marketingConsent, setMarketingConsent] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const handleStepSubmit = (data: Record<string, any>) => {
    console.log("Form data:", data);
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
  
  const goBack = () => {
    if (checkoutStep > 1) {
      setCheckoutStep(checkoutStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
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
                    className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                  >
                    {checkoutStep < 4 ? 'Fortsæt' : 'Gennemfør betaling'}
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
                                  {...register("expiryDate", { required: paymentMethod === 'card' })}
                                />
                                {errors.expiryDate && <p className="text-red-600 text-sm mt-1">{String(errors.expiryDate.message)}</p>}
                          /{'>'}
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
                          {errors.postalCode && <p className="text-red-600 text-sm mt-1">{String(errors.postalCode.message)}</p>}
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
                            onChange={(e) => setMarketingConsent(e.target.checked)}
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
                          {mockOrderData.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-gray-600">{item.price}DKK</span>
                            </div>
                          ))}
                          {mockOrderData.vestPrice > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Vest</span>
                              <span className="text-gray-600">{mockOrderData.vestPrice}DKK</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-600">{mockOrderData.subtotal}DKK</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Moms</span>
                            <span className="text-gray-600">{mockOrderData.vat}DKK</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Forsendelse</span>
                            <span className="text-gray-600">{mockOrderData.shipping}DKK</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total</span>
                            <span className="text-gray-600">{mockOrderData.total}DKK</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
