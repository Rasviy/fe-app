import { useState } from "react";
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
    // Hanya angka, minimal 10 digit, maksimal 15 digit
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phone) return "No HP wajib diisi";
    if (!phoneRegex.test(phone)) return "No HP harus 10-15 digit angka";
    return "";
  };

  const validateEmail = (email) => {
    if (!email) return ""; // Email opsional
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
    
    // Cek jika ada error
    return !errors.phone_number && !errors.email;
  };

  /* ================= FETCH SKU ================= */
  const fetchItemBySKU = async (rawCode) => {
    try {
      setLoading(true);
      const skuCode = rawCode.trim().toUpperCase();
      if (!skuCode) {
        alert("Masukkan kode SKU");
        return;
      }

      // Cek data SKU
      const skuRes = await axios.get(`${API}/sku`);
      const sku = skuRes.data.find((s) => s.code === skuCode);
      
      if (!sku) {
        alert("SKU tidak ditemukan");
        return;
      }

      setSkuData(sku);

      // Cek data item
      const itemRes = await axios.get(`${API}/items/${sku.item_id}`);
      setItemData(itemRes.data);

      // Cek apakah ada peminjaman aktif untuk SKU ini
      await fetchActiveLoan(sku.id);

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
      setLoadingLoan(true);
      const loansRes = await axios.get(`${API}/loans`);
      
      // Cari loan dengan status "borrowing" dan memiliki detail dengan sku_id yang sesuai
      const activeLoans = loansRes.data.filter(
        loan => loan.status === "borrowing" && 
        loan.details?.some(detail => detail.sku_id === skuId)
      );

      if (activeLoans.length > 0) {
        // Ambil loan terbaru
        const latestLoan = activeLoans[0];
        setActiveLoan(latestLoan);
        
        // Isi form pengembalian dengan data dari loan
        setReturnForm({
          return_date: new Date().toISOString().split('T')[0],
          note: `Pengembalian: ${latestLoan.name} (${latestLoan.phone_number}) - ${latestLoan.necessity || 'Tidak ada keperluan'}`
        });
      } else {
        setActiveLoan(null);
      }
    } catch (error) {
      console.error("Error fetching active loan:", error);
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

      if (Number(loanForm.qty) > (itemData?.stock || 0)) {
        alert("Jumlah tidak boleh melebihi stok yang tersedia");
        return;
      }

      const response = await axios.post(`${API}/loans`, {
        name: loanForm.name,
        phone_number: loanForm.phone_number,
        email: loanForm.email || "", // Email opsional
        necessity: loanForm.necessity || "", // Keperluan opsional
        note: loanForm.note || "", // Catatan opsional
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

      // Update status loan menjadi returned
      await axios.put(`${API}/loans/${activeLoan.id}`, {
        ...activeLoan,
        status: "returned",
        return_date: returnForm.return_date,
        return_note: returnForm.note || "", // Catatan opsional
      });

      // Update status pada details jika ada
      if (activeLoan.details && activeLoan.details.length > 0) {
        const updatedDetails = activeLoan.details.map(detail => ({
          ...detail,
          status: "returned"
        }));
        
        await axios.put(`${API}/loans/${activeLoan.id}`, {
          ...activeLoan,
          status: "returned",
          details: updatedDetails
        });
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
      // Isi form pengembalian dengan data dari activeLoan
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
      // Hanya menerima angka
      const numericValue = value.replace(/[^0-9]/g, "");
      setLoanForm({ ...loanForm, [name]: numericValue });
      
      // Validasi real-time
      const error = validatePhoneNumber(numericValue);
      setFormErrors({ ...formErrors, phone_number: error });
    } else if (name === "email") {
      setLoanForm({ ...loanForm, [name]: value });
      
      // Validasi real-time
      const error = validateEmail(value);
      setFormErrors({ ...formErrors, email: error });
    } else {
      setLoanForm({ ...loanForm, [name]: value });
    }
  };

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

            {/* CAMERA SECTION */}
            <div className="bg-white p-4 rounded-2xl shadow">
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
                <div className="rounded-xl overflow-hidden">
                  <Scanner
                    constraints={{ facingMode: "environment" }}
                    onScan={(res) => {
                      if (res?.[0]?.rawValue) {
                        fetchItemBySKU(res[0].rawValue);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500">Kamera dimatikan</span>
                </div>
              )}
            </div>

            {/* MANUAL INPUT SECTION */}
            <div className="bg-white p-4 rounded-2xl shadow space-y-3">
              <h3 className="font-medium">Input Manual SKU</h3>
              <div className="relative">
                <input
                  className="w-full border p-3 rounded-xl pr-12"
                  placeholder="Masukkan kode SKU..."
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
                      <span className="text-gray-500">Full Code:</span>{" "}
                      <span className="font-mono font-medium text-blue-600">
                        {getFullCode(itemData)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Item Code:</span> {itemData.code || "-"}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">SKU:</span> {skuData.code}
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
                    No HP: {activeLoan.phone_number} | Keperluan: {activeLoan.necessity || "Tidak ada"}
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
                    className={`flex-1 py-3 font-medium transition-colors ${
                      mode === m.key 
                        ? (m.key === "pinjam" ? "bg-blue-600" : "bg-green-600") + " text-white" 
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m.label}
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
                    disabled={formErrors.phone_number || formErrors.email}
                    className={`w-full py-3 rounded-xl font-medium ${
                      formErrors.phone_number || formErrors.email
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {formErrors.phone_number || formErrors.email ? "Perbaiki Form Terlebih Dahulu" : "Konfirmasi Peminjaman"}
                  </button>
                </div>
              )}

              {/* ================= FORM PENGEMBALIAN ================= */}
              {mode === "kembali" && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Data Pengembalian</h3>
                  
                  {activeLoan ? (
                    <>
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
                    </>
                  ) : (
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
              <p className="text-gray-500 text-sm">
                Scan QR code atau input kode SKU manual untuk memilih item
              </p>
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