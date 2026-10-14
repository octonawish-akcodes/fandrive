import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-black bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="brut-sm -rotate-2 bg-alarm px-3 py-1 font-display text-2xl">FanDrive</Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-1 font-bold">
          <Link href="/plan" className="underline-offset-4 hover:underline">Plan a drive</Link>
          <Link href="/#examples" className="underline-offset-4 hover:underline">Example cities</Link>
          <Link href="/#how" className="underline-offset-4 hover:underline">How it works</Link>
        </nav>
        <Link href="/plan" className="press ml-auto border-[3px] border-black bg-black px-4 py-2 font-bold text-white">For blood banks</Link>
      </div>
    </header>
  );
}
