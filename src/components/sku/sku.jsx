import React, { useEffect, useState } from "react";
import Layout from "../../pages/layout";

/* ============================
   API HELPER
============================ */
const BASE = "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw data;
  return data;
}

const fetchItems = () => apiFetch("/items");
const fetchWarehouses = () => apiFetch("/warehouse");
const fetchSkus = () => apiFetch("/sku");
const fetchDeletedSkus = () => apiFetch("/sku/deleted");

const createSku = (body) =>
  apiFetch("/sku", { method: "POST", body: JSON.stringify(body) });

const updateSku = (id, body) =>
  apiFetch(`/sku/${id}`, { method: "PATCH", body: JSON.stringify(body) });

const softDeleteSku = (id) =>
  apiFetch(`/sku/${id}/soft-delete`, { method: "PATCH" });

const restoreSku = (id) =>
  apiFetch(`/sku/${id}/restore`, { method: "PUT" });

const hardDeleteSku = (id) =>
  apiFetch(`/sku/${id}/hard-delete`, { method: "DELETE" });

/* ============================
   BADGE STATUS
============================ */
function StatusBadge({ status }) {
  const base = "text-xs px-2 py-1 rounded-full font-medium";

  if (!status)
    return <span className={`${base} bg-gray-100 text-gray-700`}>Unknown</span>;

  const s = status.toLowerCase();
  if (s.includes("in"))
    return <span className={`${base} bg-green-100 text-green-700`}>In Stock</span>;
  if (s.includes("low"))
    return <span className={`${base} bg-yellow-100 text-yellow-700`}>Low</span>;
  if (s.includes("out"))
    return <span className={`${base} bg-red-100 text-red-700`}>Out</span>;

  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}

/* ============================
   MAIN PAGE
============================ */
export default function SkuPage() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [skus, setSkus] = useState([]);
  const [deletedSkus, setDeletedSkus] = useState([]);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  const [form, setForm] = useState({
    item_id: "",
    warehouse_id: "",
    code: "",
    color: "",
    status: "",
  });

  /* ============================
     LOAD DATA
  ============================ */
  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, whRes, skuRes] = await Promise.all([
        fetchItems(),
        fetchWarehouses(),
        fetchSkus(),
      ]);

      setItems(itemsRes.data || itemsRes);
      setWarehouses(whRes.data || whRes);
      setSkus(skuRes.data || skuRes);
      
      // Hanya load deleted items jika recycle bin sudah dibuka
      if (showRecycleBin) {
        try {
          const deletedRes = await fetchDeletedSkus();
          setDeletedSkus(deletedRes.data || deletedRes);
        } catch (err) {
          console.error("Gagal memuat data recycle bin:", err);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [showRecycleBin]);

  /* ============================
     HANDLER
  ============================ */
  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.item_id || !form.warehouse_id || !form.code)
      return setError("Item, Warehouse, dan Code wajib diisi");

    try {
      if (editingId) {
        await updateSku(editingId, form);
      } else {
        await createSku(form);
      }

      setEditingId(null);
      setForm({
        item_id: "",
        warehouse_id: "",
        code: "",
        color: "",
        status: "",
      });

      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data");
    }
  }

  function startEdit(sku) {
    setEditingId(sku.id);
    setForm({
      item_id: sku.item_id,
      warehouse_id: sku.warehouse_id,
      code: sku.code,
      color: sku.color,
      status: sku.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSoftDelete(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus SKU ini?")) return;
    
    try {
      await softDeleteSku(id);
      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus data");
    }
  }

  async function handleRestore(id) {
    try {
      await restoreSku(id);
      // Muat ulang data setelah restore
      const deletedRes = await fetchDeletedSkus();
      setDeletedSkus(deletedRes.data || deletedRes);
      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal mengembalikan data");
    }
  }

  async function handleHardDelete(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus permanen SKU ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      await hardDeleteSku(id);
      // Muat ulang data recycle bin
      const deletedRes = await fetchDeletedSkus();
      setDeletedSkus(deletedRes.data || deletedRes);
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus permanen data");
    }
  }

  async function toggleRecycleBin() {
    if (!showRecycleBin) {
      try {
        const deletedRes = await fetchDeletedSkus();
        setDeletedSkus(deletedRes.data || deletedRes);
      } catch (err) {
        console.error("Gagal memuat data recycle bin:", err);
        setDeletedSkus([]);
      }
    }
    setShowRecycleBin(!showRecycleBin);
  }

  /* ============================
     HELPER MAP NAME
  ============================ */
  const getItemName = (id) =>
    items.find((i) => i.id === id)?.name || "-";

  const getWarehouseName = (id) =>
    warehouses.find((w) => w.id === id)?.name || "-";

  /* ============================
     RENDER
  ============================ */
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">SKU Management</h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* FORM */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">
            {editingId ? "Edit SKU" : "Create New SKU"}
          </h2>
          <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
            <select
              name="item_id"
              value={form.item_id}
              onChange={onChange}
              className="border rounded px-3 py-2"
            >
              <option value="">Select Item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>

            <select
              name="warehouse_id"
              value={form.warehouse_id}
              onChange={onChange}
              className="border rounded px-3 py-2"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <input
              name="code"
              value={form.code}
              onChange={onChange}
              placeholder="SKU CODE"
              className="border rounded px-3 py-2"
            />

            <input
              name="color"
              value={form.color}
              onChange={onChange}
              placeholder="Color"
              className="border rounded px-3 py-2"
            />

            <input
              name="status"
              value={form.status}
              onChange={onChange}
              placeholder="In Stock"
              className="border rounded px-3 py-2 md:col-span-2"
            />

            <div className="md:col-span-2 text-right">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                {editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      item_id: "",
                      warehouse_id: "",
                      code: "",
                      color: "",
                      status: "",
                    });
                  }}
                  className="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Recycle Bin Toggle Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={toggleRecycleBin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <span>🗑️</span>
            <span>Recycle Bin ({deletedSkus.length})</span>
          </button>
        </div>

        {/* Existing SKUs Table */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Existing SKUs</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500 border-b">
                  <tr>
                    <th className="text-left pb-3">Code</th>
                    <th className="text-left pb-3">Item</th>
                    <th className="text-left pb-3">Warehouse</th>
                    <th className="text-left pb-3">Color</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {skus.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        No SKUs found
                      </td>
                    </tr>
                  ) : (
                    skus.map((sku) => (
                      <tr key={sku.id} className="border-t hover:bg-gray-50">
                        <td className="py-3">{sku.code}</td>
                        <td className="py-3">{getItemName(sku.item_id)}</td>
                        <td className="py-3">{getWarehouseName(sku.warehouse_id)}</td>
                        <td className="py-3">{sku.color || "-"}</td>
                        <td className="py-3"><StatusBadge status={sku.status} /></td>
                        <td className="py-3">
                          <div className="flex gap-3">
                            <button 
                              onClick={() => startEdit(sku)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleSoftDelete(sku.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recycle Bin Table (Conditional Render) */}
        {showRecycleBin && (
          <div className="bg-gray-50 shadow rounded-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-medium mb-4 text-gray-700">Recycle Bin (Soft Deleted)</h2>
            {deletedSkus.length === 0 ? (
              <p className="text-gray-500">No deleted SKUs found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="text-left pb-3">Code</th>
                      <th className="text-left pb-3">Item</th>
                      <th className="text-left pb-3">Warehouse</th>
                      <th className="text-left pb-3">Color</th>
                      <th className="text-left pb-3">Status</th>
                      <th className="text-left pb-3">Deleted At</th>
                      <th className="text-left pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedSkus.map((sku) => (
                      <tr key={sku.id} className="border-t hover:bg-gray-100">
                        <td className="py-3">{sku.code}</td>
                        <td className="py-3">{getItemName(sku.item_id)}</td>
                        <td className="py-3">{getWarehouseName(sku.warehouse_id)}</td>
                        <td className="py-3">{sku.color || "-"}</td>
                        <td className="py-3"><StatusBadge status={sku.status} /></td>
                        <td className="py-3">
                          {sku.deleted_at ? new Date(sku.deleted_at).toLocaleString() : "-"}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRestore(sku.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ↶ Restore
                            </button>
                            <button
                              onClick={() => handleHardDelete(sku.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑 Delete Permanently
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}