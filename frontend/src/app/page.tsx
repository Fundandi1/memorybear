// frontend/src/pages/index.tsx
"use client";
"use strict";

import { Playfair_Display, Lato } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

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

export default function Home() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  
  // Testimonial data
  const testimonials = [
    { 
      name: "Michael R.", 
    location: "Boston, MA",
    quote: "Efter min kone gik bort, fik jeg hendes yndlingscardigan lavet til en MemoryBear til vores datter. Det er blevet hendes mest værdsatte ejendel og hjælper med at holde hendes mors minde i live på den smukkeste måde.",
    image: "/images/vtb-24736-15inchbuddyredpanda_2_sq_11022022.webp",
    rating: 5
  },
  { 
    name: "Alicia T.", 
    location: "Portland, OR",
    quote: "Jeg sendte min søns babytøj ind, som jeg ikke kunne nænne at skille mig af med. Nu i stedet for at ligge i en kasse, er de et smukt minde, han faktisk kan nyde. Håndværket er exceptionelt og ærer virkelig minderne.",
    image: "/images/vtb-24736-15inchbuddyredpanda_2_sq_11022022.webp",
    rating: 5
  },
  { 
    name: "David K.", 
    location: "Minneapolis, MN",
    quote: "Vores datter er på college og følte sig hjemvé. Vi overraskede hende med en MemoryBear lavet af hendes barndomstæppe og hendes fars gamle t-shirts. Hun sagde, det føles som at få et kram hjemmefra hver dag.",
    image: "/images/vtb-24736-15inchbuddyredpanda_2_sq_11022022.webp",
    rating: 5
    }
  ];
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  // Video modal component
  const VideoModal = () => {
    return (
      <Dialog
        open={isVideoPlaying}
        onClose={() => setIsVideoPlaying(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="relative pt-[56.25%]">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/example-memory-bear-video?autoplay=1" 
                title="MemoryBear Story" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };
  
  return (
    <><><Navbar /><main className={`${playfair.variable} ${lato.variable} font-sans min-h-screen`}>
      {isVideoPlaying && <VideoModal />}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-50 to-rose-50">
          {/* Subtle background elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-100 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/4 -left-24 w-80 h-80 bg-blue-100 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-100 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 py-20">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="flex flex-col space-y-8">
              <span className="text-rose-600 font-light tracking-wider text-sm uppercase font-sans">Håndlavet med passion</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-gray-800 leading-tight">
                <span className="text-rose-600 italic">Minder</span> Du Kan <span className="block">Holde For Evigt</span>
              </h1>
              <p className="text-lg text-gray-600 font-light font-sans leading-relaxed">
              Forvandl kært tøj til en speciallavet teddybjørn, der holder dine kære tæt på. Hver MemoryBear er håndlavet med omhu, ved hjælp af stykker af meningsfuldt stof til at skabe et minde, der giver trøst, når du har mest brug for det.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/customize"
                  className="px-8 py-4 bg-red-800 text-white font-sans font-normal rounded-md hover:bg-rose-700 transition duration-300 ease-in-out text-center shadow-md hover:shadow-lg"
                >
                  Skab Din Mindebamse
                </Link>
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="px-8 py-4 border border-rose-200 text-rose-600 font-sans font-normal rounded-md hover:bg-rose-50 transition duration-300 ease-in-out flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Se Vores Historie
                </button>
              </div>
            </div>
            <div className="relative h-96 md:h-[550px] rounded-md overflow-hidden shadow-xl">
              <Image
                src="/images/vtb-24736-15inchbuddyredpanda_2_sq_11022022.webp"
                alt="A handcrafted memory bear made from cherished clothing"
                fill
                style={{ objectFit: 'cover' }}
                className="transition duration-700 hover:scale-105"
                priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-sans italic opacity-90">
                "Denne bjørn indeholder essensen af min mors yndlingscardigan — jeg føler hendes varme hver gang jeg holder den."
                </p>
              </div>
            </div>

            <section className="py-1 mb-10 text-red-700 w-full">
              <div className="container absolute mx-auto px-4">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="w-1/2 sm:w-1/5 flex flex-col items-center text-center mb-6 sm:mb-0">
                    <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="1.5" />
                      <circle cx="7" cy="18" r="1" strokeWidth="1.5" />
                      <circle cx="17" cy="18" r="1" strokeWidth="1.5" />
                    </svg>
                    <p className="text-sm leading-tight">Gratis fragt<br />over 700 kr.</p>
                  </div>

                  <div className="w-1/2 sm:w-1/5 flex flex-col items-center text-center mb-6 sm:mb-0">
                    <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" strokeWidth="1.5" />
                      <path d="M12.0096 8.5L12.0096 12.5L14.5 14.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm leading-tight">30 dages<br />søvngaranti</p>
                  </div>

                  <div className="w-1/2 sm:w-1/5 flex flex-col items-center text-center mb-6 sm:mb-0">
                    <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 11L12 6L17 11M12 6V18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm leading-tight">250.000+<br />glade kunder</p>
                  </div>

                  <div className="w-1/2 sm:w-1/5 flex flex-col items-center text-center mb-6 sm:mb-0">
                    <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" strokeWidth="1.5" />
                      <path d="M12 8V12L15 13.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm leading-tight">1-3<br />hverdages levering</p>
                  </div>

                  <div className="w-full sm:w-1/5 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeWidth="1.5" />
                    </svg>
                    <p className="text-sm leading-tight">Kontakt os<br />alle hverdage</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </section>

{/* Emotional Connection Section */}
<section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="text-rose-600 font-sans text-sm tracking-wider uppercase">Mere end et minde</span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mt-2">En Håndgribelig Forbindelse til Det, Der Betyder Mest</h2>
            <div className="w-20 h-1 bg-rose-200 mx-auto mt-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mt-6 font-sans">Hver MemoryBear er en håndlavet skat, der bærer essensen af dine mest dyrebare minder og tilbyder trøst, når du har mest brug for det.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="bg-neutral-50 p-8 rounded-md border-l-4 border-rose-300 transition hover:shadow-md">
                <h3 className="text-xl font-serif text-gray-800 mb-3">For Dem Vi Har Mistet</h3>
                <p className="text-gray-600 font-sans">Forvandl tøj fra én, der er gået bort, til et trøstende minde, der hjælper med at holde deres minde i live. En håndgribelig forbindelse at holde fast i, når du savner dem mest, som giver trøst under helingsrejsen.</p>
              </div>

              <div className="bg-neutral-50 p-8 rounded-md border-l-4 border-blue-300 transition hover:shadow-md">
                <h3 className="text-xl font-serif text-gray-800 mb-3">For Livets Dyrebare Milepæle</h3>
                <p className="text-gray-600 font-sans">Bevar babys første tæppe, studenterkjoler, bryllupstøj eller andre milepælsbeklædninger som et meningsfuldt minde, der fortæller din unikke historie og ærer tidens gang.</p>
              </div>

              <div className="bg-neutral-50 p-8 rounded-md border-l-4 border-purple-300 transition hover:shadow-md">
                <h3 className="text-xl font-serif text-gray-800 mb-3">For Dem Langt Væk</h3>
                <p className="text-gray-600 font-sans">Skab en særlig gave til forhold på distance, familiemedlemmer der tjener i udlandet, eller børn der er på kollegium—et kram de kan holde, når du ikke kan være der personligt.</p>
              </div>
            </div>

            <div className="relative rounded-md overflow-hidden shadow-xl h-[500px]">
              <Image
                src="/images/fernanda-greppe-sxXxhuLdnuo-unsplash.jpg"
                alt="Kvinde der holder en mindebamse lavet af hendes bedstemors kjole"
                fill
                style={{ objectFit: 'cover' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col items-center justify-end p-10 text-center">
                <p className="text-xl font-serif text-white italic mb-6 leading-relaxed">"Efter min bedstemor gik bort, vidste jeg ikke, hvad jeg skulle gøre med hendes yndlingskjoler. Nu er de blevet til en smuk MemoryBear, der giver mig trøst hver dag og hjælper mig med at føle mig tæt på hende igen."</p>
                <p className="text-white font-sans font-medium">— Sarah K.</p>
                <div className="mt-6 flex justify-center">
                  <span className="inline-block w-16 h-0.5 bg-rose-300 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* How It Works Section */}
<section className="py-24 bg-neutral-50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="text-rose-600 font-sans text-sm tracking-wider uppercase">Enkel proces</span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mt-2">Sådan Skaber Du Din MemoryBear</h2>
            <div className="w-20 h-1 bg-rose-200 mx-auto mt-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mt-6 font-sans">En omtænksom rejse for at forvandle kært stof til et evigt minde.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                title: "Vælg Dine Stoffer",
                description: "Vælg 2-3 stykker tøj eller tekstiler, der har særlig betydning og minder for dig.",
                icon: "/icons/fabric-icon.svg",
                image: "/images/1.png"
              },
              {
                title: "Design Din Bamse",
                description: "Tilpas din bamses træk, placering af særlige detaljer og eventuelle personlige elementer.",
                icon: "/icons/design-icon.svg",
                image: "/images/2.png"
              },
              {
                title: "Håndlavet Kreation",
                description: "Vores dygtige kunsthåndværkere fremstiller omhyggeligt din bamse med minutiøs opmærksomhed på detaljer og respekt.",
                icon: "/icons/craft-icon.svg",
                image: "/images/3.png"
              },
              {
                title: "Modtag & Værdsæt",
                description: "Pak din håndlavede MemoryBear ud, et meningsfuldt minde at værdsætte for generationer fremover.",
                icon: "/icons/heart-icon.svg",
                image: "/images/4.png"
              }
            ].map((step, index) => (
              <div key={index} className="bg-white rounded-md shadow-md overflow-hidden transition duration-300 hover:shadow-lg flex flex-col h-full">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    style={{ objectFit: 'cover' }} />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center mb-4">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 mr-3 text-sm font-sans font-medium">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-serif text-gray-800">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 font-sans text-sm flex-grow">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:flex absolute top-1/3 -right-3 transform z-10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 5L20 12L13 19" stroke="#F9A8D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/customize"
              className="px-8 py-4 bg-rose-600 text-white font-sans font-normal rounded-md hover:bg-rose-700 transition duration-300 ease-in-out inline-block shadow-md hover:shadow-lg"
            >
              Skab Din Egen Mindebamse
            </Link>
          </div>
        </div>
      </section>

{/* Featured Examples */}
<section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="text-rose-600 font-sans text-sm tracking-wider uppercase">Meningsfulde kreationer</span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mt-2">Bamser Med Historier At Fortælle</h2>
            <div className="w-20 h-1 bg-rose-200 mx-auto mt-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mt-6 font-sans">Hver MemoryBear har sin egen unikke historie. Her er nogle få, som har bragt trøst og glæde til deres familier.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Bedstefars Flannel Bamse",
                story: "Skabt fra en samling af flanelskjorter, der var bedstefars daglige uniform i 40 år. Nu kan hans barnebarn holde en del af ham tæt på.",
                image: "/images/Skærmbillede 2025-03-21 kl. 22.08.10.png"
              },
              {
                title: "Bryllups Mindebamse",
                story: "Lavet af kniplingen fra en brudekjole og stoffet fra en brudgoms jakkesæt for at mindes 50 års ægteskab. Et vidnesbyrd om varig kærlighed.",
                image: "/images/sandy-millar-8vaQKYnawHw-unsplash.jpg"
              },
              {
                title: "Babys Første År Bamse",
                story: "Fremstillet af babys hjemkomsttøj, yndlings-onesie og tæppet, der var vidne til utallige kram. En perfekt gave til den første fødselsdag.",
                image: "/images/fernanda-greppe-sxXxhuLdnuo-unsplash.jpg"
              }
            ].map((bear, index) => (
              <div key={index} className="bg-white rounded-md overflow-hidden shadow-md hover:shadow-lg transition duration-300 border border-gray-100 flex flex-col h-full">
                <div className="h-64 relative overflow-hidden">
                  <Image
                    src={bear.image}
                    alt={bear.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition duration-700 hover:scale-105" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-serif text-gray-800 mb-3">{bear.title}</h3>
                  <p className="text-gray-600 font-sans mb-4 flex-grow">{bear.story}</p>
                  <Link
                    href={`/stories/${index + 1}`}
                    className="text-rose-600 font-sans font-medium hover:text-rose-700 transition duration-300 flex items-center mt-2 self-start"
                  >
                    Læs hele historien
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Testimonials */}
<section className="py-24 bg-neutral-50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="text-rose-600 font-sans text-sm tracking-wider uppercase">Kundernes historier</span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mt-2">Oprigtige Ord Fra Vores Kunder</h2>
            <div className="w-20 h-1 bg-rose-200 mx-auto mt-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mt-6 font-sans">Betydningen af en MemoryBear, med vores kunders egne ord.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-lg shadow-lg p-8 md:p-12 overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-100 rounded-full opacity-20"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100 rounded-full opacity-20"></div>

              <div className="relative z-10">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 rounded-full overflow-hidden relative mb-4 ring-4 ring-rose-100">
                    <Image
                      src={testimonials[testimonialIndex].image}
                      alt={testimonials[testimonialIndex].name}
                      fill
                      style={{ objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p className="font-serif text-xl text-gray-800">{testimonials[testimonialIndex].name}</p>
                    <p className="text-gray-500 text-sm font-sans">{testimonials[testimonialIndex].location}</p>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  {Array(5).fill(0).map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <div className="mb-8">
                  <svg className="h-10 w-10 text-rose-200 mx-auto mb-4" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 8c-2.2 0-4 1.8-4 4v10c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4V12c0-2.2-1.8-4-4-4H10zm0 2h12c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2zm1 1c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zm3 0c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zm-4 4v6h14v-6H10zm0 8v2h2v-2h-2zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z" />
                  </svg>
                  <p className="text-gray-700 font-serif italic text-xl md:text-2xl leading-relaxed">"{testimonials[testimonialIndex].quote}"</p>
                </div>

                <div className="flex justify-center space-x-2">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestimonialIndex(idx)}
                      className={`w-3 h-3 rounded-full ${testimonialIndex === idx ? 'bg-rose-500' : 'bg-rose-200'}`}
                      aria-label={`View testimonial ${idx + 1}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
      {/* Call to Action */}
      {/* <section className="py-24 bg-gradient-to-r from-rose-400 to-rose-600 text-white">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-6">Begin Your MemoryBear Journey</h2>
          <p className="text-xl font-light opacity-90 mb-10 max-w-3xl mx-auto font-sans">Transform cherished fabrics into a keepsake that preserves your most precious memories in a form you can hold close for years to come.</p>
          <Link
            href="/customize"
            className="px-10 py-4 bg-white text-rose-600 font-sans font-normal rounded-md hover:bg-gray-100 transition duration-300 ease-in-out inline-block shadow-md hover:shadow-lg"
          >
            Start Creating Your MemoryBear
          </Link>
        </div>
      </section> */}

      {/* Fabric Selection Guide */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-rose-600 font-sans text-sm tracking-wider uppercase">Expert guidance</span>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-800 mt-2 mb-6">Choosing Your Fabric With Care</h2>
              <p className="text-gray-600 font-sans mb-8">Selecting the right materials is an important part of your MemoryBear journey. Here's what works best to create a meaningful keepsake:</p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-serif mb-1">Meaningful Selection</p>
                    <p className="text-gray-600 font-sans">Choose 2-3 fabric pieces that hold special meaning (clothing, blankets, etc.) with stories and memories attached.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-serif mb-1">Durable Fabrics</p>
                    <p className="text-gray-600 font-sans">Clothing with minimal stretch works best—cotton, flannel, denim, and woven fabrics create the most lasting keepsakes.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-serif mb-1">Preserve Special Details</p>
                    <p className="text-gray-600 font-sans">Let us know about pockets, buttons, embroidery, or monograms you'd like preserved in your bear's design.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-serif mb-1">Share Your Story</p>
                    <p className="text-gray-600 font-sans">Include a note about why these fabrics are meaningful to you—this helps our artisans understand the emotional significance.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/fabric-guide"
                  className="text-rose-600 font-sans font-medium hover:text-rose-700 transition duration-300 flex items-center"
                >
                  View our complete fabric guide
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-md overflow-hidden h-64 shadow-md relative group">
                <Image
                  src="/images/1.png"
                  alt="Clothing fabric for memory bears"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="font-serif text-white">Clothing</p>
                </div>
              </div>
              <div className="rounded-md overflow-hidden h-64 shadow-md relative group">
                <Image
                  src="/images/2.png"
                  alt="Accessories fabric for memory bears"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="font-serif text-white">Accessories</p>
                </div>
              </div>
              <div className="rounded-md overflow-hidden h-64 shadow-md relative group">
                <Image
                  src="/images/3.png"
                  alt="Textiles for memory bears"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="font-serif text-white">Textiles</p>
                </div>
              </div>
              <div className="rounded-md overflow-hidden h-64 shadow-md relative group">
                <Image
                  src="/images/4.png"
                  alt="Baby items for memory bears"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="font-serif text-white">Baby Items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main></><Footer /></>
  );
}
