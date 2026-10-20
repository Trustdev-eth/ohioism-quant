"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import {
  Activity,
  BookOpen,
  Check,
  CirclePlay,
  FileText,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  Terminal,
  Video,
  Wallet,
} from "lucide-react";
import ProgramPreview from "@/components/landing/program-preview";
import Brand from "@/components/landing/brand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ASSIST_TELEGRAM, PLAN_PRICES_USD } from "@/lib/plans";
import { fetchMe, type PublicMember } from "@/lib/session-client";

const phases = [
  { title: "Start with the foundations", tag: "Foundation", summary: "Understand prediction markets, market structure, and the mindset behind a systematic approach.", topics: ["Market mechanics", "Research discipline", "Realistic expectations"] },
  { title: "Connect to the market", tag: "Connectivity & data", summary: "Learn how reliable data and connectivity support a trading system you can evaluate.", topics: ["Market data", "Data quality", "Infrastructure tradeoffs"] },
  { title: "Make better trading decisions", tag: "Pricing & signals", summary: "Study fair value, uncertainty, and the difference between an idea and a testable signal.", topics: ["Pricing concepts", "Signal evaluation", "Fees and realistic testing"] },
  { title: "Build an execution workflow", tag: "Execution & routing", summary: "Follow the order lifecycle and understand why execution changes your results.", topics: ["Order lifecycle", "Execution risk", "Deployment considerations"] },
  { title: "Bring it together as a market maker", tag: "Market making deep dive", summary: "Explore liquidity provision, inventory, and the responsibilities of running an automated system.", topics: ["Liquidity provision", "Inventory awareness", "Monitoring and risk controls"] },
];

const faqs = [
  ["What is the difference between Basic and Pro?", `Basic is the $${PLAN_PRICES_USD.basic} video course. Pro is $${PLAN_PRICES_USD.pro} and includes the same videos plus the course source code and lab materials. Both cover the market making and arbitrage tracks.`],
  ["Do I need coding experience?", "No. You do not need prior coding experience. AI can write the code while you learn the strategy, the market, and how the pieces fit together."],
  ["Can a good strategy make a profitable bot?", "Yes. A good strategy can make a profitable bot. Results still depend on execution, costs, and how you operate — but the edge starts with the strategy."],
  ["Are hosting, data feeds, and trading capital included?", "No. Infrastructure, third-party services, and trading capital are separate from the course price. The program discusses infrastructure choices; you purchase and operate any services you decide to use."],
  ["How does enrollment work?", "Create a free account, then pay with NOWPayments. When the invoice is confirmed, your plan unlocks automatically. Basic members can upgrade to Pro for $499."],
  ["Is 1:1 assist available?", `Yes. Assist is $${PLAN_PRICES_USD.assistHour}/hr via Telegram.`],
];

const quotes = [
  ["The execution module paid for the course. I finally understood why fills never matched the backtest.", "VIP member"],
  ["Clearer than any Discord recap. The lessons are sequenced so you can actually build.", "VIP member"],
  ["Pro source made the videos click. I could follow the same path in the code.", "Pro member"],
];

export default function HomeLanding() {
  const { resolvedTheme, setTheme } = useTheme();
  const [member, setMember] = useState<PublicMember | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState<"basic" | "pro" | null>(null);
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupPlan, setSignupPlan] = useState<"basic" | "pro">("pro");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchMe().then((data) => {
      if (data.blocked) {
        window.location.href = "/blocked";
        return;
      }
      setMember(data.member);
    }).catch(() => undefined);
  }, []);

  async function startPay(plan: "basic" | "pro") {
    setPayError("");
    setPaying(plan);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { invoiceUrl?: string; error?: string };
      if (!res.ok || !data.invoiceUrl) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.invoiceUrl;
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Checkout failed.");
      setPaying(null);
    }
  }

  async function signupAndPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { error?: string; member?: PublicMember };
    if (!res.ok) {
      setFormError(data.error || "Could not create account.");
      return;
    }
    setMember(data.member ?? null);
    await startPay(signupPlan);
  }

  function enroll(plan: "basic" | "pro") {
    if (member?.plan === "admin" || member?.plan === "pro") {
      window.location.href = "/learn";
      return;
    }
    if (member?.plan === "basic") {
      if (plan === "pro") void startPay("pro");
      else window.location.href = "/learn";
      return;
    }
    if (member) {
      void startPay(plan);
      return;
    }
    setSignupPlan(plan);
    setSignupOpen(true);
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand priority />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#program">The program</a>
            <a href="#curriculum">Curriculum</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="header-actions">
            <button className="theme-toggle" aria-label="Switch between light and dark theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              <Moon className="moon-icon" size={19} />
              <Sun className="sun-icon" size={19} />
            </button>
            {member?.vip ? (
              <a className="button button-small" href={member.plan === "admin" ? "/admin" : "/learn"}>Open course</a>
            ) : (
              <>
                <a className="sign-in" href="/login">Sign in</a>
                <a className="button button-small" href="#enroll">Get access</a>
              </>
            )}
            <button className="menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              <span /><span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav container" aria-label="Mobile navigation">
            {[["The program", "program"], ["Curriculum", "curriculum"], ["Pricing", "pricing"], ["FAQ", "faq"]].map(([label, id]) => (
              <a key={id} href={"#" + id} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <a href={member?.vip ? "/learn" : "/login"} onClick={() => setMenuOpen(false)}>{member?.vip ? "Open course" : "Member sign in"}</a>
          </nav>
        )}
      </header>
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow">
              <span className="small-badge">VIP PROGRAM</span>
              <span>POLYMARKET TRADING BOT COURSE</span>
            </div>
            <h1 className="seo-hero-headline">Build your<br />Polymarket <br /><span className="edge-word">trading bot.</span></h1>
            <p className="hero-description">Learn to build a Polymarket trading bot with private lessons in market making, arbitrage, execution, and risk.</p>
            <div className="hero-actions">
              <a href="#pricing" className="button">Explore the program</a>
              <a href="#curriculum" className="button button-outline"><BookOpen size={18} />View curriculum</a>
            </div>
            <div className="hero-note">
              <LockKeyhole size={14} />
              <span>Paid members only. Starting at ${PLAN_PRICES_USD.basic}.</span>
            </div>
          </div>
          <ProgramPreview />
        </section>

        <section className="program-strip" aria-label="Program at a glance">
          <div className="container strip-inner">
            <div><span className="strip-value">50</span><span>VIDEO LESSONS</span></div>
            <div><span className="strip-value">02</span><span>STRATEGY TRACKS</span></div>
            <div><span className="strip-value">05</span><span>LEARNING PHASES</span></div>
            <div><span className="strip-value">Your pace.</span><span>PRIVATE LEARNING</span></div>
          </div>
        </section>

        <section id="outcomes" className="section container problem-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FROM IDEAS TO UNDERSTANDING</p>
              <h2>A working bot is only<br />the beginning.</h2>
            </div>
            <p>Code can put an idea into motion. Understanding the market helps you decide whether that idea deserves to trade.</p>
          </div>
          <div className="outcome-grid">
            <article>
              <span className="outline-icon"><GraduationCap size={24} /></span>
              <h3>Know what you’re testing</h3>
              <p>Build a research process around market behavior, rather than copying a wallet and hoping the results follow.</p>
            </article>
            <article>
              <span className="outline-icon"><Wallet size={24} /></span>
              <h3>Account for the real costs</h3>
              <p>Understand how fees, liquidity, fills, and infrastructure can change an attractive backtest.</p>
            </article>
            <article>
              <span className="outline-icon"><ShieldCheck size={24} /></span>
              <h3>Put risk before size</h3>
              <p>Learn why monitoring, inventory awareness, and knowing when to stop belong in your workflow.</p>
            </article>
          </div>
        </section>

        <section id="program" className="section program-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE PROGRAM</p>
                <h2>Two tracks.<br />A deeper view of the market.</h2>
              </div>
              <p>Study both sides of liquidity in short-interval Polymarket markets. Detailed models and implementation stay inside the paid program.</p>
            </div>
            <div className="track-grid">
              <article className="strategy-card">
                <div className="strategy-card-top">
                  <span className="track-index">TRACK 01</span>
                  <span className="mindset-tag">MAKER MINDSET</span>
                </div>
                <div className="strategy-icon"><Layers3 size={30} /></div>
                <h3>Market making</h3>
                <p>Learn to think like a liquidity provider. Explore the relationship between quoting, inventory, and changing market conditions.</p>
                <ul>
                  <li><Check size={17} />Liquidity and quoting concepts</li>
                  <li><Check size={17} />Inventory and risk awareness</li>
                  <li><Check size={17} />Execution in live conditions</li>
                </ul>
                <div className="strategy-foot"><LockKeyhole size={15} />Full implementation in the member program</div>
              </article>
              <article className="strategy-card arb-card">
                <div className="strategy-card-top">
                  <span className="track-index">TRACK 02</span>
                  <span className="mindset-tag">TAKER MINDSET</span>
                </div>
                <div className="strategy-icon"><Activity size={30} /></div>
                <h3>Arbitrage</h3>
                <p>Learn to evaluate differences between market prices and your assessment of value — with costs and execution in view.</p>
                <ul>
                  <li><Check size={17} />Value and signal evaluation</li>
                  <li><Check size={17} />When to engage or stand down</li>
                  <li><Check size={17} />Costs, sizing, and trading risk</li>
                </ul>
                <div className="strategy-foot"><LockKeyhole size={15} />Detailed rules stay inside the paid course</div>
              </article>
            </div>
          </div>
        </section>

        <section id="curriculum" className="section container curriculum-section">
          <div className="curriculum-intro">
            <p className="eyebrow">THE LEARNING PATH</p>
            <h2>From foundation<br />to execution.</h2>
            <p>A structured, five-phase program. Learn the context, work through the concepts, then connect them to the build.</p>
            <div className="curriculum-stat">
              <CirclePlay size={21} />
              <span><strong>50 video lessons</strong><br />Detailed lessons inside the member area</span>
            </div>
            <a className="text-link" href="#pricing">Find your package</a>
          </div>
          <Accordion type="single" collapsible defaultValue="phase-0" className="curriculum-accordion">
            {phases.map((phase, i) => (
              <AccordionItem key={phase.title} value={"phase-" + i}>
                <AccordionTrigger className="phase-trigger">
                  <span className="phase-num">0{i + 1}</span>
                  <span className="phase-title"><span>{phase.tag}</span><strong>{phase.title}</strong></span>
                </AccordionTrigger>
                <AccordionContent className="phase-content">
                  <p>{phase.summary}</p>
                  <div className="topic-tags">{phase.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                  <span className="private-note"><LockKeyhole size={13} />Detailed lessons and materials in the portal</span>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="portal" className="section member-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">INSIDE THE PROGRAM</p>
                <h2>Learn with context.<br />Build with understanding.</h2>
              </div>
              <p>The public page shows the outline. The paid member area is where the learning happens.</p>
            </div>
            <div className="member-grid">
              <article><Video size={25} /><h3>Private video lessons</h3><p>A guided learning path across market making and arbitrage.</p><span>IN BASIC & PRO</span></article>
              <article><Terminal size={25} /><h3>Course source code</h3><p>Connect the lessons to code you can study and work through.</p><span>IN PRO</span></article>
              <article><FileText size={25} /><h3>Lab materials</h3><p>Supporting materials for the implementation covered in Pro.</p><span>IN PRO</span></article>
              <article><LockKeyhole size={25} /><h3>Members-only detail</h3><p>Models, implementation, and sensitive strategy material stay private.</p><span>AFTER CONFIRMED PAYMENT</span></article>
            </div>
            <div id="login" className="login-banner">
              <span className="login-icon"><LockKeyhole size={22} /></span>
              <div>
                <h3>{member?.vip ? "Welcome back." : "Already a member?"}</h3>
                <p>{member?.vip ? "Continue in the private lesson player." : "Sign in to the member portal to watch lessons and manage your plan."}</p>
              </div>
              <a className="button button-outline button-small" href={member?.vip ? "/learn" : "/login"}>{member?.vip ? "Open course" : "Member sign in"}</a>
            </div>
          </div>
        </section>

        <section id="social" className="section container">
          <div className="center-heading">
            <p className="eyebrow">FROM THE PROGRAM</p>
            <h2>What members say.</h2>
          </div>
          <div className="quote-grid">
            {quotes.map(([quote, who]) => (
              <blockquote key={quote} className="quote-card">
                <p>“{quote}”</p>
                <cite>{who}</cite>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="pricing" className="section pricing-section">
          <div className="container">
            <div className="center-heading">
              <p className="eyebrow">PRICING</p>
              <h2>Choose your access.</h2>
              <p>Pay once with NOWPayments. Assist is billed separately.</p>
            </div>
            <div className="pricing-grid">
              <article className="price-card">
                <div className="plan-heading"><span>COURSE</span></div>
                <h3>Basic</h3>
                <p className="plan-description">Private video lessons across all five phases.</p>
                <p className="price">${PLAN_PRICES_USD.basic}<span>one-time</span></p>
                <button className="button" type="button" onClick={() => enroll("basic")} disabled={paying !== null}>
                  {paying === "basic" ? "Opening invoice…" : member?.vip ? "Open course" : "Get Basic"}
                </button>
                <div className="price-divider" />
                <ul>
                  <li><Check size={16} />50 video lessons</li>
                  <li><Check size={16} />Market making and arbitrage tracks</li>
                  <li className="muted-item">Course source not included</li>
                </ul>
              </article>
              <article className="price-card featured">
                <div className="featured-label">MOST CHOSEN</div>
                <div className="plan-heading"><span>COURSE + CODE</span></div>
                <h3>Pro</h3>
                <p className="plan-description">Everything in Basic, plus source zips and lab materials.</p>
                <p className="price">${PLAN_PRICES_USD.pro}<span>one-time · upgrade from Basic ${PLAN_PRICES_USD.upgrade}</span></p>
                <button className="button" type="button" onClick={() => enroll("pro")} disabled={paying !== null}>
                  {paying === "pro" ? "Opening invoice…" : member?.plan === "basic" ? `Upgrade · $${PLAN_PRICES_USD.upgrade}` : member?.vip ? "Open course" : "Get Pro"}
                </button>
                <div className="price-divider" />
                <ul>
                  <li><Check size={16} />All Basic videos</li>
                  <li><Check size={16} />Pro-only lessons</li>
                  <li><Check size={16} />Source zips and lab materials</li>
                </ul>
              </article>
              <article className="price-card">
                <div className="plan-heading"><span>SUPPORT</span></div>
                <h3>Assist</h3>
                <p className="plan-description">1:1 help on setup, questions, and implementation.</p>
                <p className="price">${PLAN_PRICES_USD.assistHour}<span>per hour</span></p>
                <a className="button button-outline" href={ASSIST_TELEGRAM} target="_blank" rel="noopener noreferrer">Message on Telegram</a>
                <div className="price-divider" />
                <ul>
                  <li><Check size={16} />Booked privately</li>
                  <li><Check size={16} />Not a substitute for the course</li>
                </ul>
              </article>
            </div>
            {payError ? <p className="pricing-notes" role="alert">{payError}</p> : null}
          </div>
        </section>

        <section id="faq" className="section container faq-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Straight answers.</h2>
            <p>Paid access, no public strategy dump, and a portal that stays private.</p>
          </div>
          <Accordion type="single" collapsible className="faq-accordion">
            {faqs.map(([q, a], i) => (
              <AccordionItem key={q} value={"faq-" + i}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="enroll" className="container">
          <div className="enroll-section">
            <div className="enroll-copy">
              <p className="eyebrow">ENROLL</p>
              <h2>Create an account.<br />Pay. Watch.</h2>
              <p>NOWPayments issues the invoice. When payment confirms, Basic or Pro unlocks on the same account.</p>
              <div className="enroll-lock"><LockKeyhole size={14} />No public wallets. No TX-hash forms.</div>
            </div>
            <div className="enroll-form-card">
              {member?.vip ? (
                <>
                  <div className="form-header">
                    <h3>You’re in.</h3>
                    <span>{member.plan.toUpperCase()} ACCESS</span>
                  </div>
                  <a className="button" href="/learn" style={{ marginTop: 24, width: "100%" }}>Open the course</a>
                </>
              ) : (
                <>
                  <div className="form-header">
                    <h3>{member ? "Complete payment" : "Start with a free account"}</h3>
                    <span>THEN UNLOCK WITH NOWPAYMENTS</span>
                  </div>
                  <div className="enroll-pay-actions">
                    <button className="button" type="button" onClick={() => enroll("basic")} disabled={paying !== null}>Basic ${PLAN_PRICES_USD.basic}</button>
                    <button className="button button-outline" type="button" onClick={() => enroll("pro")} disabled={paying !== null}>Pro ${PLAN_PRICES_USD.pro}</button>
                  </div>
                  <p className="form-fine">Already registered? <a className="text-link" href="/login">Sign in</a> and pay from your account page.</p>
                </>
              )}
            </div>
          </div>
          <div className="risk-notice">
            <ShieldCheck size={16} />
            <p><strong>Trading involves risk.</strong> The program teaches research, implementation, execution, and risk awareness. You are responsible for your own testing and trading decisions.</p>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <p>OhioismQuant — private Polymarket trading-bot course.</p>
          <nav>
            <a href="#program">Program</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a className="footer-member" href="/login"><LockKeyhole size={14} />Members</a>
          </nav>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} OhioismQuant</span>
          <span>Local VIP portal</span>
        </div>
      </footer>

      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="member-dialog">
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription>
            Then you will be sent to NOWPayments for {signupPlan === "pro" ? `Pro · $${PLAN_PRICES_USD.pro}` : `Basic · $${PLAN_PRICES_USD.basic}`}.
          </DialogDescription>
          <form className="auth-form" onSubmit={signupAndPay}>
            <label htmlFor="enroll-email">Email</label>
            <input id="enroll-email" name="email" type="email" required autoComplete="email" />
            <label htmlFor="enroll-password">Password</label>
            <input id="enroll-password" name="password" type="password" minLength={8} required autoComplete="new-password" />
            {formError ? <p className="form-error">{formError}</p> : null}
            <button className="button" type="submit" disabled={paying !== null}>{paying ? "Opening invoice…" : "Create account and pay"}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
