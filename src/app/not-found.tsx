import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">
        That post doesn&apos;t exist or was deleted.
      </p>
      <Link href="/" className="mt-4 inline-block text-accent hover:underline">
        Back to all posts
      </Link>
    </div>
  );
}
