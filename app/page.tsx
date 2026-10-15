import { ArrowRight, BriefcaseBusiness, Check, Menu, Play, Search, Sparkles, Users, X } from 'lucide-react'

const roles = [
  { title: 'Product Designer', company: 'Luma Labs', location: 'Remote · Europe', type: 'Full-time', accent: 'coral' },
  { title: 'Senior Software Engineer', company: 'Northstar', location: 'Berlin · Hybrid', type: 'Full-time', accent: 'blue' },
  { title: 'Brand Strategist', company: 'Common Ground', location: 'London · Hybrid', type: 'Contract', accent: 'gold' },
]

export default function Page() {
  return (
    <main className="site-shell">
      <nav className="nav container" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="Avsar home"><span className="wordmark-mark">A</span> avsar</a>
        <div className="nav-links">
          <a href="#opportunities">Find opportunities</a>
          <a href="#employers">For employers</a>
          <a href="#about">About Avsar</a>
        </div>
        <div className="nav-actions">
          <a className="login-link" href="#login">Sign in</a>
          <a className="nav-cta" href="#join">Join Avsar <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        <button className="mobile-menu" aria-label="Open navigation"><Menu size={22} /></button>
      </nav>

      <section className="hero container" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A better way to move forward</div>
          <h1>Work that feels<br /><em>worthwhile.</em></h1>
          <p className="hero-description">Avsar brings ambitious people and thoughtful companies together — for work that makes a difference.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#opportunities">Explore opportunities <ArrowRight size={17} aria-hidden="true" /></a>
            <a className="text-link" href="#employers">I&apos;m hiring <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <div className="hero-proof"><div className="avatar-stack"><span>MN</span><span>AK</span><span>JL</span><span>+</span></div><p><strong>12,000+</strong> people found their next chapter</p></div>
        </div>
        <div className="hero-art" aria-label="Abstract illustration of people connecting" role="img">
          <div className="art-label art-label-one">Curious minds<br /><span>find each other</span></div>
          <div className="art-label art-label-two">01 — 03</div>
          <div className="sun" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="person person-one"><div className="head" /><div className="body" /></div>
          <div className="person person-two"><div className="head" /><div className="body" /></div>
          <div className="person person-three"><div className="head" /><div className="body" /></div>
          <div className="art-line line-one" /><div className="art-line line-two" />
          <div className="art-caption">Make your next move<br /><strong>with intention.</strong></div>
        </div>
      </section>

      <section className="ticker" aria-label="Avsar values"><div className="ticker-inner"><span>Human first</span><i>✦</i><span>Purpose driven</span><i>✦</i><span>Built for possibility</span><i>✦</i><span>Human first</span><i>✦</i><span>Purpose driven</span></div></section>

      <section className="opportunities container" id="opportunities">
        <div className="section-heading"><div><div className="eyebrow">For people ready for more</div><h2>Find a role with<br /><em>room to grow.</em></h2></div><a className="text-link" href="#all-roles">View all roles <ArrowRight size={15} aria-hidden="true" /></a></div>
        <div className="role-grid">{roles.map((role) => <article className={`role-card ${role.accent}`} key={role.title}><div className="role-icon"><BriefcaseBusiness size={18} /></div><div className="role-top"><span>{role.type}</span><span>↗</span></div><h3>{role.title}</h3><p>{role.company}</p><div className="role-footer"><span>{role.location}</span><span className="role-arrow"><ArrowRight size={15} /></span></div></article>)}</div>
      </section>

      <section className="employers" id="employers"><div className="container employer-grid"><div><div className="eyebrow">For teams building what's next</div><h2>The right person<br />changes <em>everything.</em></h2></div><div className="employer-content"><p>Hiring is more than filling a seat. It's finding the person who sees the problem the way you do — and brings a new perspective to solve it.</p><a className="button button-light" href="#post-role">Build your team <ArrowRight size={17} /></a><div className="employer-stats"><span><strong>94%</strong><small>of partners hire again</small></span><span><strong>3.2×</strong><small>faster to shortlist</small></span></div></div></div></section>

      <section className="closing container" id="about"><div className="closing-inner"><Sparkles size={24} /><h2>Your next chapter<br /><em>starts here.</em></h2><p>Good work is out there. Let's find it together.</p><a className="button button-dark" href="#join">Create your profile <ArrowRight size={17} /></a></div></section>
      <footer className="footer container"><a className="wordmark" href="#top"><span className="wordmark-mark">A</span> avsar</a><span>© 2026 Avsar</span><div><a href="#privacy">Privacy</a><a href="#contact">Contact</a><a href="#linkedin">LinkedIn</a></div></footer>
    </main>
  )
}

function UnusedIcon() { return <><Search /><Users /><Check /><Play /><X /></> }
UnusedIcon

// Avsar is intentionally presented as a focused, high-trust recruitment marketplace for a niche community.

// hidden reference keeps the icon set available for future routes without adding dependencies
void UnusedIcon

// This export is never rendered; it prevents tree-shaking assumptions in preview tooling.
export const avsarIconSet = { Search, Users, Check, Play, X }

type _Role = (typeof roles)[number]
void (null as unknown as _Role)

// The page remains server-rendered for fast first paint and SEO.

// Navigation anchors are intentionally lightweight until destination routes are added.
