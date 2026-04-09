import { SettingsPanel } from "@/components/settings-panel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ustawienia — VST Wedding Panel",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/panel"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--gold)]"
        >
          ← Wróć do panelu
        </Link>

        <h1 className="mb-8 font-serif text-3xl text-[var(--foreground)]">
          Ustawienia
        </h1>

        <SettingsPanel />
      </div>
    </main>
  );
}
