"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  username: string;
  password?: string;
  balance: number;
  is_admin: boolean;
};

type Drink = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  active: boolean;
  stock: number;
};

type View =
  | "home"
  | "selectUserForDrink"
  | "selectDrink"
  | "selectUserForMoney"
  | "money"
  | "manage"
  | "manageDrinks"
  | "manageUsers"
  | "inventory";

export default function AdminPage() {
  const [view, setView] = useState<View>("home");
  const [users, setUsers] = useState<User[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [amount, setAmount] = useState("5");

  const [drinkName, setDrinkName] = useState("");
  const [drinkPrice, setDrinkPrice] = useState("");
  const [drinkImage, setDrinkImage] = useState<File | null>(null);

  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [editDrinkName, setEditDrinkName] = useState("");
  const [editDrinkPrice, setEditDrinkPrice] = useState("");
  const [editDrinkImage, setEditDrinkImage] = useState<File | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user || !user.is_admin) {
      window.location.href = "/";
      return;
    }

    loadData();
  }, []);

  async function loadData() {
    const { data: u } = await supabase
      .from("users")
      .select("*")
      .order("username");

    const { data: d } = await supabase
      .from("drinks")
      .select("*")
      .eq("active", true)
      .order("created_at");

    setUsers(u || []);
    setDrinks(d || []);
  }

  async function refreshSelectedUser(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setSelectedUser(data);
  }

async function changeBalance(userId: string, value: number) {
  const ok = confirm(
    `Buchung bestätigen?\n\nBetrag: ${value.toFixed(2)} €`
  );

  if (!ok) return;

  const { error } = await supabase.rpc("change_balance_with_history", {
    p_user_id: userId,
    p_amount: value,
    p_description: value > 0 ? "Geld eingezahlt" : "Geld abgezogen",
  });

  if (error) {
    alert("Buchung fehlgeschlagen: " + error.message);
    return;
  }

  await refreshSelectedUser(userId);
  await loadData();
}

async function bookDrink(userId: string, drink: Drink) {
  const ok = confirm(
    `${drink.name} für ${Number(drink.price).toFixed(2)} € buchen?`
  );

  if (!ok) return;

  const { error } = await supabase.rpc("book_drink", {
    p_user_id: userId,
    p_drink_id: drink.id,
  });

  if (error) {
    alert("Buchung fehlgeschlagen: " + error.message);
    return;
  }

  await refreshSelectedUser(userId);
  await loadData();
}

async function changeStock(drinkId: string, amount: number) {
  const { error } = await supabase.rpc("update_drink_stock", {
    p_drink_id: drinkId,
    p_amount: amount,
  });

  if (error) {
    alert("Bestand konnte nicht geändert werden: " + error.message);
    return;
  }

  await loadData();
}

  async function createDrink() {
    if (!drinkName.trim() || !drinkPrice.trim()) {
      alert("Name und Preis fehlen");
      return;
    }

    let imageUrl = "";

    if (drinkImage) {
      const fileName = `${Date.now()}-${drinkImage.name}`;

      const { error: uploadError } = await supabase.storage
        .from("drink-images")
        .upload(fileName, drinkImage);

      if (uploadError) {
        alert("Bild-Upload fehlgeschlagen: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("drink-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("drinks").insert({
  name: drinkName.trim(),
  price: Number(drinkPrice),
  image_url: imageUrl,
  active: true,
  stock: 0,
});

    if (error) {
      alert("Getränk konnte nicht erstellt werden: " + error.message);
      return;
    }

    setDrinkName("");
    setDrinkPrice("");
    setDrinkImage(null);
    await loadData();
  }

  async function updateDrink(drinkId: string) {
    if (!editDrinkName.trim() || !editDrinkPrice.trim()) {
      alert("Name und Preis fehlen");
      return;
    }

    let imageUrl: string | undefined = undefined;

    if (editDrinkImage) {
      const fileName = `${Date.now()}-${editDrinkImage.name}`;

      const { error: uploadError } = await supabase.storage
        .from("drink-images")
        .upload(fileName, editDrinkImage);

      if (uploadError) {
        alert("Bild-Upload fehlgeschlagen: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("drink-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const updateData: any = {
      name: editDrinkName.trim(),
      price: Number(editDrinkPrice),
    };

    if (imageUrl) {
      updateData.image_url = imageUrl;
    }

    const { error } = await supabase
      .from("drinks")
      .update(updateData)
      .eq("id", drinkId);

    if (error) {
      alert("Getränk konnte nicht geändert werden: " + error.message);
      return;
    }

    setEditingDrinkId(null);
    setEditDrinkName("");
    setEditDrinkPrice("");
    setEditDrinkImage(null);
    await loadData();
  }

  async function deleteDrink(id: string) {
    if (!confirm("Getränk wirklich löschen?")) return;

    await supabase.from("drinks").update({ active: false }).eq("id", id);
    await loadData();
  }

  async function createUser() {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert("Benutzername und Passwort fehlen");
      return;
    }

    const { error } = await supabase.from("users").insert({
      username: newUsername.trim(),
      password: newPassword.trim(),
      balance: 0,
      is_admin: newIsAdmin,
    });

    if (error) {
      alert("Benutzer konnte nicht erstellt werden: " + error.message);
      return;
    }

    setNewUsername("");
    setNewPassword("");
    setNewIsAdmin(false);
    await loadData();
  }

  async function toggleAdmin(user: User) {
    await supabase
      .from("users")
      .update({ is_admin: !user.is_admin })
      .eq("id", user.id);

    await loadData();
  }

  async function changePassword(userId: string) {
    const password = prompt("Neues Passwort eingeben:");
    if (!password) return;

    await supabase.from("users").update({ password }).eq("id", userId);
    alert("Passwort geändert");
  }

  async function deleteUser(id: string) {
    if (!confirm("Benutzer wirklich löschen?")) return;

    await supabase.from("users").delete().eq("id", id);
    await loadData();
  }

  function logout() {
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  function goHome() {
    setSelectedUser(null);
    setEditingDrinkId(null);
    setView("home");
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          {view !== "home" && (
            <button onClick={goHome} className="text-gray-400 mb-2">
              ← Zurück
            </button>
          )}
          <h1 className="text-3xl font-bold">Kasse</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-2xl font-bold"
          >
            Logout
          </button>

          <img
            src="/logo.jfif"
            alt="Jugendraum Hart 97"
            className="w-24 h-24 rounded-2xl bg-white object-contain p-2"
          />
        </div>
      </div>

      {view === "home" && (
        <div className="grid gap-4">
          <BigButton onClick={() => setView("selectUserForDrink")}>
            🍺 Getränke 
          </BigButton>

          <BigButton onClick={() => setView("selectUserForMoney")}>
            💰 Geld 
          </BigButton>

          <BigButton onClick={() => setView("manage")}>
            ⚙️ Verwaltung
          </BigButton>
        </div>
      )}

      {view === "selectUserForDrink" && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Benutzer wählen</h2>

          <div className="space-y-3">
            {users.map((u) => (
              <Card
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setView("selectDrink");
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl">{u.username}</span>
                  <span className="text-green-400 font-bold">
                    {Number(u.balance).toFixed(2)} €
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {view === "selectDrink" && selectedUser && (
        <section>
          <h2 className="text-2xl font-bold mb-1">{selectedUser.username}</h2>

          <p className="text-green-400 font-bold text-xl mb-5">
            Kontostand: {Number(selectedUser.balance).toFixed(2)} €
          </p>

          <div className="grid grid-cols-2 gap-3">
            {drinks.map((d) => (
              <button
                key={d.id}
                onClick={() => bookDrink(selectedUser.id, d)}
                className="bg-blue-600 active:scale-95 p-4 rounded-2xl flex flex-col items-center gap-2 font-bold"
              >
                {d.image_url && (
                  <img
                    src={d.image_url}
                    alt={d.name}
                    className="w-20 h-20 object-cover rounded-xl bg-white"
                  />
                )}

                <span>{d.name}</span>
                <span>-{Number(d.price).toFixed(2)} €</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {view === "selectUserForMoney" && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Benutzer wählen</h2>

          <div className="space-y-3">
            {users.map((u) => (
              <Card
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setView("money");
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl">{u.username}</span>
                  <span className="text-green-400 font-bold">
                    {Number(u.balance).toFixed(2)} €
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {view === "money" && selectedUser && (
        <section>
          <h2 className="text-2xl font-bold mb-1">{selectedUser.username}</h2>

          <p className="text-green-400 font-bold text-xl mb-5">
            Kontostand: {Number(selectedUser.balance).toFixed(2)} €
          </p>

          <input
            value={amount}
            type="number"
            step="0.01"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl mb-4 text-2xl font-bold"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => changeBalance(selectedUser.id, Number(amount))}
              className="bg-green-600 active:scale-95 p-5 rounded-2xl text-xl font-bold"
            >
              + Geld
            </button>

            <button
              onClick={() => changeBalance(selectedUser.id, -Number(amount))}
              className="bg-red-600 active:scale-95 p-5 rounded-2xl text-xl font-bold"
            >
              - Geld
            </button>
          </div>
        </section>
      )}

      {view === "manage" && (
        <section className="grid gap-4">
          <BigButton onClick={() => setView("manageDrinks")}>
            🧃 Getränke verwalten
          </BigButton>

          <BigButton onClick={() => setView("manageUsers")}>
            👥 Benutzer verwalten
          </BigButton>
<BigButton onClick={() => setView("inventory")}>
  📦 Inventur
</BigButton>
        </section>
      )}

      {view === "manageDrinks" && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Getränke verwalten</h2>

          <div className="bg-gray-900 p-4 rounded-2xl mb-6">
            <input
              value={drinkName}
              onChange={(e) => setDrinkName(e.target.value)}
              placeholder="Getränkename"
              className="Input mb-3"
            />

            <input
              value={drinkPrice}
              onChange={(e) => setDrinkPrice(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Preis"
              className="Input mb-3"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setDrinkImage(e.target.files?.[0] || null)}
              className="mb-4"
            />

            <button
              onClick={createDrink}
              className="w-full bg-green-600 p-4 rounded-2xl font-bold"
            >
              Getränk speichern
            </button>
          </div>

          <div className="space-y-3">
            {drinks.map((d) => (
              <div key={d.id} className="bg-gray-900 p-4 rounded-2xl">
                {editingDrinkId === d.id ? (
                  <div>
                    <input
                      value={editDrinkName}
                      onChange={(e) => setEditDrinkName(e.target.value)}
                      placeholder="Name"
                      className="Input mb-3"
                    />

                    <input
                      value={editDrinkPrice}
                      onChange={(e) => setEditDrinkPrice(e.target.value)}
                      type="number"
                      step="0.01"
                      placeholder="Preis"
                      className="Input mb-3"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditDrinkImage(e.target.files?.[0] || null)
                      }
                      className="mb-4"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateDrink(d.id)}
                        className="bg-green-600 p-3 rounded-xl font-bold"
                      >
                        Speichern
                      </button>

                      <button
                        onClick={() => {
                          setEditingDrinkId(null);
                          setEditDrinkImage(null);
                        }}
                        className="bg-gray-600 p-3 rounded-xl font-bold"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      {d.image_url && (
                        <img
                          src={d.image_url}
                          alt={d.name}
                          className="w-14 h-14 object-cover rounded-xl bg-white"
                        />
                      )}

                      <div>
                        <p className="font-bold">{d.name}</p>
                        <p className="text-gray-400">
                          {Number(d.price).toFixed(2)} €
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <button
                        onClick={() => {
                          setEditingDrinkId(d.id);
                          setEditDrinkName(d.name);
                          setEditDrinkPrice(String(d.price));
                          setEditDrinkImage(null);
                        }}
                        className="bg-blue-600 px-4 py-2 rounded-xl"
                      >
                        Bearbeiten
                      </button>

                      <button
                        onClick={() => deleteDrink(d.id)}
                        className="bg-red-600 px-4 py-2 rounded-xl"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "manageUsers" && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Benutzer verwalten</h2>

          <div className="bg-gray-900 p-4 rounded-2xl mb-6">
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Benutzername"
              className="Input mb-3"
            />

            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Passwort"
              className="Input mb-3"
            />

            <label className="flex gap-2 mb-4">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
              />
              Adminrechte
            </label>

            <button
              onClick={createUser}
              className="w-full bg-green-600 p-4 rounded-2xl font-bold"
            >
              Benutzer erstellen
            </button>
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-900 p-4 rounded-2xl">
                <div className="mb-3">
                  <p className="font-bold text-xl">{u.username}</p>
                  <p className="text-gray-400">
                    {u.is_admin ? "Admin" : "Benutzer"} ·{" "}
                    {Number(u.balance).toFixed(2)} €
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => changePassword(u.id)}
                    className="bg-blue-600 p-3 rounded-xl font-bold"
                  >
                    Passwort ändern
                  </button>

                  <button
                    onClick={() => toggleAdmin(u)}
                    className="bg-purple-600 p-3 rounded-xl font-bold"
                  >
                    {u.is_admin ? "Admin entfernen" : "Admin geben"}
                  </button>

                  <button
                    onClick={() => deleteUser(u.id)}
                    className="bg-red-600 p-3 rounded-xl font-bold"
                  >
                    Benutzer löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
{view === "inventory" && (
  <section>
    <h2 className="text-2xl font-bold mb-4">Inventur</h2>

    <div className="space-y-3">
      {drinks.map((d) => (
        <div key={d.id} className="bg-gray-900 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {d.image_url && (
                <img
                  src={d.image_url}
                  alt={d.name}
                  className="w-14 h-14 object-cover rounded-xl bg-white"
                />
              )}

              <div>
                <p className="font-bold text-xl">{d.name}</p>
                <p className={Number(d.stock) <= 5 ? "text-red-400" : "text-green-400"}>
                  Bestand: {d.stock}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => changeStock(d.id, -1)} className="bg-red-600 p-3 rounded-xl font-bold">
              -1
            </button>

            <button onClick={() => changeStock(d.id, 1)} className="bg-green-600 p-3 rounded-xl font-bold">
              +1
            </button>

            <button onClick={() => changeStock(d.id, 10)} className="bg-green-700 p-3 rounded-xl font-bold">
              +10
            </button>

            <button onClick={() => changeStock(d.id, 20)} className="bg-blue-600 p-3 rounded-xl font-bold">
              +20
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
)}

    </main>
  );
}

function BigButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-900 hover:bg-blue-600 active:scale-95 transition p-7 rounded-3xl text-2xl font-bold text-left"
    >
      {children}
    </button>
  );
}

function Card({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-900 p-5 rounded-2xl cursor-pointer active:scale-95"
    >
      {children}
    </div>
  );
}