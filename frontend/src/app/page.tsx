import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container-content flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-xl">Formatic</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-6">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container-content space-y-10 text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Create and manage forms with ease
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Formatic helps you create forms, collect responses, and analyze data
              all in one place. Get started today.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/register"
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create Your First Form
              </Link>
              <Link
                href="/demo"
                className="rounded-md bg-secondary px-6 py-3 text-base font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </section>
        <section className="py-20">
          <div className="container-content space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to manage forms
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Formatic provides all the tools you need to create, share, and analyze forms.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="bg-card rounded-lg border p-6 shadow-sm">
                  <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container-content text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Join thousands of users creating forms and collecting responses with Formatic.
            </p>
            <div className="flex justify-center">
              <Link
                href="/register"
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create an Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-10">
        <div className="container-content">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">F</span>
                </div>
                <span className="font-bold text-xl">Formatic</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Create, manage, and analyze forms with ease.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Formatic. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Temporary placeholder for features
const features = [
  {
    title: "Form Builder",
    description: "Create beautiful forms with our easy-to-use drag-and-drop form builder.",
    icon: FormIcon,
  },
  {
    title: "Response Collection",
    description: "Collect and manage responses in one place with real-time updates.",
    icon: ResponseIcon,
  },
  {
    title: "Data Analysis",
    description: "Analyze your form data with powerful analytics and reporting tools.",
    icon: AnalyticsIcon,
  },
];

// Placeholder icons until we import actual icons
function FormIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
      <path d="M8 18h8" />
    </svg>
  );
}

function ResponseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M18 8h4v4" />
      <path d="M15 22v-4h4" />
      <path d="M22 12v4" />
      <path d="M15 12H2" />
      <path d="M2 7h10" />
      <path d="M2 17h10" />
    </svg>
  );
}

function AnalyticsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
} 