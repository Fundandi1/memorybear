// components/Navbar.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top notification bar */}
      <div className="w-full bg-red-900 text-white py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/contact" className="text-lx flex items-center hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Brug for hjælp?
          </a>
          <p className="text-lx">30 Dages Returret | Hurtig levering</p>
          <div className="flex items-center">
            <Image src="/images/flag.png" alt="Danish flag" width={16} height={12} className="mr-2" />
            <span className="text-lx">Dansk virksomhed</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className={`w-full z-50 transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''} bg-white py-3`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-10">
              <div className="flex items-center">
                <Image 
                  src="/images/Mindebamsen.png" 
                  alt="MemoryBear Logo" 
                  width={200} 
                  height={60} 
                />
              </div>
            </Link>

{/* Desktop Navigation - Simple link style */}
<nav className="hidden md:flex items-center space-x-1">
              <div className="px-3 py-2">
                <Link href="/customize" className="font-medium text-gray-800 hover:text-rose-600">
                  Skab din Mindebamse
                </Link>
              </div>
  
  <div className="px-3 py-2">
    <button 
      onClick={() => {
        const pageHeight = document.body.scrollHeight;
        window.scrollTo({ top: pageHeight * 0.35, behavior: 'smooth' });
      }}
      className="font-medium text-gray-800 hover:text-rose-600 cursor-pointer"
    >
      Om Mindebamsen
    </button>
  </div>
  
  <div className="px-3 py-2">
    <button 
      onClick={() => {
        const pageHeight = document.body.scrollHeight;
        window.scrollTo({ top: pageHeight * 0.79, behavior: 'smooth' });
      }}
      className="font-medium text-gray-800 hover:text-rose-600 cursor-pointer"
    >
      FAQ
    </button>
  </div>
  
  <div className="px-3 py-2">
    <button 
      onClick={() => {
        const pageHeight = document.body.scrollHeight;
        window.scrollTo({ top: pageHeight, behavior: 'smooth' });
      }}
      className="font-medium text-gray-800 hover:text-rose-600 cursor-pointer"
    >
      Kontakt
    </button>
  </div>
</nav>

            {/* Shopping cart and search */}
            <div className="flex items-center">
              <button className="p-2 hover:text-rose-600" aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <Link href="/cart" className="p-2 hover:text-rose-600 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-indigo-950 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </Link>
              
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 ml-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {!isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div 
        className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="container mx-auto px-6 pt-24 pb-8 h-full overflow-y-auto">
          <nav className="flex flex-col space-y-4">
            <Link href="/products" className="font-medium text-gray-800 py-2 border-b border-gray-100">
              Products
            </Link>
            <Link href="/customize" className="font-medium text-gray-800 py-2 border-b border-gray-100">
              Customize
            </Link>
            <Link href="/accessories" className="font-medium text-gray-800 py-2 border-b border-gray-100">
              Accessories
            </Link>
            <Link href="/help" className="font-medium text-gray-800 py-2 border-b border-gray-100">
              Help
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}