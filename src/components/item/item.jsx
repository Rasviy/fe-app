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
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    fetchItems();
    fetchUnits();
    fetchCategories();
  }, []);

  /** UNIVERSAL PARSER (fix utama) */
  function parseResponse(json) {
    if (!json) return [];

    if (Array.isArray(json)) return json;

    // pagination structure
    if (Array.isArray(json.data?.items)) return json.data.items;

    // normal `{ data: [...] }`
    if (Array.isArray(json.data)) return json.data;

    if (Array.isArray(json.items)) return json.items;

    return [];
  }

  /** GET ITEMS */
  async function fetchItems() {
    try {
      const res = await fetch(API_BASE);
      const json = await res.json().catch(() => null);

      let list = parseResponse(json);

      // remove soft-deleted
      list = list.filter((i) => !i.deleted_at);

      setItems(list);
    } catch (e) {
      console.error("FETCH ITEMS ERROR:", e);
      setItems([]);
    }
  }

  async function fetchUnits() {
    try {
      const res = await fetch(API_UNITS);
      const json = await res.json();
      setUnits(parseResponse(json));
    } catch {}
  }

  async function fetchCategories() {
    try {
      const res = await fetch(API_CATEGORIES);
      const json = await res.json();
      setCategories(parseResponse(json));
    } catch {}
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  }

  /** CREATE */
  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        alert("Gagal create item");
        return;
      }

      const created = json.data || json.item || json;

      // langsung tambah
      setItems((prev) => [...prev, created]);

      setForm(initialForm);
      alert("Item berhasil dibuat!");
    } catch (err) {
      console.error(err);
    }

    setSubmitting(false);
  }

  /** EDIT MODE */
  function startEdit(item) {
    setIsEditing(true);
    setForm({
      id: item.id,
      name: item.name,
      supplier: item.supplier ?? "",
      price: item.price,
      stock: item.stock,
      description: item.description ?? "",
      code: item.code ?? "",
      image: item.image ?? "",
      unit_id: item.unit_id ?? item.unit?.id ?? "",
      category_id: item.category_id ?? item.category?.id ?? "",
    });

    window.scrollTo(0, 0);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(initialForm);
  }

  /** UPDATE */
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!form.id) return;

    setSubmitting(true);

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      const res = await fetch(`${API_BASE}/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        alert("Gagal update item");
        return;
      }

      const updated = json.data || json.item || json;

      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      cancelEdit();
      alert("Item berhasil diupdate!");
    } catch (err) {
      console.error(err);
    }

    setSubmitting(false);
  }

  /** SOFT DELETE */
  async function handleDelete(item) {
    if (!confirm("Hapus item ini?")) return;

    try {
      const res = await fetch(`${API_BASE}/${item.id}`, {
        method: "PATCH",
      });

      if (!res.ok) {
        alert("Gagal delete");
        return;
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error(err);
    }
  }

  function fmtPrice(x) {
    if (!x) return "-";
    return "Rp" + Number(x).toLocaleString("id-ID");
  }

  return (
    <div className="flex min-h-screen">
      <Layout />

      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-2xl font-semibold mb-4">Item Management</h1>

          {/* FORM */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="font-medium mb-3">
              {isEditing ? "Edit Item" : "Create New Item"}
            </h2>

            <form
              onSubmit={isEditing ? handleSaveEdit : handleCreate}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Item Name"
                  required
                />
                <input
                  className="input"
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  placeholder="Supplier"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  className="input"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Price"
                />
                <input
                  type="number"
                  className="input"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="Stock"
                />

                <select
                  className="input"
                  name="unit_id"
                  value={form.unit_id}
                  onChange={handleChange}
                >
                  <option value="">Pilih Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  className="input"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                className="input"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Code"
              />

              <textarea
                className="input h-24"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
              />

              <div>
                <input type="file" accept="image/*" onChange={handleFileChange} />

                {form.image ? (
                  <img
                    src={form.image}
                    className="h-40 mt-3 rounded object-cover"
                    alt="preview"
                  />
                ) : (
                  <div className="h-40 bg-gray-100 mt-3 flex items-center justify-center rounded text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={submitting}
                >
                  {submitting
                    ? isEditing
                      ? "Saving..."
                      : "Creating..."
                    : isEditing
                    ? "Save Changes"
                    : "Create Item"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* TABLE */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-medium mb-3">Existing Items</h3>

            {items.length === 0 ? (
              <div className="text-gray-500">No items found.</div>
            ) : (
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
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 flex gap-3">
                        <div className="h-12 w-12 bg-gray-100 border rounded overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              className="object-cover h-full w-full"
                              alt=""
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              No Img
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </td>

                      <td className="py-3">{item.code || "-"}</td>
                      <td className="py-3">{item.category?.name || "-"}</td>
                      <td className="py-3">{item.supplier || "-"}</td>
                      <td className="py-3">{item.stock ?? "-"}</td>
                      <td className="py-3">{item.unit?.name || "-"}</td>
                      <td className="py-3">{fmtPrice(item.price)}</td>

                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 border rounded text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          className="px-3 py-1 border rounded text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: .6rem .75rem;
          border: 1px solid #e5e7eb;
          border-radius: .5rem;
        }
      `}</style>
    </div>
  );
}
