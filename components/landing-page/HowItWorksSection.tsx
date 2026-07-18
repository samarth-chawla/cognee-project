'use client';

import React, { useEffect } from 'react';

export default function HowItWorksSection() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
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
    <section id="how-it-works" className="relative py-xl overflow-hidden bg-surface text-on-surface">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1280px] h-full pointer-events-none">
        {/* Central Line (Desktop Only) */}
        <div className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full timeline-gradient opacity-20"></div>
        {/* Purple Glowing Nodes */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] pulse-glow"></div>
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-80 h-80 bg-secondary/10 blur-[120px] pulse-glow [animation-delay:1s]"></div>
        <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] pulse-glow [animation-delay:2s]"></div>
      </div>
      
      <div className="container max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        {/* Header Section */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
            <span className="font-label-md text-primary tracking-wide">Four simple steps</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">How Clutchly works</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[600px] mx-auto">
            From your resume to personalized interview coaching in just a few minutes.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative space-y-24 md:space-y-32">
          {/* Step 1: Upload (Left text, Right visual) */}
          <div className="flex flex-col md:flex-row items-center gap-lg md:gap-xl">
            <div className="flex-1 order-2 md:order-1 text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <span className="font-headline-md text-primary opacity-30 block mb-base">01</span>
              <h3 className="font-headline-md text-headline-md mb-sm">Upload your Resume &amp; Job Description</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Our AI parses your background and the role requirements to generate high-fidelity, role-specific questions.</p>
            </div>
            
            <div className="flex-1 order-1 md:order-2 flex justify-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="relative w-full max-w-sm aspect-video bg-white rounded-xxl premium-shadow border border-outline-variant p-md flex items-center justify-center overflow-hidden">
                {/* Visual Asset 1 */}
                <div className="flex gap-4">
                  <div className="w-24 h-32 bg-surface-container rounded-lg border border-outline-variant flex flex-col p-3 shadow-sm transform -rotate-6">
                    <div className="w-1/2 h-2 bg-outline-variant rounded mb-2"></div>
                    <div className="w-full h-1 bg-outline-variant/50 rounded mb-1"></div>
                    <div className="w-full h-1 bg-outline-variant/50 rounded mb-1"></div>
                    <div className="w-3/4 h-1 bg-outline-variant/50 rounded"></div>
                    <div className="mt-auto flex justify-end">
                      <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                    </div>
                  </div>
                  <div className="w-24 h-32 bg-white rounded-lg border-2 border-primary border-dashed flex flex-col items-center justify-center p-3 shadow-md transform rotate-3 relative">
                    <span className="material-symbols-outlined text-primary mb-1">upload</span>
                    <div className="w-12 h-1 bg-primary/20 rounded"></div>
                    {/* Scanning line */}
                    <div className="absolute inset-x-0 top-1/4 h-[2px] bg-primary/50 animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Voice Interview (Right text, Left visual) */}
          <div className="flex flex-col md:flex-row items-center gap-lg md:gap-xl">
            <div className="flex-1 order-1 flex justify-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="relative w-full max-w-sm h-64 bg-on-background rounded-xxl premium-shadow p-lg flex flex-col items-center justify-center">
                <div className="mb-md">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-symbols-outlined icon-fill text-white">mic</span>
                    </div>
                  </div>
                </div>
                {/* Waveform */}
                <div className="flex items-end gap-1 h-12 mb-sm">
                  <div className="w-1 bg-primary/40 rounded-full animate-pulse"></div>
                  <div className="w-1 bg-primary/60 rounded-full h-8 animate-pulse [animation-duration:1.2s]"></div>
                  <div className="w-1 bg-primary rounded-full h-12 animate-pulse [animation-duration:0.8s]"></div>
                  <div className="w-1 bg-primary/80 rounded-full h-6 animate-pulse [animation-duration:1.4s]"></div>
                  <div className="w-1 bg-primary/40 rounded-full h-4 animate-pulse [animation-duration:1.1s]"></div>
                </div>
                <span className="font-label-md text-primary animate-pulse uppercase tracking-widest">Speaking</span>
              </div>
            </div>
            
            <div className="flex-1 order-2 text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <span className="font-headline-md text-primary opacity-30 block mb-base">02</span>
              <h3 className="font-headline-md text-headline-md mb-sm">Start a live voice interview</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Engage in natural conversations. Our AI listens to your nuance, pacing, and technical depth in real-time.</p>
            </div>
          </div>

          {/* Step 3: Feedback (Left text, Right visual) */}
          <div className="flex flex-col md:flex-row items-center gap-lg md:gap-xl">
            <div className="flex-1 order-2 md:order-1 text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <span className="font-headline-md text-primary opacity-30 block mb-base">03</span>
              <h3 className="font-headline-md text-headline-md mb-sm">Receive instant feedback</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Get a deep-dive analysis of your performance. We grade you on confidence, accuracy, and professional delivery.</p>
            </div>
            
            <div className="flex-1 order-1 md:order-2 flex justify-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="relative w-full max-w-sm grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xxl premium-shadow border border-outline-variant flex flex-col items-center">
                  <span className="font-label-sm text-on-surface-variant mb-2">Overall Score</span>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" fill="none" r="28" stroke="#ececec" strokeWidth="4"></circle>
                      <circle cx="32" cy="32" fill="none" r="28" stroke="#635BFF" strokeDasharray="175" strokeDashoffset="35" strokeWidth="4"></circle>
                    </svg>
                    <span className="absolute font-headline-sm text-primary">82</span>
                  </div>
                </div>
                
                <div className="bg-primary p-4 rounded-xxl shadow-lg text-white flex flex-col">
                  <span className="material-symbols-outlined mb-2">insights</span>
                  <span className="font-label-sm opacity-80">Tech Depth</span>
                  <span className="font-headline-sm">Excellent</span>
                </div>
                
                <div className="col-span-2 bg-white p-4 rounded-xxl premium-shadow border border-outline-variant flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-on-surface-variant">Communication</span>
                    <div className="w-32 h-2 bg-surface-container rounded-full mt-1">
                      <div className="w-[75%] h-full bg-secondary rounded-full"></div>
                    </div>
                  </div>
                  <span className="font-label-md text-secondary">75%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Improve (Right text, Left visual) */}
          <div className="flex flex-col md:flex-row items-center gap-lg md:gap-xl">
            <div className="flex-1 order-1 flex justify-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="relative w-full max-w-sm bg-white rounded-xxl premium-shadow border border-outline-variant p-md overflow-hidden">
                <div className="relative h-40">
                  {/* Memory Path Curve */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 150">
                    <path d="M 50,120 Q 150,120 200,75 T 350,30" fill="none" stroke="#635BFF" strokeDasharray="8,8" strokeWidth="3"></path>
                    {/* Points */}
                    <circle cx="50" cy="120" fill="#c3c0ff" r="6"></circle>
                    <circle cx="200" cy="75" fill="#8c80ff" r="6"></circle>
                    <circle className="animate-pulse" cx="350" cy="30" fill="#635BFF" r="10"></circle>
                  </svg>
                  {/* Labels */}
                  <div className="absolute bottom-2 left-4 px-2 py-1 bg-surface-container rounded-lg text-[10px] font-bold">Interview #1</div>
                  <div className="absolute top-2 right-4 px-3 py-1 bg-primary rounded-lg text-[10px] font-bold text-white shadow-md">READY FOR HIRE</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 order-2 text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <span className="font-headline-md text-primary opacity-30 block mb-base">04</span>
              <h3 className="font-headline-md text-headline-md mb-sm">Improve with every interview</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Our "Memory Path" tracks your growth across sessions, focusing on your weak spots until they become strengths.</p>
            </div>
          </div>
        </div>

        {/* Bottom Callout Card */}
        <div className="mt-xl">
          <div className="bg-white rounded-xxl border border-outline-variant premium-shadow p-lg md:p-xl flex flex-col md:flex-row items-center justify-between gap-lg relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#635BFF_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            <div className="relative z-10 max-w-2xl text-center md:text-left">
              <h4 className="font-headline-md text-headline-md mb-sm">
                Your first interview teaches you. <br className="hidden md:block"/>
                <span className="text-primary">Every interview after that teaches Clutchly.</span>
              </h4>
            </div>
            <div className="relative z-10">
              <button className="bg-primary text-white px-xl py-4 rounded-full font-label-md text-label-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-200 premium-shadow">
                Start Your First Interview
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
