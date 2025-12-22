import { useState, useEffect } from "react";
import axios from "axios";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import Layout from "../../pages/layout";

const API = "http://localhost:3000";

export default function ScannerPage() {
  const navigate = useNavigate();

  const [cameraOn, setCameraOn] = useState(true);
  const [inputSKU, setInputSKU] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [mode, setMode] = useState("pinjam");
  const [loading, setLoading] = useState(false);
  const [loadingLoan, setLoadingLoan] = useState(false);

  const [skuData, setSkuData] = useState(null);
  const [itemData, setItemData] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);

  const [loanForm, setLoanForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    necessity: "",
    note: "",
    loan_date: new Date().toISOString().split('T')[0],
    return_date: "",
    qty: 1,
  });

  const [returnForm, setReturnForm] = useState({
    return_date: new Date().toISOString().split('T')[0],
    note: "",
  });

  const [formErrors, setFormErrors] = useState({
    phone_number: "",
    email: "",
  });

  // Fungsi untuk reset semua state
  const resetAll = () => {
    setInputSKU("");
    setShowCard(false);
    setSkuData(null);
    setItemData(null);
    setActiveLoan(null);
    setMode("pinjam");
    setLoanForm({
      name: "",
      phone_number: "",
      email: "",
      necessity: "",
      note: "",
      loan_date: new Date().toISOString().split('T')[0],
      return_date: "",
      qty: 1,
    });
    setReturnForm({
      return_date: new Date().toISOString().split('T')[0],
      note: "",
    });
    setFormErrors({
      phone_number: "",
      email: "",
    });
  };

  /* ================= VALIDASI FORM ================= */
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phone) return "No HP wajib diisi";
    if (!phoneRegex.test(phone)) return "No HP harus 10-15 digit angka";
    return "";
  };

  const validateEmail = (email) => {
    if (!email) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Format email tidak valid";
    return "";
  };

  const validateForm = () => {
    const errors = {
      phone_number: validatePhoneNumber(loanForm.phone_number),
      email: validateEmail(loanForm.email),
    };
    
    setFormErrors(errors);
    
    return !errors.phone_number && !errors.email;
  };

  /* ================= EXTRACT SKU CODE FROM QR ================= */
  const extractSkuCodeFromQR = (qrData) => {
    if (!qrData) return "";
    
    // Coba beberapa pattern untuk ekstrak SKU code dari QR data
    // Pattern 1: Langsung SKU code (format: ITEM-001)
    if (/^[A-Za-z0-9]+-[0-9]{3}$/.test(qrData.trim())) {
      return qrData.trim();
    }
    
    // Pattern 2: QR berisi "SKU: CODE" (format dari generateQRCodePDF)
    const skuMatch = qrData.match(/SKU:\s*([A-Za-z0-9]+-[0-9]{3})/);
    if (skuMatch && skuMatch[1]) {
      return skuMatch[1];
    }
    
    // Pattern 3: QR berisi multiple lines, cari yang mengandung "SKU" atau "Code:"
    const lines = qrData.split('\n');
    for (const line of lines) {
      // Cari line yang mengandung kata "SKU" atau "Code:"
      if (line.includes('SKU:') || line.includes('Code:')) {
        const codeMatch = line.match(/:?\s*([A-Za-z0-9]+-[0-9]{3})/);
        if (codeMatch && codeMatch[1]) {
          return codeMatch[1];
        }
      }
      
      // Coba langsung match dengan pattern SKU
      const directMatch = line.match(/^[A-Za-z0-9]+-[0-9]{3}$/);
      if (directMatch) {
        return directMatch[0];
      }
    }
    
    // Jika tidak ditemukan pattern yang cocok, return data asli (mungkin sudah SKU code)
    return qrData.trim();
  };

  /* ================= FETCH SKU ================= */
  const fetchItemBySKU = async (rawCode) => {
    try {
      setLoading(true);
      
      // Bersihkan dan ekstrak SKU code dari data QR
      const extractedCode = extractSkuCodeFromQR(rawCode);
      
      console.log("Raw QR Data:", rawCode);
      console.log("Extracted SKU Code:", extractedCode);
      
      if (!extractedCode) {
        alert("Tidak dapat menemukan kode SKU dari QR Code");
        return;
      }

      const skuCode = extractedCode.toUpperCase();
      
      // Cek data SKU dari endpoint /sku
      const skuRes = await axios.get(`${API}/sku`);
      console.log("All SKUs:", skuRes.data);
      
      // Cari SKU berdasarkan code
      const sku = Array.isArray(skuRes.data) 
        ? skuRes.data.find((s) => s.code && s.code.toUpperCase() === skuCode)
        : (skuRes.data.data || []).find((s) => s.code && s.code.toUpperCase() === skuCode);
      
      console.log("Found SKU:", sku);
      
      if (!sku) {
        // Coba cari SKU dengan partial match
        const partialMatch = Array.isArray(skuRes.data) 
          ? skuRes.data.find((s) => s.code && s.code.toUpperCase().includes(skuCode))
          : (skuRes.data.data || []).find((s) => s.code && s.code.toUpperCase().includes(skuCode));
        
        if (partialMatch) {
          console.log("Partial match found:", partialMatch);
          setSkuData(partialMatch);
          
          // Cek data item
          try {
            const itemRes = await axios.get(`${API}/items/${partialMatch.item_id}`);
            console.log("Item found:", itemRes.data);
            setItemData(itemRes.data);
          } catch (itemErr) {
            console.error("Error fetching item:", itemErr);
            // Coba endpoint alternatif
            try {
              const itemsRes = await axios.get(`${API}/items`);
              const allItems = Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data.data;
              const item = allItems.find(i => i.id === partialMatch.item_id);
              if (item) {
                setItemData(item);
              } else {
                alert("Item tidak ditemukan untuk SKU ini");
                return;
              }
            } catch (itemsErr) {
              console.error("Error fetching all items:", itemsErr);
              alert("Gagal mengambil data item");
              return;
            }
          }
        } else {
          alert(`SKU "${skuCode}" tidak ditemukan dalam sistem`);
          return;
        }
      } else {
        setSkuData(sku);
        
        // Cek data item
        try {
          const itemRes = await axios.get(`${API}/items/${sku.item_id}`);
          console.log("Item found:", itemRes.data);
          setItemData(itemRes.data);
        } catch (itemErr) {
          console.error("Error fetching item:", itemErr);
          // Coba endpoint alternatif
          try {
            const itemsRes = await axios.get(`${API}/items`);
            const allItems = Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data.data;
            const item = allItems.find(i => i.id === sku.item_id);
            if (item) {
              setItemData(item);
            } else {
              alert("Item tidak ditemukan untuk SKU ini");
              return;
            }
          } catch (itemsErr) {
            console.error("Error fetching all items:", itemsErr);
            alert("Gagal mengambil data item");
            return;
          }
        }
      }

      // Cek apakah ada peminjaman aktif untuk SKU ini
      await fetchActiveLoan(sku?.id || partialMatch?.id);

      setShowCard(true);
      setInputSKU("");
      
    } catch (err) {
      console.error("Error fetching SKU:", err);
      alert("Gagal mengambil data item");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH ACTIVE LOAN ================= */
  const fetchActiveLoan = async (skuId) => {
    try {
      if (!skuId) return;
      
      setLoadingLoan(true);
      const loansRes = await axios.get(`${API}/loans`);
      console.log("All loans:", loansRes.data);
      
      // Parse response data
      const loansData = Array.isArray(loansRes.data) 
        ? loansRes.data 
        : (loansRes.data.data || []);
      
      // Cari loan dengan status "borrowing" dan memiliki detail dengan sku_id yang sesuai
      const activeLoans = loansData.filter(loan => {
        // Pastikan loan memiliki status borrowing
        if (loan.status !== "borrowing" && loan.status !== "borrowed") {
          return false;
        }
        
        // Cek apakah loan memiliki details
        if (loan.details && Array.isArray(loan.details)) {
          return loan.details.some(detail => detail.sku_id === skuId);
        }
        
        return false;
      });

      console.log("Active loans for SKU:", activeLoans);

      if (activeLoans.length > 0) {
        // Ambil loan terbaru (berdasarkan created_at atau id terbesar)
        const latestLoan = activeLoans.reduce((latest, current) => {
          const latestDate = new Date(latest.created_at || latest.loan_date || 0);
          const currentDate = new Date(current.created_at || current.loan_date || 0);
          return currentDate > latestDate ? current : latest;
        });
        
        setActiveLoan(latestLoan);
        
        // Isi form pengembalian dengan data dari loan
        setReturnForm({
          return_date: new Date().toISOString().split('T')[0],
          note: `Pengembalian: ${latestLoan.name} (${latestLoan.phone_number}) - ${latestLoan.necessity || 'Tidak ada keperluan'}`
        });
        
        // Set mode ke "kembali" karena ada loan aktif
        setMode("kembali");
      } else {
        setActiveLoan(null);
        // Set mode ke "pinjam" karena tidak ada loan aktif
        setMode("pinjam");
      }
    } catch (error) {
      console.error("Error fetching active loan:", error);
      setActiveLoan(null);
    } finally {
      setLoadingLoan(false);
    }
  };

  /* ================= GET FULL CODE ================= */
  const getFullCode = (item) => {
    if (!item) return "-";
    
    const categoryCode = item.category?.code || "";
    const unitName = item.unit?.name || "";
    
    let parts = [];
    if (item.code) parts.push(item.code);
    if (categoryCode) parts.push(categoryCode);
    if (unitName) parts.push(unitName);
    
    return parts.join("-");
  };

  /* ================= SUBMIT PINJAM ================= */
  const submitLoan = async () => {
    try {
      // Validasi form
      if (!loanForm.name || !loanForm.phone_number || !loanForm.return_date) {
        alert("Nama, No HP, dan Tanggal Pengembalian wajib diisi");
        return;
      }

      // Validasi custom
      if (!validateForm()) {
        alert("Terdapat error pada form. Silakan perbaiki terlebih dahulu.");
        return;
      }

      // Validasi stock jika itemData ada stock field
      if (itemData && itemData.stock !== undefined) {
        if (Number(loanForm.qty) > itemData.stock) {
          alert("Jumlah tidak boleh melebihi stok yang tersedia");
          return;
        }
      }

      const response = await axios.post(`${API}/loans`, {
        name: loanForm.name,
        phone_number: loanForm.phone_number,
        email: loanForm.email || "",
        necessity: loanForm.necessity || "",
        note: loanForm.note || "",
        loan_date: loanForm.loan_date,
        status: "borrowing",
        details: [
          {
            sku_id: skuData.id,
            qty: Number(loanForm.qty),
            return_date: loanForm.return_date,
            status: "borrowed"
          },
        ],
      });

      alert("Peminjaman berhasil!");
      resetAll();
      navigate("/transaksi");
    } catch (error) {
      console.error("Error submitting loan:", error);
      alert("Gagal melakukan peminjaman");
    }
  };

  /* ================= SUBMIT PENGEMBALIAN ================= */
  const submitReturn = async () => {
    try {
      if (!activeLoan) {
        alert("Tidak ada data peminjaman aktif untuk SKU ini");
        return;
      }

      console.log("Submitting return for loan:", activeLoan);

      // Update status loan menjadi returned
      const updateData = {
        status: "returned",
        return_date: returnForm.return_date,
        return_note: returnForm.note || "",
      };

      // Jika loan memiliki details, update status details juga
      if (activeLoan.details && Array.isArray(activeLoan.details)) {
        updateData.details = activeLoan.details.map(detail => ({
          ...detail,
          status: "returned",
          actual_return_date: returnForm.return_date
        }));
      }

      await axios.put(`${API}/loans/${activeLoan.id}`, updateData);

      // Update status SKU menjadi "ready"
      if (skuData) {
        try {
          await axios.patch(`${API}/sku/${skuData.id}/status`, {
            status: "ready"
          });
          console.log("SKU status updated to ready");
        } catch (skuError) {
          console.error("Error updating SKU status:", skuError);
        }
      }

      alert("Pengembalian berhasil!");
      resetAll();
      navigate("/transaksi");
    } catch (error) {
      console.error("Error submitting return:", error);
      alert("Gagal melakukan pengembalian");
    }
  };

  // Handler untuk perubahan mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "kembali" && activeLoan) {
      setReturnForm({
        return_date: new Date().toISOString().split('T')[0],
        note: `Pengembalian: ${activeLoan.name} (${activeLoan.phone_number}) - ${activeLoan.necessity || 'Tidak ada keperluan'}`
      });
    }
  };

  // Handler untuk input changes dengan validasi
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "phone_number") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setLoanForm({ ...loanForm, [name]: numericValue });
      
      const error = validatePhoneNumber(numericValue);
      setFormErrors({ ...formErrors, phone_number: error });
    } else if (name === "email") {
      setLoanForm({ ...loanForm, [name]: value });
      
      const error = validateEmail(value);
      setFormErrors({ ...formErrors, email: error });
    } else {
      setLoanForm({ ...loanForm, [name]: value });
    }
  };

  /* ================= HANDLE QR SCAN ================= */
  const handleQRScan = (result) => {
    if (result && result[0]?.rawValue) {
      const qrData = result[0].rawValue;
      console.log("QR Code scanned:", qrData);
      
      // Berikan feedback visual bahwa QR berhasil di-scan
      const scannerElement = document.querySelector('.scanner-container');
      if (scannerElement) {
        scannerElement.style.border = '3px solid #10B981';
        setTimeout(() => {
          scannerElement.style.border = 'none';
        }, 500);
      }
      
      // Process QR data
      fetchItemBySKU(qrData);
    }
  };

  /* ================= DEBUG INFO ================= */
  useEffect(() => {
    console.log("Current SKU Data:", skuData);
    console.log("Current Item Data:", itemData);
    console.log("Active Loan:", activeLoan);
  }, [skuData, itemData, activeLoan]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ================= LEFT SIDE ================= */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold">Scanner Inventaris</h1>
              <button
                onClick={() => navigate("/items")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kembali ke Items
              </button>
            </div>

            {/* DEBUG INFO (opsional, bisa dihilangkan di production) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">💡 Tips Scanning:</span>
              </div>
              <ul className="list-disc pl-5 text-yellow-700">
                <li>Pastikan QR Code dari SKU terlihat jelas</li>
                <li>QR Code harus berisi kode SKU (format: ABC-001)</li>
                <li>Jika scan gagal, coba input manual kode SKU</li>
              </ul>
              {skuData && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="text-xs font-mono">SKU Ditemukan: {skuData.code}</p>
                </div>
              )}
            </div>

            {/* CAMERA SECTION */}
            <div className="bg-white p-4 rounded-2xl shadow scanner-container">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Kamera Scanner</span>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={cameraOn}
                      onChange={() => setCameraOn(!cameraOn)}
                    />
                    <div className={`block w-14 h-8 rounded-full ${cameraOn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${cameraOn ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              {cameraOn ? (
                <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                  <Scanner
                    constraints={{ 
                      facingMode: "environment",
                      width: { ideal: 1280 },
                      height: { ideal: 720 }
                    }}
                    onScan={handleQRScan}
                    onError={(error) => {
                      console.error("Scanner error:", error);
                      if (error?.name === "NotAllowedError") {
                        alert("Izin kamera ditolak. Silakan aktifkan akses kamera di browser settings.");
                      } else if (error?.name === "NotFoundError") {
                        alert("Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.");
                      }
                    }}
                    styles={{
                      container: {
                        width: '100%',
                        height: '300px',
                        position: 'relative'
                      },
                      video: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-4 border-green-400 rounded-lg opacity-50"></div>
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-gray-200 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-gray-500 mb-2">Kamera dimatikan</span>
                  <p className="text-sm text-gray-600 text-center px-4">
                    Nyalakan kamera untuk memindai QR Code
                  </p>
                </div>
              )}
            </div>

            {/* MANUAL INPUT SECTION */}
            <div className="bg-white p-4 rounded-2xl shadow space-y-3">
              <h3 className="font-medium">Input Manual SKU</h3>
              <p className="text-sm text-gray-600">
                Jika QR Code tidak terbaca, masukkan kode SKU manual (contoh: ITEM-001)
              </p>
              <div className="relative">
                <input
                  className="w-full border p-3 rounded-xl pr-12"
                  placeholder="Masukkan kode SKU (contoh: ABC-001)..."
                  value={inputSKU}
                  onChange={(e) => setInputSKU(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchItemBySKU(inputSKU);
                  }}
                  disabled={loading}
                />
                {loading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fetchItemBySKU(inputSKU)}
                  className="bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50"
                  disabled={loading || !inputSKU.trim()}
                >
                  {loading ? "Mencari..." : "Cari Barang"}
                </button>
                <button
                  onClick={resetAll}
                  className="bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          {showCard && itemData && (
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow space-y-6">

              {/* ITEM INFO */}
              <div className="flex gap-4 items-start">
                {itemData.image ? (
                  <img
                    src={itemData.image}
                    alt={itemData.name}
                    className="w-20 h-20 md:w-28 md:h-28 object-cover rounded-xl border"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center rounded-xl border text-gray-400 text-xs">
                    Tidak ada foto
                  </div>
                )}

                <div className="flex-1">
                  <h2 className="text-lg md:text-xl font-bold">{itemData.name}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-500">SKU Code:</span>{" "}
                      <span className="font-mono font-medium text-blue-600">
                        {skuData?.code || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Full Code:</span>{" "}
                      <span className="font-mono font-medium text-green-600">
                        {getFullCode(itemData)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Item Code:</span> {itemData.code || "-"}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Kategori:</span> {itemData.category?.name || "-"}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Unit:</span> {itemData.unit?.name || "-"}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Stock:</span>{" "}
                      <span className={`px-2 py-1 rounded text-xs ${itemData.stock > 10 ? 'bg-green-100 text-green-800' : itemData.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {itemData.stock ?? "0"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Status SKU:</span>{" "}
                      <span className={`px-2 py-1 rounded text-xs ${
                        skuData?.status === 'ready' ? 'bg-green-100 text-green-800' :
                        skuData?.status === 'borrowing' ? 'bg-blue-100 text-blue-800' :
                        skuData?.status === 'not used' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {skuData?.status || 'unknown'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <hr />

              {/* LOAN STATUS BADGE */}
              {activeLoan && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-800">
                      ⚠️ Item sedang dipinjam oleh: <strong>{activeLoan.name}</strong>
                    </span>
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    No HP: {activeLoan.phone_number} | Keperluan: {activeLoan.necessity || "Tidak ada"} | 
                    Tanggal Pinjam: {activeLoan.loan_date}
                  </div>
                </div>
              )}

              {/* MODE SELECTION */}
              <div className="flex bg-gray-100 rounded-xl overflow-hidden">
                {[
                  { key: "pinjam", label: "Meminjam" },
                  { key: "kembali", label: "Mengembalikan" }
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleModeChange(m.key)}
                    disabled={m.key === "kembali" && !activeLoan}
                    className={`flex-1 py-3 font-medium transition-colors ${
                      mode === m.key 
                        ? (m.key === "pinjam" ? "bg-blue-600" : "bg-green-600") + " text-white" 
                        : !activeLoan && m.key === "kembali" 
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m.label}
                    {m.key === "kembali" && !activeLoan && " (Tidak tersedia)"}
                  </button>
                ))}
              </div>

              {/* ================= FORM PINJAM ================= */}
              {mode === "pinjam" && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Data Peminjaman</h3>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Peminjam</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Nama Peminjam *">
                        <input 
                          className="input"
                          name="name"
                          value={loanForm.name}
                          onChange={handleInputChange}
                          required
                        />
                      </Field>

                      <Field label="No HP *">
                        <div>
                          <input 
                            className={`input ${formErrors.phone_number ? 'border-red-500' : ''}`}
                            name="phone_number"
                            value={loanForm.phone_number}
                            onChange={handleInputChange}
                            placeholder="Contoh: 081234567890"
                            maxLength={15}
                            required
                          />
                          {formErrors.phone_number && (
                            <div className="text-red-500 text-xs mt-1">{formErrors.phone_number}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            10-15 digit angka
                          </div>
                        </div>
                      </Field>

                      <Field label="Email">
                        <div>
                          <input 
                            className={`input ${formErrors.email ? 'border-red-500' : ''}`}
                            name="email"
                            type="email"
                            value={loanForm.email}
                            onChange={handleInputChange}
                            placeholder="opsional@example.com"
                          />
                          {formErrors.email && (
                            <div className="text-red-500 text-xs mt-1">{formErrors.email}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Opsional, harus menggunakan format email yang valid
                          </div>
                        </div>
                      </Field>

                      <Field label="Keperluan">
                        <div>
                          <input 
                            className="input"
                            name="necessity"
                            value={loanForm.necessity}
                            onChange={handleInputChange}
                            placeholder="Opsional - contoh: Acara sekolah"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Opsional
                          </div>
                        </div>
                      </Field>
                    </div>
                  </div>

                  <hr />

                  <div className="space-y-4">
                    <h4 className="font-medium">Detail Peminjaman</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Jumlah *">
                        <input 
                          type="number" 
                          min="1" 
                          max={itemData.stock || 1}
                          className="input"
                          name="qty"
                          value={loanForm.qty}
                          onChange={handleInputChange}
                          required
                        />
                      </Field>

                      <Field label="Tanggal Pinjam *">
                        <input 
                          type="date" 
                          className="input"
                          name="loan_date"
                          value={loanForm.loan_date}
                          onChange={handleInputChange}
                          required
                        />
                      </Field>

                      <Field label="Tanggal Pengembalian *" full>
                        <input 
                          type="date" 
                          className="input"
                          name="return_date"
                          value={loanForm.return_date}
                          onChange={handleInputChange}
                          required
                          min={loanForm.loan_date}
                        />
                      </Field>

                      <Field label="Catatan" full>
                        <div>
                          <textarea 
                            className="input h-24"
                            name="note"
                            value={loanForm.note}
                            onChange={handleInputChange}
                            placeholder="Opsional - tambahkan catatan jika diperlukan..."
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Opsional
                          </div>
                        </div>
                      </Field>
                    </div>
                  </div>

                  <button
                    onClick={submitLoan}
                    disabled={formErrors.phone_number || formErrors.email || !loanForm.name || !loanForm.return_date}
                    className={`w-full py-3 rounded-xl font-medium ${
                      formErrors.phone_number || formErrors.email || !loanForm.name || !loanForm.return_date
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {formErrors.phone_number || formErrors.email ? "Perbaiki Form Terlebih Dahulu" : "Konfirmasi Peminjaman"}
                  </button>
                </div>
              )}

              {/* ================= FORM PENGEMBALIAN ================= */}
              {mode === "kembali" && activeLoan && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Data Pengembalian</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Informasi Peminjaman</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Nama Peminjam:</span>
                        <p className="font-medium">{activeLoan.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">No HP:</span>
                        <p className="font-medium">{activeLoan.phone_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{activeLoan.email || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Keperluan:</span>
                        <p className="font-medium">{activeLoan.necessity || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tanggal Pinjam:</span>
                        <p className="font-medium">{activeLoan.loan_date}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Jumlah:</span>
                        <p className="font-medium">
                          {activeLoan.details?.[0]?.qty || 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Data Pengembalian</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Tanggal Pengembalian *">
                        <input 
                          type="date" 
                          className="input"
                          value={returnForm.return_date}
                          onChange={(e) => setReturnForm({...returnForm, return_date: e.target.value})}
                          required
                          min={activeLoan.loan_date}
                        />
                      </Field>

                      <Field label="Catatan" full>
                        <div>
                          <textarea 
                            className="input h-24"
                            value={returnForm.note}
                            onChange={(e) => setReturnForm({...returnForm, note: e.target.value})}
                            placeholder="Opsional - tambahkan catatan tentang pengembalian..."
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Opsional
                          </div>
                        </div>
                      </Field>
                    </div>
                  </div>

                  <button
                    onClick={submitReturn}
                    className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-medium"
                  >
                    Konfirmasi Pengembalian
                  </button>
                </div>
              )}

              {/* Mode kembali tanpa active loan (seharusnya tidak muncul karena button disabled) */}
              {mode === "kembali" && !activeLoan && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-700">
                    Tidak ada data peminjaman aktif untuk SKU ini.
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Item ini belum dipinjam atau sudah dikembalikan.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= NO ITEM SELECTED ================= */}
          {!showCard && (
            <div className="bg-white p-8 rounded-2xl shadow flex flex-col items-center justify-center text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Belum ada item yang dipilih</h3>
              <p className="text-gray-500 text-sm mb-4">
                Scan QR code dari SKU atau input kode SKU manual
              </p>
              <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                <p>Format kode SKU yang diterima:</p>
                <p className="font-mono mt-1">ITEM-001, ITEM-002, dsb.</p>
              </div>
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
          transition: border-color 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }
        .scanner-container {
          position: relative;
          overflow: hidden;
        }
      `}</style>
    </Layout>
  );
}

/* ================= FIELD COMPONENT ================= */
function Field({ label, children, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-sm text-gray-700 mb-2 block font-medium">
        {label}
        {label.includes("*") && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}