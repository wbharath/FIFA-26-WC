import { Calendar, Cpu, Users, Move, Star, Newspaper } from 'lucide-react'
import KickbaseLogo from '@/app/components/KickbaseLogo'
import EnterAppButton from '@/app/components/EnterAppButton'

const features = [
  {
    icon: Calendar,
    name: 'Live Fixtures',
    description: 'Browse all 72 matches by date, group, round or team.'
  },
  {
    icon: Cpu,
    name: 'AI Predictions',
    description: 'ML model trained on 852 WC matches with 73% accuracy.'
  },
  {
    icon: Users,
    name: 'Community',
    description: 'Fan predictions, aggregated XIs, win percentages.'
  },
  {
    icon: Move,
    name: 'Tactical Board',
    description: 'Place and drag 22 players on a live pitch.'
  },
  {
    icon: Star,
    name: 'Player Ratings',
    description: 'Rate every player after each match, see community averages.'
  },
  {
    icon: Newspaper,
    name: 'Fan Sentiment',
    description: 'AI-powered pre-match buzz aggregated from news sources.'
  }
]

const pills = [
  'Live Fixtures',
  'AI Predictions',
  'Fan Community',
  'Tactical Board',
  'Player Ratings',
  'Fan Sentiment',
  'Squad Explorer',
  'Bracket Builder'
]

const steps = [
  {
    n: '01',
    title: 'Sign Up',
    desc: 'Pick your favourite team and set up your profile in seconds.'
  },
  {
    n: '02',
    title: 'Follow the Tournament',
    desc: 'Predict matches, rate players, and track every fixture live.'
  },
  {
    n: '03',
    title: 'Compete',
    desc: 'See how your predictions stack up against the global fan community.'
  }
]

const techStack = [
  'Next.js',
  'Supabase',
  'Claude API',
  'api-football',
  'Python / scikit-learn',
  'Vercel'
]

function Wordmark({ textSize = 'text-xl' }: { textSize?: string }) {
  return (
    <span className={`font-bebas ${textSize} tracking-[0.15em] text-white`}>
      KICK<span style={{ color: '#E8002D' }}>BASE</span>
    </span>
  )
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: 'var(--inter)' }}
    >
      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KickbaseLogo size={36} />
            <Wordmark />
          </div>
          <EnterAppButton />
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">
        {/* Red gradient glow — top-left */}
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: 700,
            height: 700,
            background:
              'radial-gradient(circle, rgba(232,0,45,0.12) 0%, transparent 70%)',
            transform: 'translate(-30%, -30%)'
          }}
        />

        <div className="relative z-10 max-w-4xl w-full text-center">
          <p className="text-[#A0A0A0] text-xs font-semibold uppercase tracking-[0.3em] mb-6">
            FIFA World Cup 2026
          </p>

          <h1
            className="font-bebas uppercase leading-none mb-6"
            style={{ fontSize: 'clamp(3.5rem, 11vw, 8.5rem)' }}
          >
            Your World Cup <span style={{ color: '#E8002D' }}>2026 HQ</span>
          </h1>

          <p className="text-[#A0A0A0] text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Predictions, tactics, community — everything a football fan needs
            for the biggest tournament on earth.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <EnterAppButton
              label="Get Started →"
              className="bg-[#E8002D] text-white px-8 py-3.5 rounded font-semibold tracking-wide hover:brightness-110 transition-all duration-150"
            />
            <a
              href="https://github.com/wbharath"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#2A2A2A] text-white px-8 py-3.5 rounded font-semibold tracking-wide hover:border-[#3A3A3A] hover:bg-[#141414] transition-all duration-150"
            >
              View on GitHub
            </a>
          </div>

          {/* Marquee pills */}
          <div className="relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, #0A0A0A, transparent)'
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, #0A0A0A, transparent)'
              }}
            />
            <div className="flex animate-marquee whitespace-nowrap gap-3">
              {[...pills, ...pills].map((pill, i) => (
                <span
                  key={i}
                  className="inline-block bg-[#141414] border border-[#2A2A2A] text-[#A0A0A0] text-sm px-4 py-1.5 rounded-full shrink-0"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-bebas text-5xl text-center tracking-wide mb-16">
            Everything in one place
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, name, description }) => (
              <div
                key={name}
                className="group bg-[#141414] border border-[#2A2A2A] rounded-xl p-6
                           hover:border-[#E8002D] hover:-translate-y-1
                           transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-[#1E1E1E] group-hover:bg-[#E8002D]/10 transition-colors duration-200">
                  <Icon size={20} className="text-[#E8002D]" />
                </div>
                <h3 className="font-bebas text-2xl tracking-wide mb-2">
                  {name}
                </h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[#2A2A2A]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bebas text-5xl text-center tracking-wide mb-16">
            Built for fans, by a fan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative text-center">
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-6 h-px bg-[#2A2A2A]"
                    style={{ left: 'calc(50% + 2.5rem)', right: '-50%' }}
                  />
                )}
                <div
                  className="inline-flex items-center justify-center rounded-full border border-[#E8002D] text-[#E8002D] font-bebas mb-4"
                  style={{ width: 48, height: 48, fontSize: 18 }}
                >
                  {n}
                </div>
                <h3 className="font-bebas text-2xl tracking-wide mb-2">
                  {title}
                </h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed max-w-xs mx-auto">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[#2A2A2A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bebas text-5xl tracking-wide mb-16">
            Built with
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-[#5A5A5A] text-sm font-semibold tracking-wide
                           hover:text-white transition-colors duration-150 cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#2A2A2A] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <KickbaseLogo size={28} />
            <Wordmark textSize="text-lg" />
          </div>
          <p className="text-[#5A5A5A] text-sm">
            Built by Bharadwaj Racharla for WC 2026
          </p>
          <a
            href="https://github.com/wbharath"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5A5A5A] text-sm hover:text-white transition-colors duration-150"
          >
            GitHub →
          </a>
        </div>
      </footer>
    </div>
  )
}
