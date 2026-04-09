import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ limit: 50 });
    const list = users.data.map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || "",
      createdAt: u.createdAt,
    }));
    return NextResponse.json({ users: list });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Błąd serwera." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email i hasło są wymagane." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Hasło musi mieć min. 8 znaków." },
      { status: 400 }
    );
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.createUser({
      emailAddress: [email.trim().toLowerCase()],
      password,
    });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Błąd tworzenia użytkownika.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Brak ID użytkownika." }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Błąd usuwania." },
      { status: 500 }
    );
  }
}
