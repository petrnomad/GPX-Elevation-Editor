export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-8 px-4 mt-12">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <div>
            <h3 className="text-white font-semibold mb-3">About This Project</h3>
            <p className="text-sm mb-2">
              Vibecoded with ❤️ for{' '}
              <a
                href="https://madeirajourney.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline"
              >
                MadeiraJourney.com
              </a>
            </p>
            <p className="text-sm text-slate-400">
              A free tool for analyzing and editing GPX elevation profiles with anomaly detection and smoothing capabilities.
            </p>
          </div>

          {/* Author & Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <p className="text-sm mb-1">
              Author:{' '}
              <a
                href="https://petrnovak.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline"
              >
                Petr Novák
              </a>
            </p>
            <p className="text-sm">
              Questions:{' '}
              <a
                href="mailto:jsem@petrnovak.com"
                className="text-green-400 hover:text-green-300 underline"
              >
                jsem@petrnovak.com
              </a>
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <p className="text-sm text-slate-400 mb-2">
              © {currentYear} Petr Novák. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              This tool is provided "as is" without warranty of any kind. Use at your own risk.
              Always verify critical elevation data independently.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-6 pt-6 text-center text-xs text-slate-500">
          <p className="mb-4">
            Built with Next.js, TypeScript, and Tailwind CSS.
            Your GPX files are processed locally in your browser - no data is uploaded to any server.
          </p>

          {/* Product Hunt Badge */}
          <div className="flex justify-center mt-6">
            <a
              href="https://www.producthunt.com/products/gpx-elevation-editor?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-gpx&#0045;elevation&#0045;editor"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1033849&theme=dark&t=1762156288094"
                alt="GPX Elevation Editor - Edit & analyze gpx elevation profiles online | Product Hunt"
                style={{ width: '250px', height: '54px' }}
                width="250"
                height="54"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
