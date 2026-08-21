export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-brand uppercase">
        Mother Language Lovers of the World Society
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-brand-dark">Content editor</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        This app writes MDX to the private <code>mllws-blog</code> repo and stores
        new photos on Vercel Blob. It is not the public website.
      </p>
      <a
        href="/admin"
        className="mt-8 inline-flex w-fit items-center rounded-full bg-brand px-5 py-3 text-surface-white no-underline hover:bg-brand-dark"
      >
        Open Tina admin
      </a>
      <p className="mt-8 text-sm text-muted">
        After you save a published document, the website rebuilds from GitHub in
        about one to two minutes.
      </p>
    </main>
  );
}
