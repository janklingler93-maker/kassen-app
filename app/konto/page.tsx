"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  username: string;
  balance: number;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: string;
  created_at: string;
};

export default function KontoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!savedUser) {
      window.location.href = "/";
      return;
    }

    loadUser(savedUser.id);
    loadTransactions(savedUser.id);
  }, []);

  async function loadUser(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setUser(data);
  }

  async function loadTransactions(userId: string) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setTransactions(data || []);
  }

  async function changeOwnPassword() {
    if (!user) return;

    if (!newPassword.trim()) {
      alert("Bitte neues Passwort eingeben");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ password: newPassword.trim() })
      .eq("id", user.id);

    if (error) {
      alert("Passwort konnte nicht geändert werden: " + error.message);
      return;
    }

    setNewPassword("");
    alert("Passwort wurde geändert");
  }

  function logout() {
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-5 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mein Konto</h1>
          <p className="text-gray-400">Hallo {user.username}</p>
        </div>

        <img
          src="/logo.jfif"
          alt="Logo"
          className="w-24 h-24 rounded-2xl bg-white object-contain p-2"
        />
      </div>

      <div className="bg-gray-900 rounded-3xl p-8 text-center shadow-xl mb-8">
        <p className="text-gray-400 mb-3">Aktueller Kontostand</p>

        <p
          className={`text-5xl font-bold ${
            Number(user.balance) < 0 ? "text-red-400" : "text-green-400"
          }`}
        >
          {Number(user.balance).toFixed(2)} €
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Buchungen</h2>

        <div className="space-y-3">
          {transactions.length === 0 && (
            <p className="text-gray-400">Keine Buchungen vorhanden.</p>
          )}

          {transactions.map((t) => (
            <div
              key={t.id}
              className="bg-gray-900 p-4 rounded-2xl flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{t.description}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(t.created_at).toLocaleString("de-DE")}
                </p>
              </div>

              <p
                className={`font-bold ${
                  Number(t.amount) < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {Number(t.amount).toFixed(2)} €
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Passwort ändern</h2>

        <div className="bg-gray-900 p-4 rounded-2xl">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Neues Passwort"
            className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl mb-3"
          />

          <button
            onClick={changeOwnPassword}
            className="w-full bg-blue-600 p-4 rounded-2xl font-bold"
          >
            Passwort speichern
          </button>
        </div>
      </section>

      <button
        onClick={logout}
        className="mt-auto bg-red-600 p-4 rounded-2xl font-bold"
      >
        Logout
      </button>
    </main>
  );
}