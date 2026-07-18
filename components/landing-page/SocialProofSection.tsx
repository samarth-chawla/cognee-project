'use client';

import React, { useEffect } from 'react';

export default function SocialProofSection() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, observerOptions);

    const targets = document.querySelectorAll('.animate-on-scroll');
    targets.forEach(el => observer.observe(el));

    return () => {
      targets.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <section className="relative w-full py-xl overflow-hidden bg-[#F8F8FA]">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/10 gradient-blur rounded-full opacity-50 -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 gradient-blur rounded-full opacity-50 -z-10"></div>
      <div className="absolute inset-0 dotted-path -z-20"></div>
      
      <div className="max-w-[1280px] mx-auto px-margin-desktop flex flex-col items-center">
        {/* Badge */}
        <div className="mb-md bg-surface-container-lowest border border-surface-variant px-sm py-2 rounded-full flex items-center gap-2 premium-shadow animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <span className="text-xs">✨</span>
          <span className="font-label-md text-label-md text-on-surface-variant">Trusted by aspiring engineers worldwide</span>
        </div>
        
        {/* Main Heading */}
        <h1 className="font-headline-lg text-headline-lg text-center max-w-3xl mb-xl">
          Trusted by candidates preparing for interviews at
        </h1>
        
        {/* Logos */}
        <div className="w-full flex flex-wrap justify-center items-center gap-xl md:gap-24 mb-xl grayscale opacity-50 mask-fade">
          <img 
            className="h-8 object-contain" 
            alt="Google" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwL04QXO5wZC5NLqKzIukD_Is3O1woE5WA4HkGzBrXfrlUb8ulyd58W3Hso61LHw5NhSXkguBed-tCpbjv7ncSGUAw1uv__ZAawkj9Zgp2SaPgUGGf5Ycl0___A0PkwgjIwR3lQLVJaItwxCBf2UXMx2EsMFDzGkRVPvIIBGkm8_MYG8_UvxWg34SgQfhAwBA5O7c8e9DlzKi-UTg6gn6qfTz6bPLTsGrR9hSXD2Y5LPe33O9H2VCbVmeeiGfUef-UyZGQ0-bXnz0"
          />
          <img 
            className="h-8 object-contain" 
            alt="Amazon" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAebF31Uf9bcD7-KUCDXfg1vA3YxMdv_iP3UpqeSQJTBwEVumu8mmGJ2cLnukkTyGCqSl6ucNHzV37AtRWBHXcvbMB5Syfcg3J30wwLVetrEgZ9RC1U8U4oTuW6QX76xVJgOe9ZpMzcfTp_aU8s4SBxih54MW9s2OWnZJFpQE9dHCslIiasOxnky8VwLN3TYGm6xD0HRxi-RIu6EeGoiuBopctRpE3zD7ZdIgCxhgmfHuYlTPSlzVWXyPjKfNuxUoGdCziTCKGNnmA"
          />
          <img 
            className="h-8 object-contain" 
            alt="Microsoft" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSbzPjUbQIN5Qb8LKjOfK4GfEHufJ5VQ18k6Oh-zAMMs_U9vwhVUVlp6ai_ztaJ7PJawri-izR4TtmF7HtOD5rOut2wVjfc0blUZ_HrSkWd1bx0K3LjkiDVJ4CYsYddX628_AVVjs_vXkvfLYbYtmmNFMWp9rqowmGLHdaWKy6VWKw6kVOEeiynIF7nyFFzd4RZFD2EcC5EQ74W9j93hzr-L423cw5EpyVinzZHNuW5hm-c6tXw_KRlCj3I3qGRn8I_4fE_kTotzg"
          />
          <img 
            className="h-8 object-contain" 
            alt="Meta" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6VkM4PC-hCiqd0HbW3udEoCizhl0bNWyIEnBYct-CvX3XeQkbFvyua8kPfACHCZ-FxopwnPLg7s2kKMDoVgUAbQa1C5DP_0zzdRucVgWYwF-QZYIqnwUQQav2ESJ__M9KKcYkTmHGVsnuOQdJDhvMEKxEbFovCoaSUdMOXQzClSYzXHzwMJ5LbxDpiKG-MnVb6PuiEMKpTvfdw3-w4fQaUxPM0047mIyM2boz5Z2MWVBW7sIllg8oE81UQcJFPztkmYm8e4Qv6dk"
          />
          <img 
            className="h-8 object-contain" 
            alt="Stripe" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRlQszEWBFYbDiWNSWZvxM2ZZpSP64LOVBdQgL_nMnoQGCnRXy6VGGUXiEOcL7EtKFRC2SNaHusUdgUjSMEkTo6YRY_tt3nKxog8PIBuewIE4kaSH26HG2yaWcqPsU2SCbLMBjwzpn_mbfgjspzml5fwOl7mNZujI7dAJms1m6xHhMfP90X5fivA2Y5cON5i7lVMnWo2byEW5CBMa9a5saf4bb6tmK3i-piczFdWQYP47T4wSXId1aNYaoecbR4H5wb22a_9X-Qe4"
          />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter w-full mb-xl">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-md border border-surface-variant premium-shadow-hover animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <div className="font-headline-lg text-headline-lg font-extrabold text-primary mb-1">10,000+</div>
            <div className="font-label-md text-label-md text-[#6B7280]">Questions Generated</div>
          </div>
          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-md border border-surface-variant premium-shadow-hover animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <div className="font-headline-lg text-headline-lg font-extrabold text-primary mb-1">5,000+</div>
            <div className="font-label-md text-label-md text-[#6B7280]">Mock Interviews</div>
          </div>
          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-md border border-surface-variant premium-shadow-hover animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <div className="font-headline-lg text-headline-lg font-extrabold text-primary mb-1">92%</div>
            <div className="font-label-md text-label-md text-[#6B7280]">Reported Confidence</div>
          </div>
          {/* Card 4 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-md border border-surface-variant premium-shadow-hover animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <div className="font-headline-lg text-headline-lg font-extrabold text-primary mb-1">4.9/5</div>
            <div className="font-label-md text-label-md text-[#6B7280]">Average Rating</div>
          </div>
        </div>
        
        {/* Trust Strip & Avatars */}
        <div className="flex flex-col items-center gap-sm mb-xl">
          <div className="flex -space-x-3 overflow-hidden">
            <img className="inline-block h-12 w-12 rounded-full ring-4 ring-surface object-cover" alt="User 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIrT4SO3fo_eWO4kbdoVD0MXxfIeyHSbLkjE_hw0RmKkQy4EEBUpmNGn84ancZyhiRzL6V_ovsmtf3y4gs_wSNvFa-EKB3F76YPGdz2X5fVspnifTFsZfbbOpqlusST1jhNWmXcdJWdk8C6P5v6RTg1nuYaIDQ-3H-564RzRjjcNYU6IzSwx3_TpSbKG5dke55z0nxBhDWveAhwYbIzWssXRlLj1uT_fklCIqqpTSma-6Nf0S5q00d83gOSRLrcB3iYuKK8NsbE0Y" />
            <img className="inline-block h-12 w-12 rounded-full ring-4 ring-surface object-cover" alt="User 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRycI0GTnYfjarE-jqpmV6wJ9PttNfbwuS3aWyg09CTTKrpvQiCuMg7V0jCt3FpzG06EAr41_grKnse1Ub5lxsMZ1IfO8yxCz6wsXhYXwt_fHq1_x14HqD4bsmLkowQeLpx_HsaAlHhzCR02o1ajoWdNFF2GTgYGNPAAMmYc1YKH6HJFRj5wqU3w0eUkMp9tzxB_r4Tnlnrv5qj9lEgG5dZbxttD2Zja9uy425K0gQujYuxQutbci9FPSCLJLVlCkvXAx8VNk2fhA" />
            <img className="inline-block h-12 w-12 rounded-full ring-4 ring-surface object-cover" alt="User 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1ciCpv8J6L036b7sVWpEuRoOrbmOHwku7F8Gv44XVNkH4RHEXTlUDKZtm9QOMtdpv7DzJZovzQtd9DzZmuFu8rUELnGGyxe1WiNev4Qwhe4Xcgk4_MSVaiD5UonjSwbwxBRxyJki903BQQtFQ8H4lVDXuNzWtCNy5_2tyYFNEfBBXwBcfPgPOqFRpxQ3zEKwO39iW2lQ62UQ93Tv7YIeJYWDyvA8YWJoRX_6GWYpobhx7hVweKxOsxm7r5CjSGdt_LR3IpJ_sCcQ" />
            <img className="inline-block h-12 w-12 rounded-full ring-4 ring-surface object-cover" alt="User 4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH0mo0yc8Wect5nG_Ls2Vi_r2JH2dVb1Mrc83u_nkxPUiqyp5ow88-t-N-7oh1UFQkTX5YQ4X5Y0WiZoDRL9kkC9JN9Ijc4Afgkbapb2-hWrTx3vpqaL1AWv2P_bJZSTrIOJ2dSsqlRqYF9pbDjwibdxzVJsmNSiwK7idRyeeYBn7Sl283s2luiMXzKqHCqOxzhAjwJ1GeAnklamrjKdGsmtKu-Dh41RhR_-TBwtHKG6C9Out1F6lxve_sFqZ0vFT1NDw4FUq02jM" />
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full ring-4 ring-surface bg-primary-container text-on-primary-container font-label-md text-label-md">+2k</div>
          </div>
          <div className="text-center">
            <p className="font-label-md text-label-md text-on-surface">Trusted by 2,000+ students and professionals</p>
            <p className="font-label-sm text-label-sm text-[#6B7280] mt-1 flex items-center justify-center gap-1">
              <span className="text-[#FFD700]">⭐⭐⭐⭐⭐</span> 4.9 from 1,000+ reviews
            </p>
          </div>
        </div>
        
        {/* Floating Testimonials Section */}
        <div className="relative w-full h-[320px] md:h-[200px] mb-lg mt-md">
          {/* Testimonial 1 */}
          <div className="absolute left-1/2 -translate-x-[200px] md:-translate-x-[400px] top-0 max-w-[280px] bg-surface-container-lowest p-sm rounded-xl border border-surface-variant -rotate-3 hover:rotate-0 transition-transform duration-500 cursor-default premium-shadow">
            <p className="font-body-md text-body-md italic text-on-surface-variant">"Finally found an interview platform that actually remembers my weaknesses."</p>
          </div>
          {/* Testimonial 2 */}
          <div className="absolute left-1/2 -translate-x-1/2 top-10 md:top-24 max-w-[280px] bg-surface-container-lowest p-sm rounded-xl border border-surface-variant rotate-2 hover:rotate-0 transition-transform duration-500 cursor-default z-10 premium-shadow">
            <p className="font-body-md text-body-md italic text-on-surface-variant">"The voice interviews feel surprisingly real."</p>
          </div>
          {/* Testimonial 3 */}
          <div className="absolute left-1/2 translate-x-[40px] md:translate-x-[120px] top-4 md:top-2 max-w-[280px] bg-surface-container-lowest p-sm rounded-xl border border-surface-variant -rotate-1 hover:rotate-0 transition-transform duration-500 cursor-default premium-shadow">
            <p className="font-body-md text-body-md italic text-on-surface-variant">"Got my Google internship after practicing here."</p>
          </div>
        </div>
        
        {/* Footer Text */}
        <p className="font-body-md text-body-md text-[#6B7280] text-center max-w-lg mb-xl">
          Built for students, graduates, and professionals preparing for their next big opportunity.
        </p>
      </div>
    </section>
  );
}
