'use client';

import React, { useEffect } from 'react';

export default function InteractiveDemoSection() {
  useEffect(() => {
    // Waveform oscillation animation
    const interval = setInterval(() => {
      const bars = document.querySelectorAll<HTMLDivElement>('.waveform-bar-bounce');
      bars.forEach(bar => {
        const randomHeight = Math.floor(Math.random() * 20) + 8;
        bar.style.height = `${randomHeight}px`;
      });
    }, 150);

    // Subtle parallax effect on floating cards
    const handleMouseMove = (e: MouseEvent) => {
      const amount = 20;
      const x = (e.clientX / window.innerWidth - 0.5) * amount;
      const y = (e.clientY / window.innerHeight - 0.5) * amount;
      
      const cards = document.querySelectorAll<HTMLDivElement>('.glass-card-parallax');
      cards.forEach((card, index) => {
        const factor = (index + 1) * 0.5;
        const baseRot = card.getAttribute('data-rot') || '0deg';
        card.style.transform = `translate(${x * factor}px, ${y * factor}px) rotate(${baseRot})`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <main className="relative min-h-screen py-xl px-margin-mobile md:px-margin-desktop overflow-hidden bg-surface text-on-surface">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary rounded-full floating-blob animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary rounded-full floating-blob animate-pulse [animation-duration:8s]"></div>
      
      {/* Dotted Curved Lines (SVG) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" fill="none" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100 600C200 400 600 800 1380 200" stroke="#635BFF" strokeDasharray="8 12" strokeWidth="2"></path>
          <path d="M-200 200C300 500 800 100 1480 600" stroke="#584AC9" strokeDasharray="8 12" strokeWidth="2"></path>
        </svg>
      </div>
      
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-xl relative z-10">
        <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-primary/10 text-primary font-label-md text-label-md mb-md border border-primary/20">
          🎙️ Experience it yourself
        </span>
        <h1 className="font-headline-lg text-headline-lg md:text-headline-lg mb-md leading-tight">
          A mock interview that actually <span className="text-primary">feels real.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          No typing. No robotic chatbots. Just a natural voice conversation with an AI interviewer that listens, responds, and adapts in real time.
        </p>
      </div>

      {/* Main Demo Content */}
      <div className="max-w-max-width mx-auto relative z-20">
        {/* Grid Layout for Mockup and Floating Elements */}
        <div className="relative flex flex-col items-center">
          
          {/* Floating Feature Cards (Desktop Only / Absolute Positioned) */}
          <div className="hidden lg:block absolute -left-20 top-20 rotate-[-4deg] glass-card glass-card-parallax p-md rounded-[20px] premium-shadow w-64 hover:scale-105 transition-transform duration-500" data-rot="-4deg">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-xs rounded-lg">bolt</span>
              <h4 className="font-label-md text-label-md text-on-surface">Low Latency</h4>
            </div>
            <p className="font-body-md text-label-sm text-on-surface-variant">Sub-500ms response time for fluid, non-stop dialogue.</p>
          </div>
          
          <div className="hidden lg:block absolute -right-24 top-10 rotate-[6deg] glass-card glass-card-parallax p-md rounded-[20px] premium-shadow w-64 hover:scale-105 transition-transform duration-500" data-rot="6deg">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-xs rounded-lg">record_voice_over</span>
              <h4 className="font-label-md text-label-md text-on-surface">Natural Conversation</h4>
            </div>
            <p className="font-body-md text-label-sm text-on-surface-variant">AI that understands tone, intent, and subtle vocal nuances.</p>
          </div>
          
          <div className="hidden lg:block absolute -left-32 bottom-40 rotate-[2deg] glass-card glass-card-parallax p-md rounded-[20px] premium-shadow w-64 hover:scale-105 transition-transform duration-500" data-rot="2deg">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-xs rounded-lg">sync_problem</span>
              <h4 className="font-label-md text-label-md text-on-surface">Interrupt Anytime</h4>
            </div>
            <p className="font-body-md text-label-sm text-on-surface-variant">Just like real life, you can stop the AI mid-sentence to clarify.</p>
          </div>
          
          <div className="hidden lg:block absolute -right-16 bottom-20 rotate-[-3deg] glass-card glass-card-parallax p-md rounded-[20px] premium-shadow w-64 hover:scale-105 transition-transform duration-500" data-rot="-3deg">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-xs rounded-lg">track_changes</span>
              <h4 className="font-label-md text-label-md text-on-surface">Adaptive Follow-ups</h4>
            </div>
            <p className="font-body-md text-label-sm text-on-surface-variant">Dynamic questioning based on your specific previous answers.</p>
          </div>

          {/* Browser Mockup */}
          <div className="w-full max-w-4xl bg-surface-container-lowest rounded-[22px] border border-outline-variant/30 premium-shadow overflow-hidden relative group">
            {/* Browser Top Bar */}
            <div className="flex items-center justify-between px-md py-sm bg-surface-container-low border-b border-outline-variant/20">
              <div className="flex gap-xs">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-lg py-1 text-label-sm text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                clutchly.ai/demo/interview-room
              </div>
              <div className="flex gap-sm">
                <div className="px-sm py-1 rounded-full bg-primary/10 text-primary text-label-sm flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Connected
                </div>
              </div>
            </div>
            
            {/* Interface Body */}
            <div className="flex flex-col md:flex-row h-[500px]">
              {/* Conversation Main Area */}
              <div className="flex-1 p-xl flex flex-col items-center justify-center relative overflow-hidden">
                {/* AI Avatar Section */}
                <div className="relative mb-lg">
                  <div className="w-40 h-40 rounded-full border-4 border-primary/20 p-2 bg-background flex items-center justify-center overflow-hidden">
                    <img 
                      className="w-full h-full object-cover rounded-full" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcJdLZU6CaxQZHTZ16qIbzPTrH2jox7-Nq322H3H8kRRnyECMXpLNeT9iXs5STR8AJol8EWvRu6EAVDRhDyPOpIXNTOpYwBFM4WiflZwL2bZwkVRkhbkS7LqGPvOZbC-eXT2_i618lIjwJIL-gZq4OzpymO70uXDkFNKF9JQaBFfHkKvRBpMrIBhiNguBi-Ctn7Z0RPsTPzFk3enzFJqkxDSfvbfvOouuzuhDWC0WbkSHJWUkyC_5Z3qgaSjiifqtZLsiesEgjAaI"
                      alt="AI Avatar"
                    />
                  </div>
                  {/* Pulse Ring */}
                  <div className="absolute inset-0 rounded-full bg-primary/20 scale-110 animate-ping opacity-20"></div>
                </div>
                
                {/* Listening Status & Waveform */}
                <div className="text-center mb-xl">
                  <span className="font-label-md text-on-surface text-label-md tracking-wide uppercase opacity-70">Listening...</span>
                  <div className="flex items-end justify-center gap-1 h-8 mt-md">
                    <div className="waveform-bar-bounce w-1.5 h-[12px] bg-primary rounded-full [animation-delay:0.1s]"></div>
                    <div className="waveform-bar-bounce w-1.5 h-[20px] bg-primary/80 rounded-full [animation-delay:0.3s]"></div>
                    <div className="waveform-bar-bounce w-1.5 h-[28px] bg-primary rounded-full [animation-delay:0.2s]"></div>
                    <div className="waveform-bar-bounce w-1.5 h-[16px] bg-primary/60 rounded-full [animation-delay:0.4s]"></div>
                    <div className="waveform-bar-bounce w-1.5 h-[22px] bg-primary rounded-full [animation-delay:0.1s]"></div>
                    <div className="waveform-bar-bounce w-1.5 h-[12px] bg-primary/70 rounded-full [animation-delay:0.3s]"></div>
                  </div>
                </div>
                
                {/* Conversation Flow Overlay */}
                <div className="w-full max-w-md space-y-md">
                  <div className="flex gap-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="bg-surface-container-high rounded-2xl rounded-tl-none p-md font-body-md text-on-surface shadow-sm">
                      Interesting. How would you scale it for thousands of concurrent users?
                    </div>
                  </div>
                  <div className="flex flex-row-reverse gap-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <div className="bg-primary text-white rounded-2xl rounded-tr-none p-md font-body-md shadow-sm">
                      I would start by... 
                      <span className="inline-flex gap-1 ml-1 align-middle">
                        <span className="w-1.5 h-1.5 bg-white rounded-full typing-dot"></span>
                        <span className="w-1.5 h-1.5 bg-white rounded-full typing-dot"></span>
                        <span className="w-1.5 h-1.5 bg-white rounded-full typing-dot"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sidebar Analytics */}
              <div className="w-full md:w-80 bg-surface-container-low border-l border-outline-variant/20 p-md flex flex-col gap-md">
                <div className="glass-card p-md rounded-xl premium-shadow">
                  <div className="flex items-center justify-between mb-sm">
                    <h5 className="font-label-md text-label-md text-on-surface">Interview Progress</h5>
                    <span className="text-primary font-bold">7/10</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[70%] rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-sm">
                  <h6 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Real-time Metrics</h6>
                  <div className="flex items-center justify-between p-sm rounded-xl bg-white/50 border border-outline-variant/10">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary">forum</span>
                      <span className="font-label-md text-label-md text-on-surface">Communication</span>
                    </div>
                    <span className="font-bold text-on-surface">89%</span>
                  </div>
                  <div className="flex items-center justify-between p-sm rounded-xl bg-white/50 border border-outline-variant/10">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">psychology</span>
                      <span className="font-label-md text-label-md text-on-surface">Confidence</span>
                    </div>
                    <span className="font-bold text-on-surface">92%</span>
                  </div>
                  <div className="flex items-center justify-between p-sm rounded-xl bg-white/50 border border-outline-variant/10">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[#28C840]">code</span>
                      <span className="font-label-md text-label-md text-on-surface">Technical</span>
                    </div>
                    <span className="font-bold text-on-surface">91%</span>
                  </div>
                </div>
                
                {/* Controls at bottom */}
                <div className="mt-auto flex flex-col gap-sm items-center py-md border-t border-outline-variant/20">
                  <div className="text-on-surface-variant font-label-md text-label-md mb-xs">
                    Timer: <span className="text-on-surface font-mono">12:47</span>
                  </div>
                  <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg pulse-mic transition-transform hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined text-[32px]">mic</span>
                  </button>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Tap to end interview</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle Analytics Card Floating Nearby */}
          <div className="hidden xl:block absolute -right-12 bottom-1/2 translate-y-1/2 glass-card p-lg rounded-[22px] premium-shadow w-56 border-primary/20 border-2">
            <div className="text-center space-y-xs">
              <div className="text-headline-sm font-headline-sm text-primary">98%</div>
              <div className="font-label-md text-label-md text-on-surface">Match Accuracy</div>
              <div className="text-label-sm text-on-surface-variant">Our AI predicts hiring outcomes with clinical precision.</div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Bottom Callout Section */}
      <div className="mt-xl max-w-4xl mx-auto relative z-20">
        <div className="bg-primary-container p-xl md:p-xl rounded-[32px] text-center text-on-primary-container shadow-2xl relative overflow-hidden group">
          {/* Inner Pattern Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] opacity-50"></div>
          <h2 className="font-headline-md text-headline-md md:text-headline-lg mb-sm relative z-10">
            The closest thing to a real interview.
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary-container/80 mb-xl max-w-xl mx-auto relative z-10">
            Practice in a realistic environment before it actually matters. Gain confidence, refine your answers, and land your dream job.
          </p>
          <div className="relative z-10">
            <button className="bg-on-primary-container text-primary-container px-xl py-lg rounded-full font-headline-sm text-headline-sm hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center gap-sm mx-auto">
              Try a Demo Interview
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          {/* Abstract Circles in Callout */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        </div>
      </div>
    </main>
  );
}
