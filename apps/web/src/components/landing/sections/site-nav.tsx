import { Link } from "react-router";
import { BrandMark } from "@/components/brand/brand-mark";
import { appRoutes } from "@/lib/routes";

const links = [
  { label: "Product", href: "#features" },
  { label: "Console", href: "#console" },
  { label: "Proof", href: "#proof" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
] as const;

export function SiteNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <a className="brand" href="#hero" aria-label="Reins, back to top">
        <BrandMark size={26} />
        Reins
      </a>
      <ul className="nav-links">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
      <Link className="signin" to={appRoutes.dashboard}>
        Open console
      </Link>
    </nav>
  );
}
