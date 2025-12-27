import React, { useEffect, useState } from "react";
import Layout from "../../pages/layout";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";


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
const fetchLoans = () => apiFetch("/loans");



const createSku = (body) =>
  apiFetch("/sku", { method: "POST", body: JSON.stringify(body) });

const updateSku = (id, body) =>
  apiFetch(`/sku/${id}`, { method: "PATCH", body: JSON.stringify(body) });

const updateSkuStatus = (id, status) =>
  apiFetch(`/sku/${id}/status`, { 
    method: "PATCH", 
    body: JSON.stringify({ status }) 
  });

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
  
  if (s.includes("ready"))
    return <span className={`${base} bg-green-100 text-green-700`}>Ready</span>;
  if (s.includes("borrowing"))
    return <span className={`${base} bg-blue-100 text-blue-700`}>Borrowing</span>;
  if (s.includes("not used"))
    return <span className={`${base} bg-gray-100 text-gray-700`}>Not Used</span>;

  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}

/* ============================
   GENERATE SKU CODE
============================ */
function generateSkuCode(item, existingSkus) {
  if (!item || !item.code) return "";
  
  // Ambil semua SKU untuk item ini
  const itemSkus = existingSkus.filter(sku => sku.item_id === item.id);
  
  // Hitung jumlah SKU untuk item ini
  const skuCount = itemSkus.length;
  
  // Format: ITEMCODE-001, ITEMCODE-002, dst
  return `${item.code}-${(skuCount + 1).toString().padStart(3, '0')}`;
}

/* ============================
   GET ACTIVE LOAN FOR SKU
============================ */
async function getActiveLoanForSku(skuId) {
  try {
    const loans = await fetchLoans();
    const loansData = Array.isArray(loans) ? loans : (loans.data || []);
    
    // Cari loan yang memiliki SKU ini dan status borrowing
    const activeLoan = loansData.find(loan => {
      return loan.status === "borrowing" && 
             loan.details?.some(detail => detail.sku_id === skuId);
    });
    
    return activeLoan || null;
  } catch (error) {
    console.error("Error fetching loans:", error);
    return null;
  }
}

/* ============================
   GENERATE QR CODE HTML
============================ */
async function generateQRCodeHTML(sku, item, warehouse) {
  try {
    // Dynamic import untuk QRCode
    const QRCode = (await import('qrcode')).default;
    
    const qrData = `SKU: ${sku.code}\nItem: ${item?.name || '-'}\nWarehouse: ${warehouse?.name || '-'}\nStatus: ${sku.status}`;
    
    const qrDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    
    // Buka window baru untuk print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SKU QR Code - ${sku.code}</title>
          <style>
            @media print {
              @page { size: A6; margin: 0; }
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .qr-container { 
              text-align: center; 
              padding: 20px; 
              max-width: 300px;
              border: 1px solid #ccc;
              border-radius: 10px;
            }
            .qr-title { 
              font-size: 18px; 
              margin-bottom: 15px; 
              font-weight: bold;
            }
            .qr-info { 
              margin-top: 15px; 
              font-size: 12px;
              text-align: left;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            .qr-code { 
              margin: 0 auto;
              width: 200px;
              height: 200px;
              padding: 10px;
              border: 1px solid #eee;
              background: white;
            }
            .no-print { 
              margin-top: 20px; 
              padding: 10px 20px; 
              background: #007bff; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">SKU QR Code</div>
            <div class="qr-code">
              <img src="${qrDataURL}" alt="QR Code" width="200" height="200" />
            </div>
            <div class="qr-info">
              <p><strong>Code:</strong> ${sku.code}</p>
              <p><strong>Item:</strong> ${item?.name || '-'}</p>
              <p><strong>Warehouse:</strong> ${warehouse?.name || '-'}</p>
              <p><strong>Status:</strong> ${sku.status}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <button class="no-print" onclick="window.print(); window.close()">
              Print QR Code
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    return true;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate QR Code');
  }
}

/* ============================
   MAIN PAGE
============================ */
export default function SkuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedItemCode, setSelectedItemCode] = useState("");

  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [skus, setSkus] = useState([]);
  const [deletedSkus, setDeletedSkus] = useState([]);
  const [activeLoans, setActiveLoans] = useState({}); // { skuId: loanData }

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [generatingQR, setGeneratingQR] = useState({});

  const [form, setForm] = useState({
    item_id: "",
    warehouse_id: "",
    color: "",
  });

  /* ============================
     LOAD DATA DENGAN ITEM SELECTION
  ============================ */
  useEffect(() => {
    // Ambil data item dari navigation state
    if (location.state) {
      const { itemId, itemName, itemCode } = location.state;
      setSelectedItemId(itemId);
      setSelectedItemName(itemName);
      setSelectedItemCode(itemCode);
      
      // Set form item_id
      setForm(prev => ({ ...prev, item_id: itemId }));
    }
  }, [location]);

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
      
      const skusData = skuRes.data || skuRes;
      setSkus(skusData);
      
      // Load active loans untuk setiap SKU
      await loadActiveLoans(skusData);
      
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

  async function loadActiveLoans(skusData) {
    try {
      const loans = await fetchLoans();
      const loansData = Array.isArray(loans) ? loans : (loans.data || []);
      
      const activeLoansMap = {};
      
      // Untuk setiap SKU, cari apakah ada loan aktif
      for (const sku of skusData) {
        const activeLoan = loansData.find(loan => {
          return loan.status === "borrowing" && 
                 loan.details?.some(detail => detail.sku_id === sku.id);
        });
        
        if (activeLoan) {
          activeLoansMap[sku.id] = activeLoan;
        }
      }
      
      setActiveLoans(activeLoansMap);
    } catch (error) {
      console.error("Error loading active loans:", error);
    }
  }

  useEffect(() => {
    loadData();
  }, [showRecycleBin]);

  /* ============================
     GET FULL ITEM CODE
  ============================ */
  function getItemFullCode(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return "";
    
    const categoryCode = item.category?.code || "";
    const unitName = item.unit?.name || "";
    
    let parts = [];
    if (item.code) parts.push(item.code);
    if (categoryCode) parts.push(categoryCode);
    if (unitName) parts.push(unitName);
    
    return parts.join("-");
  }

  /* ============================
     GET ITEM STATUS COLOR
  ============================ */
  function getItemStatusColor(status) {
    const s = status?.toLowerCase() || "";
    
    if (s.includes("ready")) return "bg-green-100 text-green-700";
    if (s.includes("borrowing")) return "bg-blue-100 text-blue-700";
    if (s.includes("not used")) return "bg-gray-100 text-gray-700";
    
    return "bg-gray-100 text-gray-700";
  }

  /* ============================
     HANDLER
  ============================ */
  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.item_id || !form.warehouse_id)
      return setError("Item dan Warehouse wajib diisi");

    try {
      // Cari item berdasarkan ID
      const selectedItem = items.find(item => item.id === form.item_id);
      
      if (!selectedItem) {
        return setError("Item tidak ditemukan");
      }

      // Generate SKU code otomatis berdasarkan item yang dipilih
      const skuCode = generateSkuCode(selectedItem, skus);
      
      // Buat SKU baru dengan status "not used"
      const body = {
        item_id: form.item_id,
        warehouse_id: form.warehouse_id,
        code: skuCode,
        color: form.color || null,
        status: "not used" // Default status saat pertama dibuat
      };

      if (editingId) {
        await updateSku(editingId, body);
      } else {
        await createSku(body);
      }

      setEditingId(null);
      setForm({
        item_id: selectedItemId || "",
        warehouse_id: "",
        color: "",
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
      color: sku.color,
    });
    setSelectedItemId(sku.item_id);
    
    // Cari nama item untuk display
    const item = items.find(i => i.id === sku.item_id);
    if (item) {
      setSelectedItemName(item.name);
      setSelectedItemCode(item.code);
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ============================
     UPDATE STATUS HANDLERS
  ============================ */
  async function markAsBorrowing(skuId) {
    try {
      // Cek apakah SKU sudah ready atau not used
      const sku = skus.find(s => s.id === skuId);
      if (!sku) return;
      
      if (sku.status === "borrowing") {
        alert("SKU ini sudah dalam status borrowing");
        return;
      }
      
      await updateSkuStatus(skuId, "borrowing");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal mengupdate status menjadi borrowing");
    }
  }

  async function markAsReady(skuId) {
    try {
      // Cek apakah SKU dalam status borrowing
      const sku = skus.find(s => s.id === skuId);
      if (!sku) return;
      
      if (sku.status !== "borrowing") {
        alert("Hanya SKU dengan status borrowing yang bisa dikembalikan");
        return;
      }
      
      await updateSkuStatus(skuId, "ready");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal mengupdate status menjadi ready");
    }
  }

  async function markAsNotUsed(skuId) {
    try {
      // Cek apakah SKU dalam status ready
      const sku = skus.find(s => s.id === skuId);
      if (!sku) return;
      
      if (sku.status !== "ready") {
        alert("Hanya SKU dengan status ready yang bisa direset ke not used");
        return;
      }
      
      await updateSkuStatus(skuId, "not used");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal mengupdate status menjadi not used");
    }
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

  async function handlePrintQR(sku) {
    setGeneratingQR(prev => ({ ...prev, [sku.id]: true }));
    try {
      const item = items.find(i => i.id === sku.item_id);
      const warehouse = warehouses.find(w => w.id === sku.warehouse_id);
      
      await generateQRCodeHTML(sku, item, warehouse);
    } catch (err) {
      console.error(err);
      setError("Gagal mencetak QR Code");
    } finally {
      setGeneratingQR(prev => ({ ...prev, [sku.id]: false }));
    }
  }

  /* ============================
     HELPER MAP NAME
  ============================ */
  const getItemName = (id) =>
    items.find((i) => i.id === id)?.name || "-";

  const getWarehouseName = (id) =>
    warehouses.find((w) => w.id === id)?.name || "-";

  /* ============================
     RENDER STATUS ACTIONS
  ============================ */
  function renderStatusActions(sku) {
    // Cek apakah ada loan aktif untuk SKU ini
    const activeLoan = activeLoans[sku.id];
    
    if (activeLoan) {
      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            Dipinjam oleh: {activeLoan.name}
          </div>
          <button
            onClick={() => markAsReady(sku.id)}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
            title="Kembalikan item (akan mengubah status menjadi ready)"
          >
            Kembalikan
          </button>
        </div>
      );
    }
    
    // Jika tidak ada loan aktif, tampilkan tombol berdasarkan status
    switch (sku.status?.toLowerCase()) {
      case "not used":
        return (
          <button
            onClick={() => markAsBorrowing(sku.id)}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            title="Pinjam item (akan mengubah status menjadi borrowing)"
          >
            Pinjam
          </button>
        );
        
      case "borrowing":
        return (
          <button
            onClick={() => markAsReady(sku.id)}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
            title="Kembalikan item (akan mengubah status menjadi ready)"
          >
            Kembalikan
          </button>
        );
        
      case "ready":
        return (
          <div className="flex gap-1">
            <button
              onClick={() => markAsBorrowing(sku.id)}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              title="Pinjam kembali item"
            >
              Pinjam Lagi
            </button>
            <button
              onClick={() => markAsNotUsed(sku.id)}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
              title="Reset ke status not used"
            >
              Reset
            </button>
          </div>
        );
        
      default:
        return (
          <button
            onClick={() => markAsBorrowing(sku.id)}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            title="Pinjam item"
          >
            Pinjam
          </button>
        );
    }
  }

  /* ============================
     RENDER
  ============================ */
  return (
    <Layout>
      <button
              onClick={() => navigate("/scan-qr")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              📷 Scan QR Barang
            </button>
            <br/>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">SKU Management</h1>
        
        {/* Status Legend */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="font-medium">Not Used</span>
            </div>
            <p className="text-xs text-gray-600">SKU baru dibuat, belum pernah digunakan</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="font-medium">Borrowing</span>
            </div>
            <p className="text-xs text-gray-600">Sedang dipinjam (ada loan aktif)</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="font-medium">Ready</span>
            </div>
            <p className="text-xs text-gray-600">Sudah dikembalikan, siap digunakan lagi</p>
          </div>
        </div>
        
        {/* Selected Item Info */}
        {selectedItemId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">Membuat SKU untuk Item:</h3>
                <p className="text-blue-700">
                  <span className="font-semibold">{selectedItemName}</span>
                  {selectedItemCode && (
                    <span className="ml-2 font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                      ({selectedItemCode})
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedItemId(null);
                  setSelectedItemName("");
                  setSelectedItemCode("");
                  setForm(prev => ({ ...prev, item_id: "" }));
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ganti Item
              </button>
            </div>
          </div>
        )}

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
            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item *
              </label>
              <select
                name="item_id"
                value={form.item_id}
                onChange={onChange}
                className="border rounded px-3 py-2 w-full"
                required
                disabled={!!selectedItemId}
              >
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.code})
                  </option>
                ))}
              </select>
              {selectedItemId && (
                <p className="text-xs text-gray-500 mt-1">
                  Item dipilih dari halaman sebelumnya. Klik "Ganti Item" di atas untuk memilih item lain.
                </p>
              )}
            </div>

            {/* Warehouse Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse *
              </label>
              <select
                name="warehouse_id"
                value={form.warehouse_id}
                onChange={onChange}
                className="border rounded px-3 py-2 w-full"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color (optional)
              </label>
              <input
                name="color"
                value={form.color}
                onChange={onChange}
                placeholder="Contoh: Merah, Biru, dll"
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            {/* Info Preview */}
            <div className="md:col-span-2 p-3 bg-blue-50 rounded text-sm text-blue-700">
              <p><strong>Info SKU yang akan dibuat:</strong></p>
              <ul className="list-disc pl-5 mt-1">
                <li>
                  Item: {
                    form.item_id 
                      ? `${getItemName(form.item_id)} (${getItemFullCode(form.item_id)})`
                      : "Belum dipilih"
                  }
                </li>
                <li>
                  Warehouse: {form.warehouse_id ? getWarehouseName(form.warehouse_id) : "Belum dipilih"}
                </li>
                <li>
                  Code: {
                    form.item_id 
                      ? `Akan digenerate otomatis (${items.find(i => i.id === form.item_id)?.code || ''}-XXX)`
                      : "Belum bisa digenerate"
                  }
                </li>
                <li>
                  Status: <span className="font-medium">"not used"</span> (default untuk SKU baru)
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 text-right">
              <button 
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={!form.item_id || !form.warehouse_id}
              >
                {editingId ? "Update SKU" : "Create SKU"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      item_id: selectedItemId || "",
                      warehouse_id: "",
                      color: "",
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
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total SKUs: {skus.length} | Deleted: {deletedSkus.length}
          </div>
          <button
            onClick={toggleRecycleBin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <span>🗑️</span>
            <span>Recycle Bin ({deletedSkus.length})</span>
          </button>
        </div>

        {/* Existing SKUs Table - FILTER BY SELECTED ITEM */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Existing SKUs</h2>
            {selectedItemId && (
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                Filter: {selectedItemName}
                <button
                  onClick={() => {
                    setSelectedItemId(null);
                    setSelectedItemName("");
                    setSelectedItemCode("");
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
          
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
                    <th className="text-left pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skus
                    .filter(sku => !selectedItemId || sku.item_id === selectedItemId)
                    .length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        {selectedItemId 
                          ? `No SKUs found for "${selectedItemName}"`
                          : "No SKUs found"}
                      </td>
                    </tr>
                  ) : (
                    skus
                      .filter(sku => !selectedItemId || sku.item_id === selectedItemId)
                      .map((sku) => (
                      <tr key={sku.id} className="border-t hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sku.code}</span>
                            <button
                              onClick={() => handlePrintQR(sku)}
                              disabled={generatingQR[sku.id]}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
                              title="Print QR Code"
                            >
                              {generatingQR[sku.id] ? 'Generating...' : 'Print QR'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <div>{getItemName(sku.item_id)}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {getItemFullCode(sku.item_id)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">{getWarehouseName(sku.warehouse_id)}</td>
                        <td className="py-3">{sku.color || "-"}</td>
                        <td className="py-3">
                          <div className="flex flex-col gap-2">
                            <StatusBadge status={sku.status} />
                            {renderStatusActions(sku)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-3">
                            <button 
                              onClick={() => startEdit(sku)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleSoftDelete(sku.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              🗑 Delete
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
                    {deletedSkus
                      .filter(sku => !selectedItemId || sku.item_id === selectedItemId)
                      .map((sku) => (
                      <tr key={sku.id} className="border-t hover:bg-gray-100">
                        <td className="py-3">{sku.code}</td>
                        <td className="py-3">
                          <div>
                            <div>{getItemName(sku.item_id)}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {getItemFullCode(sku.item_id)}
                            </div>
                          </div>
                        </td>
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