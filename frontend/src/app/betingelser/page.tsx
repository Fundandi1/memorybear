'use client';

import React from 'react';
import Link from 'next/link';
import { Playfair_Display, Lato } from 'next/font/google';

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

export default function SalgsbetingelserPage() {
  return (
    <main className={`${playfair.variable} ${lato.variable} font-sans min-h-screen bg-neutral-50 py-12`}>
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mb-8 text-center">Salgsbetingelser</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">1. Generelle oplysninger</h2>
            <ul className="space-y-2 text-gray-700">
              <li><span className="font-medium">Virksomhedsnavn:</span> Marketing Activity ApS</li>
              <li><span className="font-medium">CVR-nummer:</span> 39816792</li>
              <li><span className="font-medium">Adresse:</span> Strandvejen 362, 3060 Espergærde</li>
              <li><span className="font-medium">Telefonnummer:</span> 27151181</li>
              <li><span className="font-medium">E-mail:</span> <a href="mailto:info@mindebamsen.dk" className="text-rose-600 hover:underline">info@mindebamsen.dk</a></li>
            </ul>
          </section>
          
          {/* Section 2 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">2. Bestilling og betaling</h2>
            <p className="text-gray-700">
              Bestilling foretages via vores hjemmeside. Betaling sker online med de angivne betalingsmuligheder. 
              Ordren er bindende, når betalingen er gennemført.
            </p>
          </section>
          
          {/* Section 3 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">3. Levering</h2>
            <p className="text-gray-700">
              Leveringstiden afhænger af den aktuelle ordremængde, men vi bestræber os på at sende din mindebamse inden for 2-3 uger. 
              Du vil modtage en bekræftelse, når din ordre er sendt.
            </p>
          </section>
          
          {/* Section 4 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">4. Fortrydelsesret</h2>
            <p className="text-gray-700">
              Da vores mindebamser syes fra bunden ud fra kundens eget tøj, gælder der <span className="font-bold">ingen fortrydelsesret</span> jf. 
              Forbrugeraftaleloven §18 stk. 2 nr. 3 om specialfremstillede varer.
            </p>
          </section>
          
          {/* Section 5 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">5. Ændringer og reklamationer</h2>
            <p className="text-gray-700 mb-4">
              Vi tilbyder muligheden for at lave mindre ændringer, hvis kunden ikke er tilfreds med det færdige produkt. 
              Kontakt os hurtigst muligt, så finder vi en løsning.
            </p>
            <p className="text-gray-700">
              Reklamationer behandles i henhold til købelovens regler. Hvis du oplever fejl eller mangler ved produktet, 
              skal du kontakte os inden for rimelig tid efter modtagelsen.
            </p>
          </section>
          
          {/* Section 6 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">6. Håndtering af klager</h2>
            <p className="text-gray-700">
              Hvis du ønsker at klage, bedes du kontakte os på <a href="mailto:info@mindebamsen.dk" className="text-rose-600 hover:underline">info@mindebamsen.dk</a>. 
              Vi bestræber os på at finde en tilfredsstillende løsning. Skulle vi ikke nå til enighed, kan du indgive en klage til 
              Center for Klageløsning under Nævnenes Hus.
            </p>
          </section>
          
          {/* Section 7 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">7. Ansvar</h2>
            <p className="text-gray-700">
              Vi påtager os intet ansvar for fejl, der skyldes forkert vedligeholdelse eller håndtering af produktet efter levering.
            </p>
          </section>
          
          {/* Section 8 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">8. Lovvalg og værneting</h2>
            <p className="text-gray-700">
              Disse betingelser er underlagt dansk lovgivning, og eventuelle tvister skal afgøres ved de danske domstole.
            </p>
          </section>
          
          {/* Section 9 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">9. Persondatapolitik</h2>
            <p className="text-gray-700">
              Vi behandler dine personlige oplysninger fortroligt og i overensstemmelse med gældende databeskyttelseslovgivning. 
              Se vores <Link href="/privacy" className="text-rose-600 hover:underline">persondatapolitik</Link> for mere information om, 
              hvordan vi behandler dine data.
            </p>
          </section>
          
          {/* Section 10 */}
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-xl md:text-2xl font-serif text-gray-800 mb-4">10. Kontakt</h2>
            <p className="text-gray-700 mb-4">
              Har du spørgsmål til vores salgsbetingelser eller dit køb, er du altid velkommen til at kontakte os på:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li><span className="font-medium">E-mail:</span> <a href="mailto:info@mindebamsen.dk" className="text-rose-600 hover:underline">info@mindebamsen.dk</a></li>
              <li><span className="font-medium">Telefon:</span> 27151181</li>
            </ul>
          </section>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500 text-center">
            Disse salgsbetingelser er senest opdateret den 22. marts 2025.
          </div>
          
          <div className="mt-8 flex justify-center">
            <Link 
              href="/"
              className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition duration-300 ease-in-out"
            >
              Tilbage til forsiden
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}