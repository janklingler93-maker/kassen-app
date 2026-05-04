"use client";

import { useEffect, useState } from "react";

type User = {
  username: string;
  balance: number;
};

export default function KontoPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!savedUser) {
      window.location.href = "/";
      return;
    }

    setUser(savedUser);
  }, []);

  function logout() {
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-5 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">Mein Konto</h1>
          <p className="text-gray-400">Hallo {user.username}</p>
        </div>

        <img
          src="/logo.jfif"
          alt="Jugendraum Hart 97"
          className="w-24 h-24 rounded-2xl bg-white object-contain p-2"
        />
      </div>

      <div className="bg-gray-900 rounded-3xl p-8 text-center shadow-xl">
        <p className="text-gray-400 mb-3">Aktueller Kontostand</p>

        <p
          className={`text-5xl font-bold ${
            Number(user.balance) < 0 ? "text-red-400" : "text-green-400"
          }`}
        >
          {Number(user.balance).toFixed(2)} €
        </p>
      </div>

      <button
        onClick={logout}
        className="mt-auto bg-red-600 p-4 rounded-2xl font-bold"
      >
        Logout
      </button>
    </main>
  );
}