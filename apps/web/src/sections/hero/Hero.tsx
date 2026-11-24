import { copy } from '../../app/copy'
import { heroScript } from '../../build/scripts/hero'
import { useBuild } from '../../build/use-build'
import { buttonClass } from '../../components/ui/button'
import { profile } from '../../content/profile'

export function Hero() {
  const build = useBuild(heroScript, { id: 'hero', budget: 'hero' })
  return (
    <section
      {...build}
      id="hero"
      aria-labelledby="hero-title"
      className="relative mx-auto flex min-h-[calc(100svh-var(--spacing-nav))] max-w-content flex-col justify-center gap-12 px-gutter py-section lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="max-w-2xl">
        <p
          data-build="hero-role"
          className="inline-flex rounded-pill border border-border bg-surface px-4 py-1 font-mono text-sm text-blue-pale"
        >
          {profile.role}
        </p>
        <h1 id="hero-title" data-build="hero-title" className="mt-6 text-hero font-bold">
          {profile.name}
        </h1>
        <p data-build="hero-tagline" className="mt-6 max-w-xl text-lg text-text-secondary">
          {profile.tagline}
        </p>
        <p data-build="hero-meta" className="mt-4 font-mono text-sm text-text-secondary">
          {profile.location} · {profile.availability}
        </p>
        <div data-build="hero-actions" className="mt-10 flex flex-wrap gap-4">
          <a href="#projects" className={buttonClass('primary')}>
            {copy.hero.primaryAction}
          </a>
          <a href="#contact" className={buttonClass('ghost')}>
            {copy.hero.secondaryAction}
          </a>
        </div>
      </div>
      {/*
        LCP candidate (OQ-04): card and avatar are prerendered as already built so they paint at once.
        Pixel still outlines them, and Replay hides and rebuilds them like any other target.
      */}
      <div
        data-build="hero-card"
        data-built=""
        className="self-start rounded-lg border border-border bg-surface p-3 shadow-glow lg:self-auto"
      >
        <img
          data-build="hero-avatar"
          data-built=""
          src={profile.avatar.src}
          alt={profile.avatar.alt}
          width={profile.avatar.width}
          height={profile.avatar.height}
          className="size-48 rounded-md sm:size-64"
        />
      </div>
    </section>
  )
}
