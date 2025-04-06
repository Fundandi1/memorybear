// components/Footer.jsx
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-red-900 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Column 1: Logo and description */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <Image 
                src="/images/memorybear-logo-white.png" 
                alt="MemoryBear" 
                width={160} 
                height={40} 
              />
            </Link>
            <p className="text-white text-sm leading-relaxed">
              Curating exceptional memory bears 
              from cherished clothing worldwide.
            </p>
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className="text-lg font-medium mb-6">Services</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/custom-bears" className="text-white hover:text-white transition-colors">
                  Custom Bears
                </Link>
              </li>
              <li>
                <Link href="/memory-collection" className="text-white hover:text-white transition-colors">
                  Memory Collection
                </Link>
              </li>
              <li>
                <Link href="/personalization" className="text-white hover:text-white transition-colors">
                  Personalization
                </Link>
              </li>
              <li>
                <Link href="/restoration" className="text-white hover:text-white transition-colors">
                  Restoration
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: About */}
          <div>
            <h3 className="text-lg font-medium mb-6">About</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/our-story" className="text-white hover:text-white transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/betingelser" className="text-white hover:text-white transition-colors">
                  Betingelser
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-lg font-medium mb-6">Newsletter</h3>
            <p className="text-white text-sm mb-4">
              Subscribe to receive curated collections
              and exclusive artwork releases.
            </p>
            <form className="space-y-3">
              <div>
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-2 bg-white border border-white text-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <button 
                type="submit" 
                className="px-4 py-2 bg-rose-600 text-white font-medium rounded hover:bg-rose-700 transition-colors w-full"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-white text-sm">
            © {new Date().getFullYear()} MemoryBear. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;