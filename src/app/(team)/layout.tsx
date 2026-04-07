import { ClerkProvider } from "@clerk/nextjs";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
