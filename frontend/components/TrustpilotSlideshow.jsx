// components/TrustpilotSlideshow.jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function TrustpilotSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const slideTimerRef = useRef(null);
  
  // TrustPilot review data
  const reviews = [
    {
      name: "Emily Johnson",
      location: "Seattle, WA",
      date: "February 15, 2025",
      rating: 5,
      text: "The MemoryBear I received is absolutely beautiful. It was made from my late husband's favorite shirts and has brought so much comfort to me and our children. The attention to detail is remarkable.",
      avatar: "/images/reviewer-1.jpg",
    },
    {
      name: "Robert Williams",
      location: "Austin, TX",
      date: "January 27, 2025",
      rating: 5,
      text: "I ordered a MemoryBear for my mother with fabrics from my father's clothes after he passed. The craftsmanship is exceptional, and my mother cried tears of joy when she received it. A truly meaningful keepsake.",
      avatar: "/images/reviewer-2.jpg",
    },
    {
      name: "Sophia Martinez",
      location: "Chicago, IL",
      date: "March 3, 2025",
      rating: 5,
      text: "We created a MemoryBear for our daughter using her grandmother's handmade quilts. The attention to detail in preserving the quilt patterns and incorporating them into the bear is beyond what we expected.",
      avatar: "/images/reviewer-3.jpg",
    },
    {
      name: "James Taylor",
      location: "Denver, CO",
      date: "February 2, 2025",
      rating: 5,
      text: "The bear arrived much faster than I expected and was packaged beautifully. The quality is outstanding, and it's obvious that great care was taken to honor the memories these fabrics hold.",
      avatar: "/images/reviewer-4.jpg",
    },
    {
      name: "Olivia Chen",
      location: "San Francisco, CA",
      date: "January 12, 2025",
      rating: 5,
      text: "My MemoryBear has become my most treasured possession. Made from my mom's favorite cardigan that I remember her wearing throughout my childhood. The team was responsive and thoughtful throughout the process.",
      avatar: "/images/reviewer-5.jpg",
    }
  ];
  
  // Auto-scroll through reviews
  useEffect(() => {
    const startTimer = () => {
      slideTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
      }, 5000);
    };
    
    if (!isHovering) {
      startTimer();
    }
    
    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
      }
    };
  }, [isHovering, reviews.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="mt-16 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center px-4 py-3 bg-[#00b67a] text-white">
        <div className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>
        <div className="font-bold text-lg">Trustpilot Reviews</div>
        <div className="ml-auto flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
      </div>

      <div 
        className="relative h-64 md:h-72"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {reviews.map((review, index) => (
            <div key={index} className="min-w-full h-full flex-shrink-0 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative">
                    <Image 
                      src={review.avatar} 
                      alt={review.name} 
                      fill
                      style={{objectFit: 'cover'}}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif text-gray-800 text-lg">{review.name}</h4>
                      <p className="text-sm text-gray-500">{review.location} • {review.date}</p>
                    </div>
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-[#00b67a]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm leading-relaxed overflow-hidden line-clamp-4">{review.text}</p>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <p>Posted on</p>
                      <svg className="w-4 h-4 ml-1 mr-0.5 text-[#00b67a]" viewBox="0 0 97 97" fill="currentColor">
                        <path d="M48.1,2C22.1,2,1.3,22.9,1.3,48.9c0,25.9,20.9,46.8,46.8,46.8s46.8-20.9,46.8-46.8c0-26-20.9-46.9-46.8-46.9 m29.6,65.8h-6v-21h-11v-5.6h16.9v26.6z M29.3,33.2h11.9c1.7,0,3.2,0.2,4.3,0.7 c1.2,0.5,2.2,1.1,2.9,1.8 c0.8,0.8,1.3,1.7,1.7,2.8 c0.4,1,0.5,2.1,0.5,3.3 c0,1.2-0.2,2.4-0.6,3.5 c-0.4,1.1-1,2-1.8,2.8 c-0.8,0.8-1.8,1.5-3,1.9 c-1.2,0.5-2.6,0.7-4.2,0.7h-5V61H29V33.2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[#00b67a]' : 'bg-gray-300'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Previous/Next buttons */}
        <button 
          className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition"
          onClick={() => setCurrentIndex((prevIndex) => (prevIndex === 0 ? reviews.length - 1 : prevIndex - 1))}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition"
          onClick={() => setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="px-6 py-4 flex items-center border-t border-gray-100">
        <div className="text-sm text-gray-500">Based on <span className="font-semibold">127 reviews</span></div>
        <a 
          href="https://www.trustpilot.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="ml-auto text-sm text-[#00b67a] hover:underline font-medium"
        >
          View more on Trustpilot →
        </a>
      </div>
    </div>
  );
}