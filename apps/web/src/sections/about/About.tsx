import { copy } from '../../app/copy'
import { aboutScript } from '../../build/scripts/about'
import { buttonClass } from '../../components/ui/button'
import { Section } from '../../components/ui/Section'
import { profile } from '../../content/profile'
import { Timeline } from './Timeline'

export function About() {
  const { eyebrow, title } = copy.sections.about
  return (
    <Section id="about" eyebrow={eyebrow} title={title} script={aboutScript}>
      <div className="grid gap-12 lg:grid-cols-[auto_1fr]">
        <img
          data-build="about-photo"
          src={profile.avatar.src}
          alt={profile.avatar.alt}
          width={profile.avatar.width}
          height={profile.avatar.height}
          loading="lazy"
          decoding="async"
          className="size-40 rounded-md border border-border sm:size-56"
        />
        <div data-build="about-bio" className="max-w-2xl space-y-4 text-text-secondary">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {profile.resumeUrl && (
            <a href={profile.resumeUrl} className={`${buttonClass('ghost')} mt-4`}>
              {copy.about.resume}
            </a>
          )}
        </div>
      </div>
      <h3 data-build="about-experience-title" className="mt-16 font-mono text-sm text-blue-pale">
        {copy.about.experienceTitle}
      </h3>
      <Timeline />
    </Section>
  )
}
