'use client';  // Must be the first line, using single quotes

import React, { useState } from 'react';
import Image from 'next/image';
import { Playfair_Display, Lato } from 'next/font/google';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/navbar';

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

export default function ProductCustomizePage() {
  const router = useRouter();
  const [selectedFabric, setSelectedFabric] = useState(0);
  const [selectedVest, setSelectedVest] = useState(false);
  const [selectedFace, setSelectedFace] = useState(0);
  const [formData, setFormData] = useState({
    bodyAndArms: '',
    headAndEars: '',
    underArms: '',
    belly: '',
    vestFabric: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validate required field (at least body fabric must be specified)
    if (!formData.bodyAndArms.trim()) {
      setError("Please describe the fabric for the body");
      setIsSubmitting(false);
      return;
    }
    
    // Calculate prices in øre (cents) for backend compatibility
    const basePriceInOre = basePrice * 100;
    const vestPriceInOre = vestPrice * 100;
    
    // Create the cart items
    const cartItems = [
      {
        name: `Memory Bear - ${fabricOptions[selectedFabric].text}`,
        price: basePriceInOre,
        quantity: 1,
        description: `Memory bear with ${fabricOptions[selectedFabric].text}`,
        fabricType: `${selectedFabric + 1} fabric`,
        bodyFabric: formData.bodyAndArms,
        headFabric: formData.headAndEars || null,
        underArmsFabric: formData.underArms || null,
        bellyFabric: formData.belly || null,
        hasVest: false,
        vestFabric: null,
        faceStyle: faceOptions[selectedFace].text
      }
    ];
    
    // Add vest as a separate item if selected
    if (selectedVest) {
      cartItems.push({
        name: "Memory Bear Vest",
        price: vestPriceInOre,
        quantity: 1,
        description: "Vest accessory for memory bear",
        fabricType: "",
        bodyFabric: "",
        headFabric: "",
        underArmsFabric: "",
        bellyFabric: "",
        hasVest: true,
        vestFabric: null,  // Always set to null in the vest item
        faceStyle: ""
      });
    }
    
    // Collect all product data
    const productData = {
      // Product selections
      fabricOption: fabricOptions[selectedFabric],
      vestSelected: selectedVest,
      faceOption: faceOptions[selectedFace],
      
      // Form inputs for fabric descriptions
      fabricDescriptions: formData,
      
      // Price information
      basePrice,
      vestPrice,
      totalPrice,

      // Create a formatted cart for checkout - prices in øre (cents)
      cart: cartItems
    };
    
    try {
      // Save to localStorage for the checkout page to access
      localStorage.setItem('memoryBearOrder', JSON.stringify(productData));
      
      // Navigate to checkout page
      router.push('/checkout_mobilepay');
    } catch (err) {
      console.error("Error saving order data:", err);
      setError("There was a problem saving your order. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Fabric options
  const fabricOptions = [
    { 
      src: "/images/1.jpg", 
      alt: "Bear with 1 type of fabric",
      text: "1 type of fabric",
      price: "499DKK"
    },
    { 
      src: "/images/1.jpg", 
      alt: "Bear with 2 types of fabric",
      text: "2 types of fabric",
      price: "599DKK"
    },
    { 
      src: "/images/1.jpg", 
      alt: "Bear with 3 types of fabric",
      text: "3 types of fabric",
      price: "699DKK"
    },
    { 
      src: "/images/1.jpg", 
      alt: "Bear with 4 types of fabric",
      text: "4 types of fabric",
      price: "799DKK"
    }
  ];

  // Face options
  const faceOptions = [
    {
      src: "/images/vtb-24736-15inchbuddyredpanda_2_sq_11022022.webp", 
      alt: "Face 1",
      text: "Face 1",
      price: "0,-"
    },
    {
      src: "/images/fernanda-greppe-sxXxhuLdnuo-unsplash.jpg", 
      alt: "Face 2",
      text: "Face 2",
      price: "0,-"
    },
    {
      src: "/images/sandy-millar-8vaQKYnawHw-unsplash.jpg", 
      alt: "Face 3",
      text: "Face 3",
      price: "0,-"
    }
  ];

  // Calculate total price - parse integers properly
  const basePrice = parseInt(fabricOptions[selectedFabric].price.replace('DKK', ''));
  const vestPrice = selectedVest ? 250 : 0;
  const totalPrice = basePrice + vestPrice;

  // Determine which fields should be enabled based on the selected fabric option
  const isFieldEnabled = {
    bodyAndArms: true, // Always enabled
    headAndEars: selectedFabric >= 1, // Enabled for 2+ fabric options
    underArms: selectedFabric >= 2, // Enabled for 3+ fabric options
    belly: selectedFabric >= 3, // Enabled for 4 fabric options
    vestFabric: selectedVest // Enabled only if vest is selected
  };

  return (
    <>
      <Navbar />
      <main className={`${playfair.variable} ${lato.variable} font-sans min-h-screen bg-neutral-50 py-12`}>
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mb-8 text-center">Customize Your MemoryBear</h1>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-8">
            {/* Left column - Images */}
            <div className="flex flex-col space-y-8">
              {/* Fabric selection section */}
              <div>
                <h2 className="font-serif text-xl text-gray-800 mb-4">Select Fabric Options</h2>
                <div className="grid grid-cols-2 gap-4">
                  {fabricOptions.map((option, index) => (
                    <div key={index} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => setSelectedFabric(index)}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all transform ${
                          selectedFabric === index 
                            ? 'border-rose-600 shadow-lg scale-[1.02]' 
                            : 'border-gray-200 hover:border-gray-300 hover:scale-[1.01] hover:shadow-md'
                        } active:scale-95 transition-all duration-200`}
                      >
                        <Image 
                          src={option.src}
                          alt={option.alt}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        {selectedFabric === index && (
                          <div className="absolute top-2 right-2 bg-rose-600 rounded-full w-6 h-6 flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-2 px-3 text-white text-center flex justify-between items-center">
                          <span className="text-sm font-medium">{option.text}</span>
                          <span className="text-sm font-bold">{option.price}</span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Vest add-on section */}
              <div>
                <h2 className="font-serif text-xl text-gray-800 mb-4">Optional Accessories</h2>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSelectedVest(!selectedVest)}
                    className={`relative w-full max-w-xs aspect-square rounded-md overflow-hidden border-2 transition-all transform ${
                      selectedVest 
                        ? 'border-rose-600 shadow-lg scale-[1.02]' 
                        : 'border-gray-200 hover:border-gray-300 hover:scale-[1.01] hover:shadow-md'
                    } active:scale-95 transition-all duration-200`}
                  >
                    <Image 
                      src="/images/6.avif"
                      alt="Teddy bear vest"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {selectedVest && (
                      <div className="absolute top-2 right-2 bg-rose-600 rounded-full w-6 h-6 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-2 px-3 text-white text-center flex justify-between items-center">
                      <span className="text-sm font-medium">Add vest</span>
                      <span className="text-sm font-bold">+250DKK</span>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Face style selection */}
              <div>
                <h2 className="font-serif text-xl text-gray-800 mb-4">Select Face Style</h2>
                <div className="grid grid-cols-3 gap-3">
                  {faceOptions.map((option, index) => (
                    <div key={index} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => setSelectedFace(index)}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all transform ${
                          selectedFace === index 
                            ? 'border-rose-600 shadow-lg scale-[1.02]' 
                            : 'border-gray-200 hover:border-gray-300 hover:scale-[1.01] hover:shadow-md'
                        } active:scale-95 transition-all duration-200`}
                      >
                        <Image 
                          src={option.src}
                          alt={option.alt}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        {selectedFace === index && (
                          <div className="absolute top-2 right-2 bg-rose-600 rounded-full w-6 h-6 flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-2 px-3 text-white text-center flex justify-between items-center">
                          <span className="text-sm font-medium">{option.text}</span>
                          <span className="text-sm font-bold">{option.price}</span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Fabric selection tips */}
              <div className="bg-rose-50 p-4 rounded-md border border-rose-100">
                <h3 className="font-serif text-gray-800 mb-2 text-lg">Fabric Selection Tips</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-rose-600 mr-2">•</span>
                    Choose fabrics that have special meaning
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-600 mr-2">•</span>
                    Durable fabrics like cotton, flannel, and denim work best
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-600 mr-2">•</span>
                    Special details like pockets or buttons can be incorporated
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-600 mr-2">•</span>
                    We'll clean and prepare all fabrics you send
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Right column - Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-rose-50 p-4 rounded-md border border-rose-100 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-lg text-gray-800">Total Price:</span>
                    <span className="font-serif text-2xl text-rose-600 font-medium">{totalPrice}DKK</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Base price: {basePrice}DKK
                    {vestPrice > 0 && <span> + Vest: {vestPrice}DKK</span>}
                  </div>
                </div>
              
                <div>
                  <label htmlFor="bodyAndArms" className="block font-serif text-gray-800 text-lg mb-2">
                    Krop
                  </label>
                  <input
                    type="text"
                    id="bodyAndArms"
                    name="bodyAndArms"
                    value={formData.bodyAndArms}
                    onChange={handleInputChange}
                    placeholder="Hvilket stof vil du have på kroppen og armerne?"
                    className={`w-full px-4 py-3 rounded-md border ${
                      isFieldEnabled.bodyAndArms 
                        ? 'border-gray-300 text-gray-800' 
                        : 'border-gray-200 bg-gray-100 text-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition font-sans`}
                    required
                    disabled={!isFieldEnabled.bodyAndArms}
                  />
                </div>
                
                <div>
                  <label htmlFor="headAndEars" className={`block font-serif ${
                    isFieldEnabled.headAndEars ? 'text-gray-800' : 'text-gray-400'
                  } text-lg mb-2`}>
                    Ansigt og Øre {!isFieldEnabled.headAndEars && '(Vælg 2 stof-typer eller flere)'}
                  </label>
                  <input
                    type="text"
                    id="headAndEars"
                    name="headAndEars"
                    value={formData.headAndEars}
                    onChange={handleInputChange}
                    placeholder="Hvilket stof vil du have på hovedet og ørerne?"
                    className={`w-full px-4 py-3 rounded-md border ${
                      isFieldEnabled.headAndEars 
                        ? 'border-gray-300 text-gray-800' 
                        : 'border-gray-200 bg-gray-100 text-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition font-sans`}
                    disabled={!isFieldEnabled.headAndEars}
                  />
                </div>

                <div>
                  <label htmlFor="underArms" className={`block font-serif ${
                    isFieldEnabled.underArms ? 'text-gray-800' : 'text-gray-400'
                  } text-lg mb-2`}>
                    Underarme og Fødderne {!isFieldEnabled.underArms && '(Vælg 3 stof-typer eller flere)'}
                  </label>
                  <input
                    type="text"
                    id="underArms"
                    name="underArms"
                    value={formData.underArms}
                    onChange={handleInputChange}
                    placeholder="Hvilket stof vil du have på underarmene og fødderne?"
                    className={`w-full px-4 py-3 rounded-md border ${
                      isFieldEnabled.underArms 
                        ? 'border-gray-300 text-gray-800' 
                        : 'border-gray-200 bg-gray-100 text-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition font-sans`}
                    disabled={!isFieldEnabled.underArms}
                  />
                </div>

                <div>
                  <label htmlFor="belly" className={`block font-serif ${
                    isFieldEnabled.belly ? 'text-gray-800' : 'text-gray-400'
                  } text-lg mb-2`}>
                    Maven {!isFieldEnabled.belly && '(Vælg 4 stof-typer)'}
                  </label>
                  <input
                    type="text"
                    id="belly"
                    name="belly"
                    value={formData.belly}
                    onChange={handleInputChange}
                    placeholder="Hvilket stof vil du have på maven?"
                    className={`w-full px-4 py-3 rounded-md border ${
                      isFieldEnabled.belly 
                        ? 'border-gray-300 text-gray-800' 
                        : 'border-gray-200 bg-gray-100 text-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition font-sans`}
                    disabled={!isFieldEnabled.belly}
                  />
                </div>
                
                <div>
                  <label htmlFor="vestFabric" className={`block font-serif ${
                    isFieldEnabled.vestFabric ? 'text-gray-800' : 'text-gray-400'
                  } text-lg mb-2`}>
                    Vest {!isFieldEnabled.vestFabric && '(Vælg vest ovenfor)'}
                  </label>
                  <input
                    type="text"
                    id="vestFabric"
                    name="vestFabric"
                    value={formData.vestFabric}
                    onChange={handleInputChange}
                    placeholder="Hvilket stof vil du have på vesten?"
                    className={`w-full px-4 py-3 rounded-md border ${
                      isFieldEnabled.vestFabric 
                        ? 'border-gray-300 text-gray-800' 
                        : 'border-gray-200 bg-gray-100 text-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition font-sans`}
                    disabled={!isFieldEnabled.vestFabric}
                  />
                </div>
                
                {error && (
                  <div className="p-4 bg-red-100 text-red-700 rounded">
                    {error}
                  </div>
                )}
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-rose-600 text-white font-sans font-normal rounded-md hover:bg-rose-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg disabled:bg-rose-300"
                  >
                    {isSubmitting ? 'Processing...' : 'Continue to Checkout'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
