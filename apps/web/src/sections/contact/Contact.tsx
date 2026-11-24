import { copy } from '../../app/copy'
import { contactScript } from '../../build/scripts/contact'
import { Section } from '../../components/ui/Section'
import { profile } from '../../content/profile'
import { ContactForm } from './ContactForm'

export function Contact() {
  const { eyebrow, title } = copy.sections.contact
  return (
    <Section id="contact" eyebrow={eyebrow} title={title} script={contactScript}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div data-build="contact-intro" className="space-y-4 text-text-secondary">
          <p>{copy.contact.intro}</p>
          <p>
            {copy.contact.directEmail}{' '}
            <a
              href={`mailto:${profile.email}`}
              className="text-blue-light underline underline-offset-2 hover:text-blue-pale"
            >
              {profile.email}
            </a>
          </p>
        </div>
        <ContactForm />
      </div>
    </Section>
  )
}
