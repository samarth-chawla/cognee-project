export default function CoreFeaturesSection() {
  return (
    <section className="relative py-xl overflow-hidden bg-surface text-on-surface">
      {/* Atmospheric Elements */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] glow-blob pointer-events-none"></div>
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] glow-blob pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-margin-desktop relative z-10">
        {/* Section Header */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center gap-xs px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-label-md mb-md">
            <span>✨ Why Clutchly feels different</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm tracking-tight max-w-2xl mx-auto">
            Everything you need to ace your interviews.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            From realistic voice conversations to long-term interview memory, Clutchly helps you improve with every practice session.
          </p>
        </div>

        {/* Feature 1: Voice (Text Left, Visual Right) */}
        <div className="grid md:grid-cols-2 items-center gap-xl mb-xl">
          <div className="space-y-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined icon-fill text-headline-sm">waves</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Full-Duplex Voice Conversations</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Talk naturally with an AI interviewer that listens, speaks, and handles interruptions just like a real person. No awkward push-to-talk delays.
            </p>
          </div>
          
          <div className="relative group">
            <div className="bg-surface-container-lowest rounded-[22px] border border-outline-variant p-xs premium-shadow overflow-hidden">
              {/* Browser Mockup */}
              <div className="bg-surface-container rounded-[14px] overflow-hidden">
                <div className="h-10 bg-surface-container-high flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-error/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary-container/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
                  </div>
                </div>
                
                <div className="p-lg space-y-md min-h-[300px] flex flex-col justify-center">
                  {/* AI State */}
                  <div className="flex items-start gap-md">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                    <div className="bg-primary/5 rounded-2xl p-md border border-primary/10 max-w-[80%]">
                      <p className="font-body-md text-body-md text-on-surface">"Tell me about a time you handled a difficult technical challenge."</p>
                    </div>
                  </div>
                  
                  {/* User State */}
                  <div className="flex items-start gap-md flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant max-w-[80%]">
                      <p className="font-body-md text-body-md text-on-surface-variant">"I recently graduated and led a project where we had to..."</p>
                    </div>
                  </div>
                  
                  {/* Interactive Waveform Indicator */}
                  <div className="flex items-center justify-center gap-xs pt-md">
                    <div className="waveform-bar w-1 bg-primary rounded-full [animation-delay:0.1s]"></div>
                    <div className="waveform-bar w-1 bg-primary rounded-full [animation-delay:0.2s]"></div>
                    <div className="waveform-bar w-1 bg-primary rounded-full [animation-delay:0.3s]"></div>
                    <div className="waveform-bar w-1 bg-primary rounded-full [animation-delay:0.4s]"></div>
                    <div className="waveform-bar w-1 bg-primary rounded-full [animation-delay:0.2s]"></div>
                    <div className="flex items-center gap-xs ml-4">
                      <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Listening</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Memory (Visual Left, Text Right) */}
        <div className="grid md:grid-cols-2 items-center gap-xl mb-xl">
          <div className="order-2 md:order-1 relative h-[400px]">
            {/* Interactive Memory Graph */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
              <path className="svg-dotted-path" d="M50,100 Q150,50 250,150 T350,250"></path>
              <circle className="pulse-glow" cx="50" cy="100" fill="#635BFF" r="6"></circle>
              <circle className="pulse-glow" cx="250" cy="150" fill="#635BFF" r="6"></circle>
              <circle className="pulse-glow" cx="350" cy="250" fill="#635BFF" r="6"></circle>
            </svg>
            
            {/* Floating Cards */}
            <div className="absolute top-[20%] left-[5%] p-4 bg-surface-container-lowest border border-outline-variant rounded-xl premium-shadow max-w-[180px] scale-90 md:scale-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-error"></div>
                <span className="font-label-sm text-label-sm">Interview #1</span>
              </div>
              <p className="font-body-md text-on-surface-variant leading-tight">Communication Weakness</p>
            </div>
            
            <div className="absolute top-[40%] right-[10%] p-4 bg-surface-container-lowest border border-outline-variant rounded-xl premium-shadow max-w-[180px] scale-95 md:scale-110">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="font-label-sm text-label-sm text-primary">Interview #4</span>
              </div>
              <p className="font-body-md text-on-surface-variant leading-tight">System Design Improvement</p>
            </div>
            
            <div className="absolute bottom-[15%] left-[20%] p-4 bg-surface-container-lowest border border-outline-variant rounded-xl premium-shadow max-w-[180px] scale-90">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="font-label-sm text-label-sm">Interview #7</span>
              </div>
              <p className="font-body-md text-on-surface-variant leading-tight">Confidence: Mastered</p>
            </div>
          </div>
          
          <div className="order-1 md:order-2 space-y-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined icon-fill text-headline-sm">psychology</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Long-Term Interview Memory</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              The AI remembers every interview and builds a personalized understanding of your strengths and weaknesses. It won't repeat same feedback, but tracks your growth over time.
            </p>
          </div>
        </div>

        {/* Feature 3: Targeted (Text Left, Visual Right) */}
        <div className="grid md:grid-cols-2 items-center gap-xl mb-xl">
          <div className="space-y-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined icon-fill text-headline-sm">target</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Hyper-Targeted Questions</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Upload your resume and job description to get questions tailored specifically to your goals. We cross-reference the company's tech stack with your actual experience.
            </p>
          </div>
          
          <div className="relative bg-surface-container-low p-md rounded-[22px] border border-outline-variant/30 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
              {/* Flow Diagram Visual */}
              <div className="absolute top-0 left-0 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl premium-shadow flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">description</span>
                <span className="font-label-md text-label-md">Resume</span>
              </div>
              <div className="absolute top-1/4 right-0 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl premium-shadow flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">work</span>
                <span className="font-label-md text-label-md">Job Post</span>
              </div>
              <div className="absolute bottom-1/4 left-0 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl premium-shadow flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">history</span>
                <span className="font-label-md text-label-md">Memory</span>
              </div>
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary premium-shadow animate-bounce">
                <span className="material-symbols-outlined text-headline-md">auto_awesome</span>
              </div>
              <div className="absolute bottom-0 right-0 p-4 bg-primary text-on-primary rounded-xl premium-shadow flex items-center gap-3 rotate-3">
                <span className="material-symbols-outlined">question_mark</span>
                <span className="font-label-md text-label-md italic">Next Question...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: Analytics (Visual Left, Text Right) */}
        <div className="grid md:grid-cols-2 items-center gap-xl">
          <div className="order-2 md:order-1">
            <div className="bg-surface-container-lowest rounded-[22px] border border-outline-variant p-md premium-shadow space-y-md">
              <div className="flex justify-between items-center pb-md border-b border-outline-variant/50">
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Interview Score</h4>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-label-md text-label-md">Session #12</span>
              </div>
              
              <div className="grid grid-cols-2 gap-md">
                {/* Score Ring */}
                <div className="flex flex-col items-center justify-center p-md bg-surface-container-low rounded-2xl text-center">
                  <div className="relative w-24 h-24 mb-sm">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-surface-container-high" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                      <circle className="text-primary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="30" strokeWidth="8"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-headline-md text-headline-md">88</span>
                    </div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">Overall Performance</span>
                </div>
                
                {/* Score Cards */}
                <div className="space-y-sm">
                  <div className="p-sm bg-surface-container-low rounded-xl flex items-center justify-between">
                    <span className="font-label-md text-on-surface-variant">Technical</span>
                    <span className="font-headline-sm text-primary">91%</span>
                  </div>
                  <div className="p-sm bg-surface-container-low rounded-xl flex items-center justify-between">
                    <span className="font-label-md text-on-surface-variant">Communication</span>
                    <span className="font-headline-sm text-secondary">84%</span>
                  </div>
                  <div className="p-sm bg-surface-container-low rounded-xl flex items-center justify-between">
                    <span className="font-label-md text-on-surface-variant">Readiness</span>
                    <span className="font-headline-sm text-primary">92%</span>
                  </div>
                </div>
              </div>
              
              {/* Sentiment Bar */}
              <div className="p-md bg-surface-container-high rounded-xl">
                <div className="flex justify-between mb-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Confidence Level</span>
                  <span className="font-label-sm text-label-sm font-bold">89/100</span>
                </div>
                <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[89%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2 space-y-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined icon-fill text-headline-sm">insights</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Actionable Analytics</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Receive deep insights into your interview performance and know exactly what to improve. We track sentiment, technical accuracy, and even speech filler counts.
            </p>
          </div>
        </div>

        {/* Bottom Highlight Callout */}
        <div className="mt-xl">
          <div className="bg-primary-container text-on-primary-container p-xl rounded-[32px] premium-shadow text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary-fixed-dim/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="relative z-10 space-y-md">
              <h3 className="font-headline-md text-headline-md max-w-2xl mx-auto leading-tight">
                One interview helps you prepare. Every interview after that helps the AI prepare for you.
              </h3>
              <button className="h-14 px-xl bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-sm mx-auto group">
                Start Practicing
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            {/* Decorative Particle Shapes */}
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full border border-on-primary-container/20 opacity-20"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full border border-on-primary-container/20 opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
