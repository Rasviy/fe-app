// src/components/ItemManagement.jsx
import React, { useEffect, useState } from "react";
import Layout from "../../pages/layout";

const API_BASE = "http://localhost:3000/items";
const API_UNITS = "http://localhost:3000/units";
const API_CATEGORIES = "http://localhost:3000/categories";

export default function ItemManagement() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialForm = {
    id: null,
    name: "",
    supplier: "",
    price: "",
    stock: "",
    description: "",
    code: "",
    image: "",
    unit_id: "",
    category_id: "",
  };
  const [form, setForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchUnits();
    fetchCategories();
  }, []);

  // Fetch items
  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Gagal mengambil items");
      const data = await res.json();
      // Pastikan semua item punya id
      const itemsArray = Array.isArray(data) ? data : data?.data || [];
      setItems(itemsArray.map((it) => ({ ...it, id: it.id || it._id || Date.now() + Math.random() })));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnits() {
    try {
      const res = await fetch(API_UNITS);
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data || [];
      setUnits(arr);
    } catch {}
  }

  async function fetchCategories() {
    try {
      const res = await fetch(API_CATEGORIES);
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCategories(arr);
    } catch {}
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  }

  // CREATE
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.stock || !form.unit_id || !form.category_id)
      return alert("Nama, stock, unit, dan kategori wajib diisi");

    const payload = {
      name: form.name,
      supplier: form.supplier || undefined,
      price: form.price ? Number(form.price) : undefined,
      stock: Number(form.stock),
      description: form.description || undefined,
      code: form.code || undefined,
      image: form.image || undefined,
      unit_id: form.unit_id,
      category_id: form.category_id,
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal membuat item");
      const data = await res.json();
      const newItem = data.item || data;
      if (!newItem.id) newItem.id = Date.now() + Math.random();
      setItems((prev) => [newItem, ...prev]);
      setForm(initialForm);
    } catch (err) {
      alert(err.message || "Error saat membuat item");
    }
  }

  // EDIT
  function startEdit(item) {
    setIsEditing(true);
    setForm({
      id: item.id,
      name: item.name || "",
      supplier: item.supplier || "",
      price: item.price != null ? String(item.price) : "",
      stock: item.stock != null ? String(item.stock) : "",
      description: item.description || "",
      code: item.code || "",
      image: item.image || "",
      unit_id: item.unit?.id || item.unit_id || "",
      category_id: item.category?.id || item.category_id || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(initialForm);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!form.id || !form.name || !form.stock || !form.unit_id || !form.category_id)
      return alert("Nama, stock, unit, dan kategori wajib diisi");

    const payload = {
      name: form.name,
      supplier: form.supplier || undefined,
      price: form.price ? Number(form.price) : undefined,
      stock: Number(form.stock),
      description: form.description || undefined,
      code: form.code || undefined,
      image: form.image || undefined,
      unit_id: form.unit_id,
      category_id: form.category_id,
    };

    try {
      const res = await fetch(`${API_BASE}/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      const updated = await res.json();
      const updatedItem = updated.item || updated;
      setItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
      cancelEdit();
    } catch (err) {
      alert(err.message || "Error saat menyimpan item");
    }
  }

  // DELETE
  async function handleDelete(item) {
    if (!confirm(`Hapus item "${item.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus item");
      const data = await res.json();
      const deletedItem = data.item || item;
      setItems((prev) => prev.filter((it) => it.id !== deletedItem.id));
    } catch (err) {
      alert(err.message || "Error saat menghapus item");
    }
  }

  function fmtPrice(p) {
    if (p == null || p === "") return "-";
    const n = Number(p);
    if (Number.isNaN(n)) return "-";
    return `$${n.toFixed(2)}`;
  }

  return (
    <div className="flex min-h-screen">
      <Layout />
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Item Management</h1>

          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-medium mb-3">{isEditing ? "Edit Item" : "Create New Item"}</h2>
            <form onSubmit={isEditing ? handleSaveEdit : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" className="input" />
                <input name="supplier" value={form.supplier} onChange={handleChange} placeholder="Supplier" className="input" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="Price" className="input" />
                <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock" className="input" />
                <select name="unit_id" value={form.unit_id} onChange={handleChange} className="input">
                  <option value="">-- Select Unit --</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select name="category_id" value={form.category_id} onChange={handleChange} className="input">
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <input name="code" value={form.code} onChange={handleChange} placeholder="Item Code" className="input" />
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input h-24" />

              {/* File Upload */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Upload Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="input" />
                {form.image ? (
                  <img src={form.image} alt="preview" className="mt-3 h-40 w-full object-cover rounded" />
                ) : (
                  <div className="mt-3 h-40 w-full bg-gray-100 rounded flex items-center justify-center text-sm text-gray-400">No image</div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{isEditing ? "Save Changes" : "Create Item"}</button>
                {isEditing && <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded border">Cancel</button>}
              </div>
            </form>
          </div>

          {/* Items table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium mb-4">Existing Items</h3>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500">No items found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="py-2">Item</th>
                      <th className="py-2">Code</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Supplier</th>
                      <th className="py-2">Stock</th>
                      <th className="py-2">Unit</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="py-3 flex items-center gap-3">
                          <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center border">
                            {item.image ? <img src={item.image} alt="thumb" className="h-full w-full object-cover" /> : <span className="text-2xl">🍎</span>}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </td>
                        <td className="py-3">{item.code || "-"}</td>
                        <td className="py-3">{item.category?.name || "-"}</td>
                        <td className="py-3">{item.supplier || "-"}</td>
                        <td className="py-3">{item.stock}</td>
                        <td className="py-3">{item.unit?.name || "-"}</td>
                        <td className="py-3">{fmtPrice(item.price)}</td>
                        <td className="py-3 flex gap-2">
                          <button onClick={() => startEdit(item)} className="px-3 py-1 rounded border text-sm">Edit</button>
                          <button onClick={() => handleDelete(item)} className="px-3 py-1 rounded border text-sm text-red-600">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .input {
            width: 100%;
            padding: 0.6rem 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            background: white;
          }
          .input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
            border-color: rgba(37, 99, 235, 1);
          }
        `}</style>
      </div>
    </div>
  );
}
