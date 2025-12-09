// src/pages/CategoryPage.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import Layout from "../../pages/layout";

const API_URL = "http://localhost:3000/categories";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("active");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await fetch(API_URL);
    const data = await res.json();

    setCategories(data.filter((c) => !c.deleted_at));
    setDeletedCategories(data.filter((c) => c.deleted_at));
  }

  // CREATE
  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert("Name & code required!");
      return;
    }

    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code,
        status,
        deleted_at: null,
      }),
    });

    fetchCategories();
    setName("");
    setCode("");
    setStatus("active");
  }

  // EDIT
  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditCode(cat.code);
    setEditStatus(cat.status ?? "active");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCode("");
    setEditStatus("active");
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    await fetch(`${API_URL}/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        code: editCode,
        status: editStatus,
      }),
    });

    cancelEdit();
    fetchCategories();
  }

  // SOFT DELETE
  async function handleDelete(id) {
    if (!confirm("Hapus kategori ini?")) return;
    
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    fetchCategories();
  }

  // RESTORE
  async function handleRestore(id) {
    await fetch(`${API_URL}/${id}/restore`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    fetchCategories();
  }

  return (
  <Layout>
    <div className="max-w-6xl mx-auto my-10 space-y-10">
      <h1 className="text-3xl font-bold">Category Management</h1>
      <p className="text-gray-500 -mt-2 mb-6">Manage active & deleted categories.</p>

      {/* CREATE */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create New Category</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Category code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
            >
              + Create
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVE CATEGORIES */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Existing Categories</h2>

        <table className="w-full text-left">
          <thead className="text-sm text-gray-600 border-b">
            <tr>
              <th className="py-2">Category Name</th>
              <th className="py-2">Code</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat) => {
              const editing = editingId === cat.id;
              return (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    {editing ? (
                      <input
                        className="border rounded px-2 py-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      <span className="font-medium">{cat.name}</span>
                    )}
                  </td>

                  <td className="py-3">
                    {editing ? (
                      <input
                        className="border rounded px-2 py-1"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                      />
                    ) : (
                      cat.code
                    )}
                  </td>

                  <td className="py-3">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      cat.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {cat.status}
                    </span>
                  </td>

                  <td className="py-3 text-right space-x-4">
                    {editing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-200 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="hover:text-yellow-600"
                        >
                          <FontAwesomeIcon
                            icon={faPenToSquare}
                            className="text-yellow-500 text-lg"
                          />
                        </button>

                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="hover:text-red-700"
                        >
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            className="text-red-600 text-lg"
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

      {/* SOFT DELETED */}
      {deletedCategories.length > 0 && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-red-600">Soft Deleted Categories</h2>

          <table className="w-full text-left">
            <thead className="text-sm text-gray-600 border-b">
              <tr>
                <th className="py-2">Category Name</th>
                <th className="py-2">Code</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {deletedCategories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{cat.name}</td>
                  <td className="py-3">{cat.code}</td>
                  <td className="py-3 text-right space-x-4">
                    <button
                      onClick={() => handleRestore(cat.id)}
                      className="hover:text-blue-600"
                    >
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className="text-blue-600 text-xl"
                      />
                    </button>

                    <button
                      onClick={() => {
                        const sure = confirm("Permanent delete?");
                        if (sure) handleDelete(cat.id);
                      }}
                      className="hover:text-red-700"
                    >
                      <FontAwesomeIcon
                        icon={faTrashCan}
                        className="text-red-600 text-xl"
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
