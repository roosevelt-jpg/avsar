import { ArrowRight, Menu, Search } from 'lucide-react'

const categories = [
  ['Chef', 'Service in a working kitchen, not a demonstration kitchen.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=700&q=85'],
  ['Food and beverage service', 'The floor, the counter and the customer in front of you.', 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=700&q=85'],
  ['Cleaner', 'Turnarounds between guests, to a standard that is checked.', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=85'],
  ['Property management', 'Running occupied buildings day to day, and the people in them.', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=85'],
  ['Driver', 'Deliveries, transfers and the routes between them.', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85'],
  ['Logistics', 'Stock, linen and goods moving between sites on time.', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=700&q=85'],
  ['Construction worker', 'Renovation and fit-out, mostly in buildings already standing.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=700&q=85'],
  ['Electrician', 'Installation and fault-finding, often in old wiring.', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=700&q=85'],
  ['Plumber', 'Water, waste and heating, in flats where the neighbour is below.', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=700&q=85'],
  ['Welder', 'Structural and fabrication work, to a drawing.', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=700&q=85'],
  ['Data analyst', 'Turning operational data into decisions somebody acts on.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&q=85'],
  ['QA tester', 'Finding what breaks before a customer does.', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=700&q=85'],
]

export default function Page() {
  return <main className="avsar-page" id="top">
    <header className="avsar-header"><a className="avsar-logo" href="#top">avsar<span>.</span></a><nav aria-label="Primary navigation"><a href="#roles">Find work</a><a href="#employers">For employers</a><a href="#about">About us</a></nav><div className="header-actions"><a href="#signin">Sign in</a><a className="header-button" href="#join">Join Avsar <ArrowRight aria-hidden="true" /></a></div><button className="menu-button" aria-label="Open menu"><Menu /></button></header>
    <section className="avsar-hero"><div><p className="hero-kicker">A recruitment platform for people who make things happen</p><h1>Find work that<br /><i>fits real life.</i></h1><p className="hero-lede">Avsar connects dependable people with good employers across the roles that keep places, teams and communities moving.</p><div className="hero-search"><Search aria-hidden="true" /><span>Search jobs, skills or locations</span><button>Search <ArrowRight aria-hidden="true" /></button></div></div><div className="hero-note"><span>01</span><p>Useful work.<br /><strong>Better matched.</strong></p></div></section>
    <section className="roles-section" id="roles"><div className="roles-heading"><div><p className="section-kicker">Where opportunity lives</p><h2>Work that<br /><i>matters.</i></h2></div><p>From the kitchen to the construction site, Avsar helps you find your next move in the industries that make everyday life work.</p></div><div className="category-grid">{categories.map(([title, description, image]) => <a className="category-card" href="#search" key={title}><img src={image} alt="" /><h3>{title}</h3><p>{description}</p></a>)}</div></section>
    <section className="employer-band" id="employers"><div><p className="section-kicker">For employers</p><h2>Good people<br /><i>move business forward.</i></h2></div><div><p>Tell us what you need. We will help you find the people who can do the work, fit the team and stay for the journey.</p><a className="dark-button" href="#hire">Hire with Avsar <ArrowRight aria-hidden="true" /></a></div></section>
    <section className="avsar-footer-cta" id="about"><p className="section-kicker">Your next move starts here</p><h2>Ready when<br /><i>you are.</i></h2><a className="dark-button" href="#join">Create your profile <ArrowRight aria-hidden="true" /></a></section>
    <footer className="avsar-footer"><a className="avsar-logo" href="#top">avsar<span>.</span></a><span>© 2026 Avsar</span><div><a href="#privacy">Privacy</a><a href="#contact">Contact</a><a href="#linkedin">LinkedIn</a></div></footer>
  </main>
}
