import { BuildProvider } from '../build/build-provider'
import { Backdrop } from '../components/backdrop/Backdrop'
import { BuildsCountProvider } from '../components/build-counter/BuildsCountProvider'
import { BuildHud } from '../components/build-hud/BuildHud'
import { SkipLink } from '../components/build-hud/SkipLink'
import { DummyBadge } from '../components/dummy-badge/DummyBadge'
import { Navbar } from '../components/navbar/Navbar'
import { InteractionsProvider } from '../interactions/InteractionsProvider'
import { About } from '../sections/about/About'
import { Contact } from '../sections/contact/Contact'
import { Footer } from '../sections/footer/Footer'
import { Guestbook } from '../sections/guestbook/Guestbook'
import { Hero } from '../sections/hero/Hero'
import { Projects } from '../sections/projects/Projects'
import { Skills } from '../sections/skills/Skills'

export function App() {
  return (
    <BuildProvider>
      <BuildsCountProvider>
        <InteractionsProvider>
          <SkipLink />
          <Backdrop />
          <div className="md:pt-ruler md:pl-ruler">
            <Navbar />
            <main>
              <Hero />
              <About />
              <Projects />
              <Skills />
              <Guestbook />
              <Contact />
            </main>
            <Footer />
          </div>
          <BuildHud />
          {import.meta.env.DEV && <DummyBadge />}
        </InteractionsProvider>
      </BuildsCountProvider>
    </BuildProvider>
  )
}
