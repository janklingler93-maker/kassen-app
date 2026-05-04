"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    setError("");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .eq("password", password.trim());

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error || !data || data.length === 0) {
      setError("Benutzername oder Passwort falsch");
      return;
    }

    const user = data[0];

    localStorage.setItem("user", JSON.stringify(user));

    if (user.is_admin) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/konto";
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Kassen-App
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Login für Benutzer und Admins
        </p>

        <div className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            placeholder="Benutzername"
            className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Passwort"
            className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500"
          />

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold"
          >
            Einloggen
          </button>
        </div>
      </div>
    </main>
  );
}