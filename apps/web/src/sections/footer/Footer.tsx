import { copy } from '../../app/copy'
import { BuildsCount } from '../../components/build-counter/BuildsCount'
import { profile } from '../../content/profile'
import { socials } from '../../content/socials'

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-content flex-col gap-6 border-t border-border px-gutter py-12 font-mono text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <p className="flex flex-col gap-1">
        <span>
          © {profile.name}. {copy.footer.builtBy}
        </span>
        <BuildsCount />
      </p>
      <nav aria-label={copy.footer.socialsLabel}>
        <ul className="flex flex-wrap gap-5">
          {socials.map((social) => (
            <li key={social.platform}>
              <a href={social.url} className="hover:text-blue-light">
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}
