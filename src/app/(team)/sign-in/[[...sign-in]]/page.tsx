import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <Image
          src="/logo.png"
          alt="VST Wedding"
          width={180}
          height={33}
          className="mx-auto mb-8 invert"
        />
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#161616] border border-[#2a2a2a]",
              headerTitle: "text-[#f0ead6]",
              headerSubtitle: "text-[#888888]",
              formButtonPrimary:
                "bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#e2c97e]",
              formFieldInput:
                "bg-[#111111] border-[#2a2a2a] text-[#f0ead6] focus:border-[#c9a84c]",
              formFieldLabel: "text-[#888888]",
              footerActionLink: "text-[#c9a84c] hover:text-[#e2c97e]",
            },
          }}
        />
      </div>
    </div>
  );
}
