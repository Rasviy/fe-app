import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrashCan,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import Layout from "../../pages/layout";

const API_URL = "http://localhost:3000/categories";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await fetch(API_URL);
    const data = await res.json();

    // jaga-jaga kalau backend mengirim semua
    setCategories(data.filter((c) => !c.deleted_at));
    setDeletedCategories(data.filter((c) => c.deleted_at));
  }

  // ================= CREATE =================
  async function handleCreate(e) {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      alert("Name & code required!");
      return;
    }

    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });

    setName("");
    setCode("");
    fetchCategories();
  }

  // ================= EDIT =================
  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditCode(cat.code);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCode("");
  }

  async function handleSaveEdit() {
    await fetch(`${API_URL}/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        code: editCode,
      }),
    });

    cancelEdit();
    fetchCategories();
  }

  // ================= SOFT DELETE (FIXED) =================
  async function handleDelete(id) {
    if (!confirm("Hapus kategori ini?")) return;

    await fetch(`${API_URL}/${id}`, { method: "DELETE" });

    const deletedItem = categories.find((c) => c.id === id);

    if (deletedItem) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletedCategories((prev) => [
        {
          ...deletedItem,
          deleted_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  }

  // ================= RESTORE =================
  async function handleRestore(id) {
    await fetch(`${API_URL}/${id}/restore`, { method: "PUT" });

    const restoredItem = deletedCategories.find((c) => c.id === id);

    if (restoredItem) {
      setDeletedCategories((prev) => prev.filter((c) => c.id !== id));
      setCategories((prev) => [
        { ...restoredItem, deleted_at: null },
        ...prev,
      ]);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto my-10 space-y-10">
        <h1 className="text-3xl font-bold">Category Management</h1>

        {/* CREATE */}
        <div className="bg-white p-6 rounded-xl border">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Category code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="col-span-2 bg-blue-600 text-white py-2 rounded">
              + Create
            </button>
          </form>
        </div>

        {/* ACTIVE TABLE */}
        <div className="bg-white p-6 rounded-xl border">
          <h2 className="font-semibold mb-4">Existing Categories</h2>

          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th>Name</th>
                <th>Code</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const editing = editingId === cat.id;

                return (
                  <tr key={cat.id} className="border-b">
                    <td>
                      {editing ? (
                        <input
                          className="border px-2"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="border px-2"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                        />
                      ) : (
                        cat.code
                      )}
                    </td>
                    <td>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                        Active
                      </span>
                    </td>
                    <td className="text-right space-x-3">
                      {editing ? (
                        <>
                          <button onClick={handleSaveEdit}>Save</button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)}>
                            <FontAwesomeIcon icon={faPenToSquare} className="text-yellow-400"
                            />
                          </button>
                          <button onClick={() => handleDelete(cat.id)}>
                            <FontAwesomeIcon
                              icon={faTrashCan}
                              className="text-red-600"
                            />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SOFT DELETE TABLE */}
        {deletedCategories.length > 0 && (
          <div className="bg-white p-6 rounded-xl border">
            <h2 className="text-red-600 font-semibold mb-4">
              Recycle Bin (Soft Deleted)
            </h2>

            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Deleted At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedCategories.map((cat) => (
                  <tr key={cat.id} className="border-b">
                    <td>{cat.name}</td>
                    <td>{cat.code}</td>
                    <td>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">
                        Deleted
                      </span>
                    </td>
                    <td className="text-red-600">
                      {formatDate(cat.deleted_at)}
                    </td>
                    <td className="text-right space-x-3">
                      <button onClick={() => handleRestore(cat.id)}>
                        <FontAwesomeIcon
                          icon={faRotateLeft}
                          className="text-blue-600"
                        />
                      </button>
                      <button onClick={() => handleDelete(cat.id)}>
                        <FontAwesomeIcon
                          icon={faTrashCan}
                          className="text-red-600"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
