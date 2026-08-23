import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 p-4">
      <Link
        href="/"
        className="font-heading text-sm font-semibold tracking-wide"
      >
        GardenFood
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
