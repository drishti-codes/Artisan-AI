import Link from 'next/link';

// Shown when a page needs a login (same look as the checkout "please log in" screen)
export default function LoginRequired({ next, title = 'Please log in to continue', text }) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-3xl text-brown mb-3">{title}</h1>
      <p className="text-brown/60 mb-8">{text}</p>
      <Link href={`/login?next=${next}`} className="btn-primary rounded-full px-8 py-3 text-sm inline-block">
        Login / Register
      </Link>
    </div>
  );
}
