import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <main className="flex-1">
        {/* Header */}
        <Header />
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden grid-bg">
          <div className="max-w-container-max mx-auto px-8 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-primary font-semibold text-[11px] uppercase tracking-wider mb-6 border border-primary/10">
              <span className="material-symbols-outlined text-[14px] fill-current">bolt</span>
              NEXT GEN INTERVIEW PREP
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold max-w-4xl mb-6 tracking-tight leading-tight">
              Your AI Interviewer That <span className="text-primary">Actually Remembers You.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
              Practice interviews with an AI that remembers your mistakes, tracks your growth, and prepares you for your dream company.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-[14px] font-semibold text-base shadow-lg shadow-primary/20 hover:bg-[#4338CA] transition-all active:scale-98 cursor-pointer">
                    Start Free
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link href={ROUTES.onboarding}>
                  <button className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-[14px] font-semibold text-base shadow-lg shadow-primary/20 hover:bg-[#4338CA] transition-all active:scale-98 cursor-pointer">
                    Continue Setup
                  </button>
                </Link>
              </Show>
              <Link href={ROUTES.dashboard}>
                <button className="w-full sm:w-auto bg-white border border-outline-variant text-on-surface px-8 py-4 rounded-[14px] font-semibold text-base hover:bg-surface-container transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined">dashboard</span> Open Dashboard
                </button>
              </Link>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative w-full max-w-5xl mx-auto">
              <div className="bg-white border border-outline-variant rounded-[20px] shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 text-left">
                {/* Left: Sidebar/Stats */}
                <div className="w-full md:w-1/3 space-y-6">
                  <div className="p-6 rounded-[20px] bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">CURRENT READINESS</p>
                    <div className="flex items-end gap-2">
                      <span className="text-[48px] font-extrabold text-primary leading-none">85</span>
                      <span className="text-on-surface-variant font-medium pb-2">/ 100</span>
                    </div>
                    <div className="mt-4 h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[85%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-6 rounded-[20px] bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">WEAK TOPICS</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Dynamic Programming</span>
                        <span className="text-error font-semibold">Low</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">System Design</span>
                        <span className="text-secondary font-semibold">Improving</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Memory Timeline */}
                <div className="w-full md:w-2/3">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Memory Timeline</h3>
                    <div className="flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <div className="h-2 w-2 rounded-full bg-outline-variant"></div>
                      <div className="h-2 w-2 rounded-full bg-outline-variant"></div>
                    </div>
                  </div>

                  <div className="space-y-6 relative pl-6 border-l border-outline-variant/30">
                    <div className="relative z-10 flex gap-4 bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">history</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Mock Interview #14</p>
                        <p className="text-sm text-on-surface-variant">Struggled with Dijkstra&apos;s complexity explanation. System noted for revisit.</p>
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-4 bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm opacity-70">
                      <div className="h-8 w-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Revisiting Memory Node</p>
                        <p className="text-sm text-on-surface-variant">Generated 3 follow-up questions focused on Graph Edge Cases.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 hidden lg:block bg-white border border-outline-variant/30 p-4 rounded-[20px] shadow-xl hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="material-symbols-outlined fill-current">verified_user</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">AI SCORE CARD</p>
                    <p className="font-bold text-sm text-on-surface">94% Confidence</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -left-10 hidden lg:block bg-white border border-outline-variant p-4 rounded-[20px] shadow-xl hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-[10px]">SUCCESS</div>
                  <p className="font-semibold text-sm">Improvement Badge</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 border-y border-outline-variant/20 bg-white">
          <div className="max-w-container-max mx-auto px-8 text-center">
            <p className="text-[11px] font-bold text-on-surface-variant mb-10 tracking-widest uppercase">TRUSTED BY ASPIRING DEVELOPERS AND JOB SEEKERS</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale">
              <img alt="Google" className="h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIABCSPUqu7C-YepeP8wSNUunHw88DHtDZq_ZnM96p0Y4B5ZHgBCYsON_scylABswUSec2iSqAItuX5xNNSLVZbWo-SKoSGfYTgDjs2d8OiGBYMcj7GcivbudyGPeaogyRTPXioZUL4yraK8-JQiI8R2blEsUbo5GyhlzMOppa9UXfcJxKQjpvopSIiXhZTgy-S9JmqWbXT6GbLJkt_OLXi-fd9l_3tuaRLlmFzuhLrT9s7f-KIxvWj2D5UW37gYzzVa_3H8FXPJfi"/>
              <img alt="JOB" className="h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACB3CrIJDzQwONCI438mpwr0hNqYOBimwEoTBJqVFzwxwtgJbYE9fAmFwHVVpopCjdzG3pPWTBXyufV_Ll8VUwb4wJZ4UJ_wpTlz2vLu7j27zI3nOon5IMM2S4SzHHylAIIvlftm-TcfxtgSCQzTdZvZNDZpz5Nq4Xb8PD8CehhbYkF3cpgi2Bd_xNFtKqfwOXGK2mhDfLHWC4LPjmrGu5KDugDuqnIUuKWMUGx9uBogKxsYn29vMM9ZImWd14Gf_76Qjh2QFe969_"/>
              <img alt="Microsoft" className="h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcddI634_hKR2E76sL49lBFvzc39NKMxqvUOLz07mjmkBxTa3vrPCrzG3NWVbVBFcFSvzy_Y98HrmT_C4lHLGTTpDel8P2L7-dKOnk2PuRlVQ9YYc_W1LKpsMu1fcfPxSRoJuK1xEd3xRy4UUqm-rBj7FGveSqVIUSxp_nwWmDfGzfPgmqMPkJMebR9x7SCDhU8CSPgtJsi2TDmqeT4twHKtx1IsBtIF2EqUGyY4NtVMW12C18WrJOt9IEUoYgCGBscdaRLoME5PDV"/>
              <img alt="Uber" className="h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsmQZu6y5g1XcNp0JP8kE1ZuIutrU_9MaKWCoF0BydTDXbaZrPWGwDPW4ffO2AL4nFmlWBb9dG0nMhHwFoe6oeVeI7Xhc7n4H7w41YRR44nZOcsqABXyrJQPkNhBopsWBprYyV6uZ5gSVw7nsUKQyr1tWBLUZ1_li8hlZawLSwKVO5NDsssk14J9rGYncQLDRHFz2DGS7VirG6kecOB2jj955_s8D_xN-RAtFJ_VFsQutIiSTowOd_anFAkFxbCVZaQU4fMEHnS7Ip"/>
              <img alt="Atlassian" className="h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJGSZzICjLbR5x9RvTDH_7yEY6zM02ZmEFSVhLruzwjOXqfJHMwWHNxK9lIViVPP-wxc6zngnX0YgYlqKhpbIPi2jabU-FdY3qp5extrE2GFM5ihHRpcPstPwLO8HFBr5E60rAvCpU7xgDZGkPgjamufK5Xc-jfetXxhVPq-8iZp741oF6r_tdnZnGyZZWduyY3Wi4123m982DA4_VR7-qmYgosd8LxovDFz5PpKCAIeGRPbLBpzMsSJNlDHZUzpibxKt9q24a6LtE"/>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-32 bg-surface" id="features">
          <div className="max-w-container-max mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Precision-engineered features.</h2>
              <p className="text-lg text-on-surface-variant font-medium">Built for those who take their career growth seriously.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-[20px] border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">mic</span>
                </div>
                <h3 className="text-xl font-bold mb-3">AI Mock Interviews</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Realistic voice and text-based simulations tailored to your target role.</p>
              </div>
              {/* Card 2 */}
              <div className="bg-white p-8 rounded-[20px] border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Long-Term Memory</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">The AI tracks your historical answers and follows up on previous mistakes.</p>
              </div>
              {/* Card 3 */}
              <div className="bg-white p-8 rounded-[20px] border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-tertiary-fixed-dim/30 text-tertiary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Personalized Feedback</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Granular analysis on body language, technical accuracy, and tone.</p>
              </div>
              {/* Card 4 */}
              <div className="bg-white p-8 rounded-[20px] border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">query_stats</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Visualize your improvement over weeks with detailed readiness heatmaps.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-white" id="how-it-works">
          <div className="max-w-container-max mx-auto px-8">
            <div className="flex flex-col md:flex-row gap-20 items-center">
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-8">The simple road to mastery.</h2>
                <div className="space-y-12">
                  <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">1</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Upload Resume</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">Our AI parses your experience to create highly relevant company-specific interview scenarios.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Take AI Interviews</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">Engage in dynamic conversations. The AI adjusts difficulty in real-time based on your responses.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Receive Memory Feedback</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">Get deep insights that bridge your current performance with your historical weak points.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-surface-container p-8 rounded-[24px] border border-outline-variant relative overflow-hidden">
                  <div className="absolute inset-0 grid-bg opacity-30"></div>
                  <div className="relative space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30 animate-pulse">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="h-2 w-24 bg-surface-variant rounded"></div>
                      </div>
                      <div className="h-3 w-full bg-surface-variant/50 rounded"></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30 translate-x-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <div className="h-2 w-32 bg-primary/20 rounded"></div>
                      </div>
                      <div className="h-3 w-4/5 bg-surface-variant/50 rounded"></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-secondary"></div>
                        <div className="h-2 w-20 bg-surface-variant rounded"></div>
                      </div>
                      <div className="h-3 w-full bg-surface-variant/50 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memory Showcase */}
        <section className="py-32 bg-surface overflow-hidden" id="memory">
          <div className="max-w-container-max mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Your interview history becomes your advantage.</h2>
              <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">We don&apos;t just record sessions; we build a knowledge graph of your professional growth.</p>
            </div>
            <div className="relative bg-white border border-outline-variant rounded-[32px] p-12 overflow-hidden flex items-center justify-center">
              {/* Conceptual Graph Nodes */}
              <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-white border-2 border-outline-variant flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  </div>
                  <span className="font-semibold text-sm">User</span>
                </div>
                <div className="h-[2px] w-12 bg-outline-variant/50 hidden md:block"></div>
                <div className="bg-error-container text-on-error-container px-6 py-3 rounded-full font-semibold shadow-sm animate-bounce">
                  Weak in DP
                </div>
                <div className="h-[2px] w-12 bg-outline-variant/50 hidden md:block"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-surface-container-highest px-6 py-4 rounded-2xl border border-outline-variant/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-wider">PRACTICED</span>
                    <span className="text-xl font-extrabold">6 TIMES</span>
                  </div>
                </div>
                <div className="h-[2px] w-12 bg-outline-variant/50 hidden md:block"></div>
                <div className="bg-primary text-white px-8 py-4 rounded-[20px] font-bold shadow-xl shadow-primary/20 flex flex-col items-center">
                  <span className="material-symbols-outlined text-white mb-1">trending_up</span>
                  READY FOR JOB
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Showcase */}
        <section className="py-32 bg-white">
          <div className="max-w-container-max mx-auto px-8">
            <h2 className="text-3xl font-extrabold mb-16 text-center">Intelligence in every metric.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tech Score */}
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center text-center">
                <p className="text-[11px] font-bold text-on-surface-variant mb-6 uppercase tracking-wider">TECHNICAL SCORE</p>
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle className="text-surface-container" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="12"></circle>
                    <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="91.1" strokeWidth="12"></circle>
                  </svg>
                  <span className="absolute text-2xl font-extrabold text-on-surface">75%</span>
                </div>
              </div>
              {/* Comm Score */}
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                <p className="text-[11px] font-bold text-on-surface-variant mb-8 uppercase tracking-wider">COMMUNICATION</p>
                <div className="space-y-4">
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[90%] rounded-full"></div>
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary/60 w-[65%] rounded-full"></div>
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary/30 w-[40%] rounded-full"></div>
                  </div>
                </div>
              </div>
              {/* Confidence Trend */}
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                <p className="text-[11px] font-bold text-on-surface-variant mb-6 uppercase tracking-wider">CONFIDENCE TREND</p>
                <div className="h-32 w-full flex items-end gap-2">
                  <div className="flex-1 bg-primary/20 h-[30%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/40 h-[50%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/60 h-[45%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/80 h-[70%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary h-[95%] rounded-t-lg"></div>
                </div>
              </div>
              {/* Streak */}
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col justify-center items-center text-center">
                <p className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">INTERVIEW STREAK</p>
                <span className="text-[64px] font-extrabold text-primary leading-none">12</span>
                <p className="font-semibold text-sm mt-2 text-on-surface">DAYS IN A ROW</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto bg-primary-fixed rounded-[32px] p-12 md:p-20 text-center border border-primary/10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Ready to crack your next interview?</h2>
            <p className="text-base md:text-lg text-on-primary-fixed-variant mb-10 max-w-[36rem] mx-auto leading-relaxed">
              Stop practicing blindly. Start building memory with the most advanced AI preparation tool.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-[#4338CA] transition-all shadow-xl shadow-primary/20 cursor-pointer">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full sm:w-auto bg-white/50 backdrop-blur-sm border border-primary/20 text-primary px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-white transition-all cursor-pointer">
                    Sign up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link href={ROUTES.interview}>
                  <button className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-[#4338CA] transition-all shadow-xl shadow-primary/20 cursor-pointer">
                    Start Interview
                  </button>
                </Link>
              </Show>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <button className="w-full bg-white/50 backdrop-blur-sm border border-primary/20 text-primary px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-white transition-all cursor-pointer">
                  Learn More
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant/20">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 max-w-container-max mx-auto gap-8">
          <div className="text-lg font-bold text-on-surface">Interview Memory Agent</div>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#">Contact Us</a>
          </div>
          <div className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase">
            © 2026 Interview Memory Agent. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
