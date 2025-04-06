'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Extend the Window interface to include VippsCheckout
declare global {
  interface Window {
    VippsCheckout?: {
      init: (config: {
        checkoutFrontendUrl: string;
        checkoutToken: string;
        iFrameContainerId: string;
        language: string;
        onComplete: (params: any) => void;
        onCancel: () => void;
        onError: (error: any) => void;
      }) => void;
    };
  }
}

// Define the API_BASE_URL properly to ensure it works in both development and production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface VippsMobilePayCheckoutProps {
  cart: { name: string; price: number; quantity: number; description?: string }[];
  customerInfo?: { [key: string]: any };
  onComplete: (params: any) => void;
  onCancel: () => void;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  marketing_consent: boolean;
}

const VippsMobilePayCheckout: React.FC<VippsMobilePayCheckoutProps> = ({ cart, customerInfo, onComplete, onCancel }) => {
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    first_name: customerInfo?.first_name || '',
    last_name: customerInfo?.last_name || '',
    email: customerInfo?.email || '',
    phone: customerInfo?.phone || '',
    address: customerInfo?.address || '',
    postal_code: customerInfo?.postal_code || '',
    city: customerInfo?.city || '',
    marketing_consent: customerInfo?.marketing_consent || false
  });
  const [selectedShipping, setSelectedShipping] = useState<{
    method: string;
    cost: number;
    pickup_point_id?: string;
  } | null>(null);
  const checkoutContainerRef = useRef(null);
  
  // Available shipping options matching your Order model
  const shippingOptions = [
    {
      method: 'home',
      title: 'Hjemmelevering',
      description: 'Levering til din adresse',
      cost: 4900, // 49 DKK in øre
      eta: '1-3 hverdage'
    },
    {
      method: 'pickup',
      title: 'Pakkeshop',
      description: 'Afhent i nærmeste pakkeshop',
      cost: 3900, // 39 DKK in øre
      eta: '2-4 hverdage'
    }
  ];

  // Preselect first shipping option
  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShipping) {
      setSelectedShipping({
        method: shippingOptions[0].method,
        cost: shippingOptions[0].cost
      });
    }
  }, []);

  // Calculate cart total (excluding shipping)
  const calculateCartTotal = () => {
    if (!cart || !cart.length) return 0;
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate total including shipping
  const calculateTotal = () => {
    const cartTotal = calculateCartTotal();
    const shippingCost = selectedShipping ? selectedShipping.cost : 0;
    return cartTotal + shippingCost;
  };

  // Handle shipping method selection
  const handleShippingSelection = (option: typeof shippingOptions[0]) => {
    setSelectedShipping({
      method: option.method,
      cost: option.cost
    });
  };

  // Handle shipping address form changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Enforce DKK currency and Denmark-only delivery
  const CURRENCY = 'DKK';
  const COUNTRY = 'DK';

  const validateForm = () => {
    const required = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'address',
      'postal_code',
      'city'
    ];

    const missing = required.filter(field => !shippingAddress[field as keyof ShippingAddress]);
    if (missing.length > 0) {
      setError(`Udfyld venligst alle påkrævede felter: ${missing.join(', ')}`);
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      setError('Indtast venligst en gyldig email-adresse');
      return false;
    }

    // Validate Danish phone number
    const phoneRegex = /^(\+45)?[0-9]{8}$/;
    if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ''))) {
      setError('Indtast venligst et gyldigt dansk telefonnummer (8 cifre)');
      return false;
    }

    // Validate Danish postal code
    const postalCodeRegex = /^[0-9]{4}$/;
    if (!postalCodeRegex.test(shippingAddress.postal_code)) {
      setError('Indtast venligst et gyldigt dansk postnummer (4 cifre)');
      return false;
    }

    return true;
  };

  const proceedToPayment = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedShipping) {
      setError('Vælg venligst en leveringsmetode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a proper payload that matches the API expectations
      const payload = {
        amount: calculateTotal(),
        currency: CURRENCY,
        customer: {
          email: shippingAddress.email,
          firstName: shippingAddress.first_name,
          lastName: shippingAddress.last_name,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          postalCode: shippingAddress.postal_code,
          city: shippingAddress.city,
          marketingConsent: shippingAddress.marketing_consent
        },
        shippingMethod: selectedShipping.method,
        shippingCost: selectedShipping.cost,
        paymentMethod: 'mobilepay',
        return_url: `${window.location.origin}/checkout/complete/`,
        description: 'Purchase from Mindebamsen',
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          description: item.description || item.name
        }))
      };

      console.log('Sending payload to:', `${API_BASE_URL}/api/checkout/`);
      console.log('Payload:', payload);

      // Make the API request
      const response = await axios.post(`${API_BASE_URL}/api/checkout/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
        timeout: 15000 // Increased timeout for better reliability
      });

      console.log('API response:', response.data);

      if (response.data && response.data.token) {
        setStep('payment');
        await loadCheckoutSDK(response.data.token);
      } else {
        throw new Error("Invalid response from checkout API");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      
      let errorMessage = "Kunne ikke behandle kundeinformation";
      
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          // Network error
          errorMessage = "Kunne ikke forbinde til betalingsserveren. Tjek din internetforbindelse og prøv igen.";
          console.error("Network error:", err);
        } else {
          // Server returned an error
          errorMessage = `Server fejl: ${err.response.data?.error || err.message}`;
          console.error("Server error:", err.response.data);
        }
      }
      
      setError(errorMessage);
      setStep('shipping');
    } finally {
      setLoading(false);
    }
  };

  // Load the Vipps MobilePay Checkout SDK
  const loadCheckoutSDK = (token: string) => {
    if (!document.getElementById('vipps-checkout-sdk')) {
      const script = document.createElement('script');
      script.id = 'vipps-checkout-sdk';
      script.src = 'https://checkout.vipps.no/vippsCheckoutSDK.js';
      script.async = true;
      
      script.onload = () => {
        initializeSDK(token);
      };
      
      document.body.appendChild(script);
    } else {
      initializeSDK(token);
    }
  };

  // Initialize the Vipps MobilePay SDK
  const initializeSDK = (token: string) => {
    if (window.VippsCheckout) {
      window.VippsCheckout.init({
        checkoutFrontendUrl: 'https://checkout.vipps.no',
        checkoutToken: token,
        iFrameContainerId: 'vipps-checkout-container',
        language: 'da-DK', // Danish language
        onComplete: (params) => {
          // Handle successful payment
          console.log("Payment complete:", params);
          onComplete(params);
        },
        onCancel: () => {
          // Handle cancelled payment
          console.log("Payment cancelled");
          setStep('shipping');
          onCancel();
        },
        onError: (error) => {
          // Handle payment error
          console.error('Payment error:', error);
          setError('Der opstod en fejl med betalingen. Prøv venligst igen.');
          setStep('shipping');
        }
      });
    } else {
      console.error("VippsCheckout not available");
      setError("Betalingssystemet kunne ikke indlæses. Prøv venligst igen eller kontakt support.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {step === 'shipping' ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Leveringsinformation</h2>
          
          {/* Shipping Address Form */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Fornavn</label>
                <input
                  type="text"
                  name="first_name"
                  value={shippingAddress.first_name}
                  onChange={handleAddressChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block">Efternavn</label>
                <input
                  type="text"
                  name="last_name"
                  value={shippingAddress.last_name}
                  onChange={handleAddressChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="block">E-mail</label>
              <input
                type="email"
                name="email"
                value={shippingAddress.email}
                onChange={handleAddressChange}
                className="w-full border p-2 rounded"
              />
            </div>
            
            <div>
              <label className="block">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={shippingAddress.phone}
                onChange={handleAddressChange}
                className="w-full border p-2 rounded"
                placeholder="Eksempel: 12345678"
              />
            </div>
            
            <div>
              <label className="block">Adresse</label>
              <input
                type="text"
                name="address"
                value={shippingAddress.address}
                onChange={handleAddressChange}
                className="w-full border p-2 rounded"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Postnummer</label>
                <input
                  type="text"
                  name="postal_code"
                  value={shippingAddress.postal_code}
                  onChange={handleAddressChange}
                  className="w-full border p-2 rounded"
                  maxLength={4}
                  placeholder="Eksempel: 2100"
                />
              </div>
              <div>
                <label className="block">By</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleAddressChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="marketing_consent"
                  checked={shippingAddress.marketing_consent}
                  onChange={handleAddressChange}
                  className="mr-2"
                />
                Ja tak, jeg vil gerne modtage nyhedsbreve og tilbud
              </label>
            </div>
          </form>

          {/* Shipping Options */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Vælg leveringsmetode</h3>
            <div className="space-y-4">
              {shippingOptions.map((option) => (
                <div
                  key={option.method}
                  className={`p-4 border rounded cursor-pointer ${
                    selectedShipping?.method === option.method ? 'border-blue-500' : ''
                  }`}
                  onClick={() => handleShippingSelection(option)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{option.title}</h4>
                      <p className="text-gray-600">{option.description}</p>
                      <p className="text-sm text-gray-500">{option.eta}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{(option.cost / 100).toFixed(2)} kr.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart summary */}
          <div className="mt-8 p-4 bg-gray-50 rounded border">
            <h3 className="text-xl font-bold mb-2">Din ordre</h3>
            {cart && cart.length > 0 ? (
              <>
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b">
                    <div>
                      <span>{item.name}</span>
                      {item.quantity > 1 && <span className="text-sm text-gray-500"> x{item.quantity}</span>}
                    </div>
                    <div>{((item.price * item.quantity) / 100).toFixed(2)} kr.</div>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-b">
                  <div>Levering ({selectedShipping?.method === 'home' ? 'Hjemmelevering' : 'Pakkeshop'})</div>
                  <div>{selectedShipping ? (selectedShipping.cost / 100).toFixed(2) : '0.00'} kr.</div>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <div>Total</div>
                  <div>{(calculateTotal() / 100).toFixed(2)} kr.</div>
                </div>
              </>
            ) : (
              <p>Ingen varer i kurven</p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={proceedToPayment}
            disabled={loading || !cart || cart.length === 0}
            className="mt-8 w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Behandler...' : 'Fortsæt til betaling'}
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Betaling med MobilePay</h2>
          <div id="vipps-checkout-container" ref={checkoutContainerRef} className="min-h-96 border rounded p-4"></div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <button
            onClick={() => setStep('shipping')}
            className="mt-4 w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
          >
            Tilbage til leveringsinformation
          </button>
        </div>
      )}
    </div>
  );
};

export default VippsMobilePayCheckout;