// src/pages/CategoryPage.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";

// IMPORT LAYOUT (agar sidebar ikut tampil)
import Layout from "../../pages/layout";

const API_URL = "http://localhost:3000/categories";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);

  // Create state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("active");

  // Edit state
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
    setCategories(data);
  }

  // CREATE CATEGORY
  async function handleCreate(e) {
    e.preventDefault();

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, status }),
    });

    const created = await res.json();
    setCategories((prev) => [created, ...prev]);

    setName("");
    setCode("");
    setStatus("active");
  }

  // START EDIT
  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditCode(cat.code);
    setEditStatus(cat.status);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCode("");
    setEditStatus("active");
  }

  // SAVE EDIT
  async function handleSaveEdit(e) {
    e.preventDefault();

    const res = await fetch(`${API_URL}/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        code: editCode,
        status: editStatus,
      }),
    });

    const updated = await res.json();
    setCategories((prev) =>
      prev.map((c) => (c.id === editingId ? updated : c))
    );

    cancelEdit();
  }

  // DELETE CATEGORY
  async function handleDelete(id) {
    if (!confirm("Hapus kategori ini?")) return;

    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto my-10 space-y-8">
        <h1 className="text-3xl font-semibold">Category Management</h1>
        <p className="text-gray-500 -mt-2">
          Create, edit, and delete product categories.
        </p>

        {/* CREATE SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-5">
          <h2 className="text-lg font-semibold">Create New Category</h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Category Name</label>
                <input
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                  placeholder="type a new category here"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Category Code</label>
                <input
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                  placeholder="type new category code here"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`px-4 py-1.5 rounded-lg border ${
                    status === "active"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-100"
                  }`}
                >
                  Active
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("inactive")}
                  className={`px-4 py-1.5 rounded-lg border ${
                    status === "inactive"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-100"
                  }`}
                >
                  Inactive
                </button>

                <button
                  type="submit"
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
                >
                  + Create Category
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4">Existing Categories</h2>

          <table className="w-full text-left">
            <thead className="text-sm text-gray-500 border-b">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Code</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-400">
                    No categories yet
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const editing = editingId === cat.id;

                  return (
                    <tr key={cat.id} className="border-b">
                      <td className="py-4">
                        {editing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border rounded px-2 py-1"
                          />
                        ) : (
                          <div className="font-medium">{cat.name}</div>
                        )}
                      </td>

                      <td className="py-4">
                        {editing ? (
                          <input
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="border rounded px-2 py-1"
                          />
                        ) : (
                          cat.code
                        )}
                      </td>

                      <td className="py-4">
                        {editing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="border rounded px-2 py-1"
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              cat.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {cat.status}
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-right space-x-4">
                        {editing ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-indigo-600 text-white rounded"
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
                            <button onClick={() => startEdit(cat)}>
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="text-yellow-400 text-lg"
                              />
                            </button>

                            <button onClick={() => handleDelete(cat.id)}>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
