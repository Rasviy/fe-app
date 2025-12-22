// src/components/ItemManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../pages/layout";

const API_BASE = "http://localhost:3000/items";
const API_UNITS = "http://localhost:3000/units";
const API_CATEGORIES = "http://localhost:3000/categories";

export default function ItemManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [softDeletedItems, setSoftDeletedItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [codeError, setCodeError] = useState("");

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

      // Pisahkan item yang aktif dan yang soft deleted
      const activeItems = list.filter((i) => !i.deleted_at);
      const deletedItems = list.filter((i) => i.deleted_at);

      setItems(activeItems);
      setSoftDeletedItems(deletedItems);
      
      // Tampilkan recycle bin jika ada item yang dihapus
      if (deletedItems.length > 0) {
        setShowRecycleBin(true);
      }
    } catch (e) {
      console.error("FETCH ITEMS ERROR:", e);
      setItems([]);
      setSoftDeletedItems([]);
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

  // Fungsi untuk mendapatkan category code berdasarkan category_id
  function getCategoryCode(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.code || "" : "";
  }

  // Fungsi untuk mendapatkan unit name berdasarkan unit_id
  function getUnitName(unitId) {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name || "" : "";
  }

  // Fungsi untuk membentuk full code: [itemCode]-[categoryCode]-[unitName]
  function generateFullCode(itemCode, categoryId, unitId) {
    const categoryCode = getCategoryCode(categoryId);
    const unitName = getUnitName(unitId);
    
    let parts = [];
    if (itemCode) parts.push(itemCode);
    if (categoryCode) parts.push(categoryCode);
    if (unitName) parts.push(unitName);
    
    return parts.join("-");
  }

  // Fungsi untuk mendapatkan full code untuk item
  function getItemFullCode(item) {
    return generateFullCode(
      item.code,
      item.category_id || item.category?.id,
      item.unit_id || item.unit?.id
    );
  }

  // Fungsi untuk mendapatkan item code base (tanpa category dan unit)
  function getItemBaseCode(item) {
    return item.code || "";
  }

  // Fungsi untuk validasi kode unik
  function isCodeUnique(code, currentId = null) {
    // Cek di items aktif
    const existsInItems = items.some(item => 
      item.code === code && item.id !== currentId
    );
    
    // Cek di soft deleted items
    const existsInDeleted = softDeletedItems.some(item => 
      item.code === code && item.id !== currentId
    );
    
    return !existsInItems && !existsInDeleted;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    
    // Validasi untuk field code
    if (name === "code") {
      // Cek apakah kode sudah digunakan
      if (value.trim() !== "") {
        if (!isCodeUnique(value, form.id)) {
          setCodeError("Kode ini sudah digunakan. Silakan gunakan kode lain.");
        } else {
          setCodeError("");
        }
      } else {
        setCodeError("");
      }
    }
    
    setForm({ ...form, [name]: value });
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
    
    // Validasi kode unik
    if (!isCodeUnique(form.code)) {
      alert("Kode item sudah digunakan. Silakan gunakan kode lain.");
      return;
    }
    
    if (codeError) {
      alert("Terdapat error pada kode item. Silakan perbaiki terlebih dahulu.");
      return;
    }
    
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
      setCodeError("");
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

    // Reset error saat edit
    setCodeError("");
    
    window.scrollTo(0, 0);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(initialForm);
    setCodeError("");
  }

  /** UPDATE */
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!form.id) return;
    
    // Validasi kode unik
    if (!isCodeUnique(form.code, form.id)) {
      alert("Kode item sudah digunakan. Silakan gunakan kode lain.");
      return;
    }
    
    if (codeError) {
      alert("Terdapat error pada kode item. Silakan perbaiki terlebih dahulu.");
      return;
    }

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

      // Pindahkan item ke soft deleted
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSoftDeletedItems((prev) => [...prev, { ...item, deleted_at: new Date().toISOString() }]);
      setShowRecycleBin(true);
      
      alert("Item berhasil dihapus (soft delete)");
    } catch (err) {
      console.error(err);
    }
  }

  /** RESTORE SOFT DELETED ITEM */
  async function handleRestore(item) {
    if (!confirm("Restore item ini?")) return;

    try {
      const res = await fetch(`${API_BASE}/${item.id}/restore`, {
        method: "PUT",
      });

      if (!res.ok) {
        alert("Gagal restore item");
        return;
      }

      // Pindahkan item kembali ke items aktif
      const restoredItem = { ...item, deleted_at: null };
      setSoftDeletedItems((prev) => prev.filter((i) => i.id !== item.id));
      setItems((prev) => [...prev, restoredItem]);
      
      alert("Item berhasil direstore!");
    } catch (err) {
      console.error(err);
    }
  }

  /** PERMANENT DELETE */
  async function handlePermanentDelete(item) {
    if (!confirm("Hapus permanen item ini? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      const res = await fetch(`${API_BASE}/${item.id}/permanent`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Gagal menghapus permanen");
        return;
      }

      // Hapus dari soft deleted items
      setSoftDeletedItems((prev) => prev.filter((i) => i.id !== item.id));
      
      alert("Item berhasil dihapus permanen");
    } catch (err) {
      console.error(err);
    }
  }

  /** FORMAT HARGA */
  function fmtPrice(x) {
    if (!x) return "-";
    return "Rp" + Number(x).toLocaleString("id-ID");
  }

  /** FORMAT TANGGAL */
  function fmtDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Fungsi untuk navigasi ke halaman SKU dengan data item
  const goToSKU = (item) => {
    // Kirim data item ke halaman SKU melalui state
    navigate("/sku", { 
      state: { 
        itemId: item.id,
        itemName: item.name,
        itemCode: getItemBaseCode(item), // Gunakan base code saja
        itemFullCode: getItemFullCode(item)
      }
    });
  };

  // Fungsi untuk generate kode unik otomatis (opsional)
  const generateUniqueCode = () => {
    let newCode = `ITEM${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Pastikan kode unik
    while (!isCodeUnique(newCode, form.id)) {
      newCode = `ITEM${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    setForm({ ...form, code: newCode });
    setCodeError("");
  };

  return (
    <div className="flex min-h-screen">
      <Layout />

      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Item Management</h1>
          </div>

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
                  min="0"
                />
                <input
                  type="number"
                  className="input"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="Stock"
                  min="0"
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
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex gap-2 mb-1">
                    <input
                      className="input"
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="Item Code (Harus Unik)"
                      required
                      style={{ borderColor: codeError ? '#ef4444' : '' }}
                    />
                    <button
                      type="button"
                      onClick={generateUniqueCode}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm whitespace-nowrap"
                    >
                      Generate Code
                    </button>
                  </div>
                  {codeError && (
                    <div className="text-red-500 text-sm mt-1">{codeError}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Kode harus unik dan tidak boleh duplikat
                  </div>
                </div>
                <div className="flex items-center justify-center p-3 bg-gray-50 rounded border">
                  <span className="text-sm text-gray-600">
                    Full Code:{" "}
                    <span className="font-mono font-medium">
                      {generateFullCode(form.code, form.category_id, form.unit_id)}
                    </span>
                  </span>
                </div>
              </div>

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
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || codeError}
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
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* TABLE EXISTING ITEMS */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Existing Items</h3>
              <div className="text-sm text-gray-500">
                Total: {items.length} items
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-gray-500 py-4">No items found.</div>
            ) : (
              <table className="min-w-full divide-y">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="py-2">Item</th>
                    <th className="py-2">Code (Full)</th>
                    <th className="py-2">Supplier</th>
                    <th className="py-2">Stock</th>
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
                              alt={item.name}
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

                      <td className="py-3">
                        <div className="font-mono font-medium text-blue-600">
                          {getItemFullCode(item)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <div>Item Code: {item.code}</div>
                          <div>Category: {getCategoryCode(item.category_id || item.category?.id) || "-"}</div>
                          <div>Unit: {getUnitName(item.unit_id || item.unit?.id) || "-"}</div>
                        </div>
                      </td>
                      <td className="py-3">{item.supplier || "-"}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${item.stock > 10 ? 'bg-green-100 text-green-800' : item.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {item.stock ?? "0"}
                        </span>
                      </td>
                      <td className="py-3">{fmtPrice(item.price)}</td>

                      <td className="py-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="px-3 py-1 border rounded text-sm hover:bg-gray-50 w-full"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="px-3 py-1 border rounded text-red-600 text-sm hover:bg-red-50 w-full"
                            >
                              Delete
                            </button>
                          </div>
                          <button
                            onClick={() => goToSKU(item)}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 w-full"
                          >
                            View SKU
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* TABLE RECYCLE BIN (Soft Deleted) */}
          {showRecycleBin && (
            <div className="bg-white p-6 rounded shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-red-600">Recycle Bin (Soft Deleted)</h3>
                <div className="text-sm text-gray-500">
                  Total: {softDeletedItems.length} deleted items
                </div>
              </div>

              {softDeletedItems.length === 0 ? (
                <div className="text-gray-500 py-4">No deleted items found.</div>
              ) : (
                <table className="min-w-full divide-y">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="py-2">Item</th>
                      <th className="py-2">Code (Full)</th>
                      <th className="py-2">Supplier</th>
                      <th className="py-2">Stock</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">Deleted At</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {softDeletedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 flex gap-3">
                          <div className="h-12 w-12 bg-gray-100 border rounded overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                className="object-cover h-full w-full opacity-70"
                                alt={item.name}
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

                        <td className="py-3">
                          <div className="font-mono font-medium text-blue-600 opacity-70">
                            {getItemFullCode(item)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 opacity-70">
                            <div>Item Code: {item.code}</div>
                            <div>Category: {getCategoryCode(item.category_id || item.category?.id) || "-"}</div>
                            <div>Unit: {getUnitName(item.unit_id || item.unit?.id) || "-"}</div>
                          </div>
                        </td>
                        <td className="py-3">{item.supplier || "-"}</td>
                        <td className="py-3">{item.stock ?? "0"}</td>
                        <td className="py-3">{fmtPrice(item.price)}</td>
                        <td className="py-3 text-sm text-gray-500">
                          {fmtDate(item.deleted_at)}
                        </td>

                        <td className="py-3">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleRestore(item)}
                              className="px-3 py-1 border rounded text-green-600 text-sm hover:bg-green-50"
                            >
                              Restore
                            </button>

                            <button
                              onClick={() => handlePermanentDelete(item)}
                              className="px-3 py-1 border rounded text-red-600 text-sm hover:bg-red-50"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TOMBOL UNTUK MENYEMBUNYIKAN RECYCLE BIN */}
              <div className="mt-4 pt-4 border-t flex justify-end">
                <button
                  onClick={() => setShowRecycleBin(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Hide Recycle Bin
                </button>
              </div>
            </div>
          )}

          {/* TOMBOL UNTUK MENAMPILKAN RECYCLE BIN JIKA TERSEMBUNYI */}
          {!showRecycleBin && softDeletedItems.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowRecycleBin(true)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
              >
                Show Recycle Bin ({softDeletedItems.length} deleted items)
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: .6rem .75rem;
          border: 1px solid #e5e7eb;
          border-radius: .5rem;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}