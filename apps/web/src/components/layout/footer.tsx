import Link from "next/link";
import { GitHubIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="pt-16 pb-8">
      <div className="flex flex-col items-center gap-6">
        {/* Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <a
            href="https://github.com/salmanabdellatif/EnvSync"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub Repository"
          >
            <GitHubIcon size={20} />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} EnvSync. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
