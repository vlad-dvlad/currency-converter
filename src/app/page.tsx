import { Converter } from "@/ui/converter";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-bg to-bg-accent p-4 sm:p-8">
      <Converter />
    </main>
  );
}
