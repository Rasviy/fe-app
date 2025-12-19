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

  const [skuData, setSkuData] = useState(null);
  const [itemData, setItemData] = useState(null);

  const [loanForm, setLoanForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    necessity: "",
    note: "",
    loan_date: "",
    return_date: "",
    qty: 1,
  });

  const [requestForm, setRequestForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    necessity: "",
    request_date: "",
  });

  /* ================= FETCH SKU ================= */
  const fetchItemBySKU = async (rawCode) => {
    try {
      const skuCode = rawCode.trim().toUpperCase();
      if (!skuCode) return;

      const skuRes = await axios.get(`${API}/sku`);
      const sku = skuRes.data.find((s) => s.code === skuCode);
      if (!sku) return alert("SKU tidak ditemukan");

      setSkuData(sku);

      const itemRes = await axios.get(`${API}/items/${sku.item_id}`);
      setItemData(itemRes.data);

      setShowCard(true);
    } catch (err) {
      alert("Gagal mengambil data item");
    }
  };

  /* ================= SUBMIT ================= */
  const submitLoan = async () => {
    try {
      await axios.post(`${API}/loans`, {
        ...loanForm,
        details: [
          {
            sku_id: skuData.id,
            qty: Number(loanForm.qty),
            return_date: loanForm.return_date,
          },
        ],
      });

      alert("Peminjaman berhasil");
      navigate("/transaksi");
    } catch {
      alert("Gagal melakukan peminjaman");
    }
  };

  const submitRequest = async () => {
    try {
      await axios.post(`${API}/item-movement`, {
        ...requestForm,
        created_by: "admin",
        details: [{ sku_id: skuData.id }],
      });

      alert("Permintaan berhasil");
      navigate("/transaksi");
    } catch {
      alert("Gagal melakukan permintaan");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ================= LEFT ================= */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Scanner Inventaris</h1>

            <div className="bg-white p-4 rounded-2xl shadow">
              <div className="flex justify-between mb-3">
                <span className="font-medium">Kamera</span>
                <input
                  type="checkbox"
                  checked={cameraOn}
                  onChange={() => setCameraOn(!cameraOn)}
                />
              </div>

              {cameraOn && (
                <Scanner
                  constraints={{ facingMode: "environment" }}
                  onScan={(res) => {
                    if (res?.[0]?.rawValue) {
                      fetchItemBySKU(res[0].rawValue);
                      setCameraOn(false);
                    }
                  }}
                />
              )}
            </div>

            {/* ===== INPUT MANUAL (FIX BUG) ===== */}
            {!cameraOn && (
              <div className="bg-white p-4 rounded-2xl shadow space-y-3">
                <input
                  className="w-full border p-3 rounded-xl"
                  placeholder="Masukkan SKU manual..."
                  value={inputSKU}
                  onChange={(e) => setInputSKU(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchItemBySKU(inputSKU);
                  }}
                />
                <button
                  onClick={() => fetchItemBySKU(inputSKU)}
                  className="w-full bg-green-600 text-white py-3 rounded-xl"
                >
                  Cari Barang
                </button>
              </div>
            )}
          </div>

          {/* ================= RIGHT ================= */}
          {showCard && itemData && (
            <div className="bg-white p-6 rounded-2xl shadow space-y-6">

              {/* ITEM INFO */}
              <div className="flex gap-4 items-start">
                {itemData.image ? (
                  <img
                    src={itemData.image}
                    alt={itemData.name}
                    className="w-28 h-28 object-cover rounded-xl border"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center rounded-xl border text-gray-400 text-xs">
                    Tidak ada foto
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold">{itemData.name}</h2>
                  <p className="text-sm text-gray-500">Kode Item: {itemData.code}</p>
                  <p className="text-sm">SKU: {skuData.code}</p>
                </div>
              </div>

              <hr />

              {/* MODE */}
              <div className="flex bg-gray-100 rounded-xl overflow-hidden">
                {["pinjam", "minta"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 font-medium ${
                      mode === m ? "bg-green-600 text-white" : "text-gray-600"
                    }`}
                  >
                    {m === "pinjam" ? "Meminjam" : "Meminta"}
                  </button>
                ))}
              </div>

              {/* ================= FORM PINJAM ================= */}
              {mode === "pinjam" && (
                <>
                  <h3 className="font-semibold">Data Peminjam</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nama Peminjam">
                      <input className="input"
                        value={loanForm.name}
                        onChange={(e)=>setLoanForm({...loanForm,name:e.target.value})}/>
                    </Field>

                    <Field label="No HP">
                      <input className="input"
                        value={loanForm.phone_number}
                        onChange={(e)=>setLoanForm({...loanForm,phone_number:e.target.value})}/>
                    </Field>

                    <Field label="Email" full>
                      <input className="input"
                        value={loanForm.email}
                        onChange={(e)=>setLoanForm({...loanForm,email:e.target.value})}/>
                    </Field>

                    <Field label="Keperluan" full>
                      <input className="input"
                        value={loanForm.necessity}
                        onChange={(e)=>setLoanForm({...loanForm,necessity:e.target.value})}/>
                    </Field>
                  </div>

                  <hr />

                  <h3 className="font-semibold">Detail Peminjaman</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Jumlah">
                      <input type="number" min="1" className="input"
                        value={loanForm.qty}
                        onChange={(e)=>setLoanForm({...loanForm,qty:e.target.value})}/>
                    </Field>

                    <Field label="Tanggal Pinjam">
                      <input type="date" className="input"
                        value={loanForm.loan_date}
                        onChange={(e)=>setLoanForm({...loanForm,loan_date:e.target.value})}/>
                    </Field>

                    <Field label="Tanggal Pengembalian" full>
                      <input type="date" className="input"
                        value={loanForm.return_date}
                        onChange={(e)=>setLoanForm({...loanForm,return_date:e.target.value})}/>
                    </Field>

                    <Field label="Catatan" full>
                      <textarea className="input"
                        value={loanForm.note}
                        onChange={(e)=>setLoanForm({...loanForm,note:e.target.value})}/>
                    </Field>

                    <button
                      onClick={submitLoan}
                      className="col-span-2 bg-green-600 text-white py-3 rounded-xl"
                    >
                      Konfirmasi Peminjaman
                    </button>
                  </div>
                </>
              )}

              {/* ================= FORM MINTA ================= */}
              {mode === "minta" && (
                <>
                  <h3 className="font-semibold">Data Peminta</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nama Peminta">
                      <input className="input"
                        value={requestForm.name}
                        onChange={(e)=>setRequestForm({...requestForm,name:e.target.value})}/>
                    </Field>

                    <Field label="No HP">
                      <input className="input"
                        value={requestForm.phone_number}
                        onChange={(e)=>setRequestForm({...requestForm,phone_number:e.target.value})}/>
                    </Field>

                    <Field label="Email" full>
                      <input className="input"
                        value={requestForm.email}
                        onChange={(e)=>setRequestForm({...requestForm,email:e.target.value})}/>
                    </Field>

                    <Field label="Keperluan" full>
                      <input className="input"
                        value={requestForm.necessity}
                        onChange={(e)=>setRequestForm({...requestForm,necessity:e.target.value})}/>
                    </Field>

                    <Field label="Tanggal Permintaan" full>
                      <input type="date" className="input"
                        value={requestForm.request_date}
                        onChange={(e)=>setRequestForm({...requestForm,request_date:e.target.value})}/>
                    </Field>

                    <button
                      onClick={submitRequest}
                      className="col-span-2 bg-green-600 text-white py-3 rounded-xl"
                    >
                      Konfirmasi Permintaan
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ================= FIELD ================= */
function Field({ label, children, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
