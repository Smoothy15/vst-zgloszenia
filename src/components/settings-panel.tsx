"use client";

import { useState, useEffect } from "react";

interface NotificationEmail {
  id: string;
  email: string;
  created_at: string;
}

interface PanelUser {
  id: string;
  email: string;
  createdAt: number;
}

export function SettingsPanel() {
  // --- Notification emails ---
  const [emails, setEmails] = useState<NotificationEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(true);

  // --- Users ---
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userError, setUserError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
    fetchUsers();
  }, []);

  async function fetchEmails() {
    try {
      const res = await fetch("/api/settings/emails");
      const data = await res.json();
      setEmails(data.emails || []);
    } catch {
      // ignore
    } finally {
      setLoadingEmails(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/settings/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleAddEmail() {
    if (!newEmail.trim()) return;
    setIsAddingEmail(true);
    setEmailError(null);

    try {
      const res = await fetch("/api/settings/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error);
        return;
      }
      setEmails((prev) => [...prev, data.email]);
      setNewEmail("");
    } catch {
      setEmailError("Błąd połączenia.");
    } finally {
      setIsAddingEmail(false);
    }
  }

  async function handleRemoveEmail(id: string) {
    try {
      const res = await fetch("/api/settings/emails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // ignore
    }
  }

  async function handleCreateUser() {
    if (!userEmail.trim() || !userPassword) return;
    setIsCreatingUser(true);
    setUserError(null);

    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserError(data.error);
        return;
      }
      setUsers((prev) => [...prev, data.user]);
      setUserEmail("");
      setUserPassword("");
    } catch {
      setUserError("Błąd połączenia.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (confirmDeleteUser !== userId) {
      setConfirmDeleteUser(userId);
      return;
    }

    try {
      const res = await fetch("/api/settings/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      // ignore
    } finally {
      setConfirmDeleteUser(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* Sekcja 1: Powiadomienia email */}
      <section
        className="border border-[var(--border)] bg-[var(--card)] p-6"
        style={{ borderRadius: "4px" }}
      >
        <h2 className="mb-1 font-serif text-xl text-[var(--foreground)]">
          Powiadomienia email
        </h2>
        <p className="mb-5 text-sm text-[var(--muted-foreground)]">
          Na te adresy będą wysyłane powiadomienia o nowych zgłoszeniach i
          wiadomościach od klientów.
        </p>

        {loadingEmails ? (
          <p className="text-sm text-[var(--muted-foreground)]">Ładowanie...</p>
        ) : (
          <>
            {emails.length > 0 && (
              <div className="mb-4 space-y-2">
                {emails.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between border border-[var(--border)] px-4 py-2.5"
                    style={{ borderRadius: "2px" }}
                  >
                    <span className="text-sm text-[var(--foreground)]">
                      {e.email}
                    </span>
                    <button
                      onClick={() => handleRemoveEmail(e.id)}
                      className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--destructive)]"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}

            {emails.length === 0 && (
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                Brak adresów — powiadomienia nie będą wysyłane.
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                placeholder="nowy@email.pl"
                className="flex-1 border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
                style={{ borderRadius: "2px" }}
              />
              <button
                onClick={handleAddEmail}
                disabled={isAddingEmail || !newEmail.trim()}
                className="bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-light)] disabled:opacity-50"
                style={{ borderRadius: "2px" }}
              >
                Dodaj
              </button>
            </div>
            {emailError && (
              <p className="mt-2 text-sm text-red-400">{emailError}</p>
            )}
          </>
        )}
      </section>

      {/* Sekcja 2: Użytkownicy panelu */}
      <section
        className="border border-[var(--border)] bg-[var(--card)] p-6"
        style={{ borderRadius: "4px" }}
      >
        <h2 className="mb-1 font-serif text-xl text-[var(--foreground)]">
          Użytkownicy panelu
        </h2>
        <p className="mb-5 text-sm text-[var(--muted-foreground)]">
          Osoby, które mogą logować się do panelu zgłoszeń.
        </p>

        {loadingUsers ? (
          <p className="text-sm text-[var(--muted-foreground)]">Ładowanie...</p>
        ) : (
          <>
            {users.length > 0 && (
              <div className="mb-4 space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between border border-[var(--border)] px-4 py-2.5"
                    style={{ borderRadius: "2px" }}
                  >
                    <span className="text-sm text-[var(--foreground)]">
                      {u.email}
                    </span>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--destructive)]"
                    >
                      {confirmDeleteUser === u.id ? "Na pewno?" : "Usuń"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Nowy użytkownik
              </h3>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="email@example.pl"
                className="w-full border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
                style={{ borderRadius: "2px" }}
              />
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Hasło (min. 8 znaków)"
                className="w-full border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
                style={{ borderRadius: "2px" }}
              />
              <button
                onClick={handleCreateUser}
                disabled={
                  isCreatingUser || !userEmail.trim() || !userPassword
                }
                className="bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-light)] disabled:opacity-50"
                style={{ borderRadius: "2px" }}
              >
                {isCreatingUser ? "Tworzenie..." : "Utwórz użytkownika"}
              </button>
              {userError && (
                <p className="text-sm text-red-400">{userError}</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
