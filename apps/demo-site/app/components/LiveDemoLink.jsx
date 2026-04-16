/** @param {{ href: string, children: import('react').ReactNode }} props */
export function LiveDemoLink({ href, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
    >
      {children}
    </a>
  );
}
