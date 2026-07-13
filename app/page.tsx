import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/db/prisma";

const FEATURES = [
  {
    icon: "mic",
    title: "Realistic AI Voice Interviews",
    description:
      "Practice full voice conversations that feel like the real thing—not scripted chatbots.",
  },
  {
    icon: "psychology",
    title: "Persistent Interview Memory",
    description:
      "Every answer, mistake, and win is remembered. Your coach builds on your full history.",
  },
  {
    icon: "autorenew",
    title: "Personalized Follow-up Interviews",
    description:
      "Each session adapts to where you struggled last time and pushes you where it counts.",
  },
  {
    icon: "query_stats",
    title: "Performance Analytics",
    description:
      "Clear scores and trends across communication, technical depth, and confidence.",
  },
  {
    icon: "balance",
    title: "Strength & Weakness Tracking",
    description:
      "See what you own—and what still needs work—across topics, roles, and skills.",
  },
  {
    icon: "work",
    title: "Role-specific Interview Preparation",
    description:
      "Prepare for the role you want with questions tailored to level, stack, and company style.",
  },
  {
    icon: "description",
    title: "Resume + Job Description Personalization",
    description:
      "Upload your resume and target JD. Interviews map to your experience and the role.",
  },
  {
    icon: "timeline",
    title: "Progress Timeline",
    description:
      "A living record of every session—so you can see how far you've come.",
  },
  {
    icon: "rate_review",
    title: "Actionable Feedback",
    description:
      "Specific, coach-level notes you can act on immediately—not vague scores.",
  },
  {
    icon: "history",
    title: "Interview History",
    description:
      "Revisit past interviews, feedback, and patterns whenever you need them.",
  },
] as const;

export default async function Home() {
  const { userId: clerkId } = await auth();

  let setupDone = false;
  if (clerkId) {
    const profile = await prisma.userProfile.findFirst({
      where: {
        user: {
          clerkId: clerkId,
        },
      },
    });
    setupDone = !!profile;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <main className="flex-1">
        <Header />

        {/* Hero */}
        <section className="relative pt-20 pb-32 overflow-hidden grid-bg">
          <div className="max-w-container-max mx-auto px-8 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-primary font-semibold text-[11px] uppercase tracking-wider mb-6 border border-primary/10">
              <span className="material-symbols-outlined text-[14px] fill-current">
                memory
              </span>
              The AI Coach That Never Forgets
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold max-w-4xl mb-6 tracking-tight leading-[1.1]">
              Clutch every interview.
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
              Practice realistic voice interviews with an AI coach that
              remembers every conversation, adapts to your progress, and helps
              you land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              {!clerkId && (
                <SignUpButton mode="modal">
                  <button className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-[14px] font-semibold text-base shadow-lg shadow-primary/20 hover:bg-[#4338CA] transition-all active:scale-98 cursor-pointer">
                    Start Practicing
                  </button>
                </SignUpButton>
              )}
              {clerkId && !setupDone && (
                <Link href={ROUTES.onboarding}>
                  <button className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-[14px] font-semibold text-base shadow-lg shadow-primary/20 hover:bg-[#4338CA] transition-all active:scale-98 cursor-pointer">
                    Continue Setup
                  </button>
                </Link>
              )}
              {clerkId && setupDone && (
                <Link href={ROUTES.interview}>
                  <button className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-[14px] font-semibold text-base shadow-lg shadow-primary/20 hover:bg-[#4338CA] transition-all active:scale-98 cursor-pointer">
                    Start Practicing
                  </button>
                </Link>
              )}
              <a href="#how-it-works">
                <button className="w-full sm:w-auto bg-white border border-outline-variant text-on-surface px-8 py-4 rounded-[14px] font-semibold text-base hover:bg-surface-container transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined">play_circle</span>
                  Watch Demo
                </button>
              </a>
            </div>

            {/* Product mockup */}
            <div className="relative w-full max-w-5xl mx-auto">
              <div className="bg-white border border-outline-variant rounded-[20px] shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 text-left">
                <div className="w-full md:w-1/3 space-y-6">
                  <div className="p-6 rounded-[20px] bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Interview readiness
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-[48px] font-extrabold text-primary leading-none">
                        85
                      </span>
                      <span className="text-on-surface-variant font-medium pb-2">
                        / 100
                      </span>
                    </div>
                    <div className="mt-4 h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[85%] rounded-full" />
                    </div>
                  </div>
                  <div className="p-6 rounded-[20px] bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                      Focus areas
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Dynamic Programming</span>
                        <span className="text-error font-semibold">Needs work</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">System Design</span>
                        <span className="text-secondary font-semibold">
                          Improving
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Progress Timeline</h3>
                    <div className="flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="h-2 w-2 rounded-full bg-outline-variant" />
                      <div className="h-2 w-2 rounded-full bg-outline-variant" />
                    </div>
                  </div>

                  <div className="space-y-6 relative pl-6 border-l border-outline-variant/30">
                    <div className="relative z-10 flex gap-4 bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          history
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Interview #14</p>
                        <p className="text-sm text-on-surface-variant">
                          Struggled with Dijkstra&apos;s complexity. Saved for
                          the next session.
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-4 bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm opacity-70">
                      <div className="h-8 w-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          psychology
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          Personalized follow-up
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          Three new questions focused on graph edge cases.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 hidden lg:block bg-white border border-outline-variant/30 p-4 rounded-[20px] shadow-xl hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="material-symbols-outlined fill-current">
                      verified_user
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Confidence
                    </p>
                    <p className="font-bold text-sm text-on-surface">
                      Up 18% this month
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -left-10 hidden lg:block bg-white border border-outline-variant p-4 rounded-[20px] shadow-xl hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-[10px]">
                    MEMORY
                  </div>
                  <p className="font-semibold text-sm">Every interview counts</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product description */}
        <section className="py-24 md:py-32 bg-white border-y border-outline-variant/20">
          <div className="max-w-3xl mx-auto px-8 text-center">
            <p className="text-[11px] font-bold text-primary tracking-widest uppercase mb-6">
              Practice. Improve. Get Hired.
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-8 tracking-tight leading-tight">
              Not just another mock interview platform.
            </h2>
            <div className="space-y-5 text-lg text-on-surface-variant leading-relaxed">
              <p>
                Clutchly is your personal AI interview coach.
              </p>
              <p>
                Practice realistic voice interviews, receive detailed feedback,
                and build a long-term interview profile that grows with you.
              </p>
              <p>
                Clutchly remembers every answer, identifies recurring mistakes,
                tracks your progress over time, and creates personalized
                interviews that continuously challenge you where you need
                improvement.
              </p>
              <p className="text-on-surface font-semibold text-xl pt-2">
                Every interview makes the next one smarter.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-32 bg-surface" id="features">
          <div className="max-w-container-max mx-auto px-8">
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
                Everything you need to get hired.
              </h2>
              <p className="text-lg text-on-surface-variant font-medium">
                Voice practice, persistent memory, and feedback that compounds
                over time.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white p-7 rounded-[20px] border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-2 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-white" id="how-it-works">
          <div className="max-w-container-max mx-auto px-8">
            <div className="flex flex-col md:flex-row gap-20 items-center">
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight">
                  How Clutchly works.
                </h2>
                <div className="space-y-12">
                  <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">
                        Set your target
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        Add your resume and role. Clutchly shapes interviews
                        around your experience and the job you want.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">
                        Practice voice interviews
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        Speak like you would in a real interview. Get feedback
                        that&apos;s specific, honest, and actionable.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">
                        Improve with memory
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        Your coach remembers weak spots and revisits them. Every
                        session makes the next one more personal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-surface-container p-8 rounded-[24px] border border-outline-variant relative overflow-hidden">
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <div className="relative space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <p className="text-xs font-semibold text-on-surface-variant">
                          Live voice session
                        </p>
                      </div>
                      <p className="text-sm text-on-surface font-medium">
                        &ldquo;Tell me about a time you owned a hard production
                        incident.&rdquo;
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30 translate-x-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <p className="text-xs font-semibold text-primary">
                          Memory signal
                        </p>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        You under-explained root cause last time. Digging deeper
                        now.
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-secondary" />
                        <p className="text-xs font-semibold text-on-surface-variant">
                          Feedback ready
                        </p>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        Strong structure. Tighten the impact metrics next round.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memory differentiator */}
        <section className="py-32 bg-surface overflow-hidden" id="memory">
          <div className="max-w-container-max mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
                Persistent memory is the difference.
              </h2>
              <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
                Most platforms forget you the moment the session ends. Clutchly
                turns your interview history into a compounding advantage.
              </p>
            </div>
            <div className="relative bg-white border border-outline-variant rounded-[32px] p-12 overflow-hidden flex items-center justify-center">
              <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-white border-2 border-outline-variant flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      person
                    </span>
                  </div>
                  <span className="font-semibold text-sm">You</span>
                </div>
                <div className="h-[2px] w-12 bg-outline-variant/50 hidden md:block" />
                <div className="bg-error-container text-on-error-container px-6 py-3 rounded-full font-semibold shadow-sm">
                  Weak in system design
                </div>
                <div className="h-[2px] w-12 bg-outline-variant/50 hidden md:block" />
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-surface-container-highest px-6 py-4 rounded-2xl border border-outline-variant/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-wider">
                      PRACTICED
                    </span>
                    <span className="text-xl font-extrabold">6 TIMES</span>
                  </div>
                </div>
                <div className="h-[2px] w-12 bg-outline-variant/50 hidden md:block" />
                <div className="bg-primary text-white px-8 py-4 rounded-[20px] font-bold shadow-xl shadow-primary/20 flex flex-col items-center">
                  <span className="material-symbols-outlined text-white mb-1">
                    trending_up
                  </span>
                  Interview-ready
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics showcase */}
        <section className="py-32 bg-white">
          <div className="max-w-container-max mx-auto px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-center tracking-tight">
              Progress you can see.
            </h2>
            <p className="text-lg text-on-surface-variant text-center mb-16 w-full max-w-2xl mx-auto leading-relaxed">
              Track readiness, communication, and confidence — session after
              session.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center text-center">
                <p className="text-[11px] font-bold text-on-surface-variant mb-6 uppercase tracking-wider">
                  Technical score
                </p>
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      className="text-surface-container"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                    />
                    <circle
                      className="text-primary"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="58"
                      stroke="currentColor"
                      strokeDasharray="364.4"
                      strokeDashoffset="91.1"
                      strokeWidth="12"
                    />
                  </svg>
                  <span className="absolute text-2xl font-extrabold text-on-surface">
                    75%
                  </span>
                </div>
              </div>
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                <p className="text-[11px] font-bold text-on-surface-variant mb-8 uppercase tracking-wider">
                  Communication
                </p>
                <div className="space-y-4">
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[90%] rounded-full" />
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary/60 w-[65%] rounded-full" />
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary/30 w-[40%] rounded-full" />
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-[24px] border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                <p className="text-[11px] font-bold text-on-surface-variant mb-6 uppercase tracking-wider">
                  Confidence trend
                </p>
                <div className="h-32 w-full flex items-end gap-2">
                  <div className="flex-1 bg-primary/20 h-[30%] rounded-t-lg" />
                  <div className="flex-1 bg-primary/40 h-[50%] rounded-t-lg" />
                  <div className="flex-1 bg-primary/60 h-[45%] rounded-t-lg" />
                  <div className="flex-1 bg-primary/80 h-[70%] rounded-t-lg" />
                  <div className="flex-1 bg-primary h-[95%] rounded-t-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto bg-primary-fixed rounded-[32px] p-12 md:p-20 text-center border border-primary/10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">
              Ready to clutch your next interview?
            </h2>
            <p className="text-base md:text-lg text-on-primary-fixed-variant mb-10 max-w-[36rem] mx-auto leading-relaxed">
              Stop starting from zero every time. Build a coach that knows you—
              and gets better with every session.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!clerkId && (
                <>
                  <SignUpButton mode="modal">
                    <button className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-[#4338CA] transition-all shadow-xl shadow-primary/20 cursor-pointer">
                      Start Practicing
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="w-full sm:w-auto bg-white/50 backdrop-blur-sm border border-primary/20 text-primary px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-white transition-all cursor-pointer">
                      Sign in
                    </button>
                  </SignInButton>
                </>
              )}
              {clerkId && (
                <Link href={ROUTES.interview}>
                  <button className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-[#4338CA] transition-all shadow-xl shadow-primary/20 cursor-pointer">
                    Start Practicing
                  </button>
                </Link>
              )}
              <a href="#memory" className="w-full sm:w-auto">
                <button className="w-full bg-white/50 backdrop-blur-sm border border-primary/20 text-primary px-10 py-4 rounded-[14px] font-bold text-sm hover:bg-white transition-all cursor-pointer">
                  See how memory works
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
