import { useState } from "react";
import axios from "axios";
import { Scanner } from "@yudiel/react-qr-scanner";
import Layout from "../../pages/layout";

const API = "http://localhost:3000";

export default function ScannerPage() {
  const [cameraOn, setCameraOn] = useState(true);
  const [inputSKU, setInputSKU] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [mode, setMode] = useState("pinjam");

  const [skuData, setSkuData] = useState(null);
  const [itemData, setItemData] = useState(null);

  // =========================
  // FORM PINJAM
  // =========================
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

  // =========================
  // FORM MINTA
  // =========================
  const [requestForm, setRequestForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    necessity: "",
    request_date: "",
  });

  // =========================
  // FETCH SKU → ITEM
  // =========================
  const fetchItemBySKU = async (rawCode) => {
    try {
      const skuCode = rawCode.trim().toUpperCase();
      const skuRes = await axios.get(`${API}/sku`);

      const sku = skuRes.data.find((s) => s.code === skuCode);
      if (!sku) return alert("SKU tidak ditemukan");

      setSkuData(sku);

      const itemRes = await axios.get(`${API}/items/${sku.item_id}`);
      setItemData(itemRes.data);
      setShowCard(true);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data item");
    }
  };

  // =========================
  // SUBMIT PINJAM
  // =========================
  const submitLoan = async () => {
    const payload = {
      name: loanForm.name,
      phone_number: loanForm.phone_number,
      email: loanForm.email,
      necessity: loanForm.necessity,
      note: loanForm.note,
      loan_date: loanForm.loan_date,
      details: [
        {
          sku_id: skuData.id,
          qty: Number(loanForm.qty),
          return_date: loanForm.return_date,
        },
      ],
    };

    await axios.post(`${API}/loans`, payload);
    alert("Peminjaman berhasil");
  };

  // =========================
  // SUBMIT MINTA
  // =========================
  const submitRequest = async () => {
    const payload = {
      name: requestForm.name,
      phone_number: requestForm.phone_number,
      email: requestForm.email,
      necessity: requestForm.necessity,
      request_date: requestForm.request_date,
      created_by: "admin",
      details: [
        {
          sku_id: skuData.id,
          sku_code: skuData.code,
        },
      ],
    };

    await axios.post(`${API}/item-movement`, payload);
    alert("Permintaan berhasil");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT */}
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
                      setInputSKU(res[0].rawValue);
                      fetchItemBySKU(res[0].rawValue);
                      setCameraOn(false);
                    }
                  }}
                />
              )}
            </div>

            {!cameraOn && (
              <div className="bg-white p-4 rounded-2xl shadow space-y-3">
                <input
                  className="w-full border p-3 rounded-xl"
                  placeholder="Masukkan SKU..."
                  value={inputSKU}
                  onChange={(e) => setInputSKU(e.target.value)}
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

          {/* RIGHT */}
          {showCard && itemData && (
            <div className="bg-white p-6 rounded-2xl shadow space-y-6">

              {/* ITEM CARD */}
              <div className="flex gap-4">
                {itemData.image && (
                  <img
                    src={itemData.image}
                    className="w-28 h-28 object-cover rounded-xl border"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold">{itemData.name}</h2>
                  <p className="text-gray-500">{itemData.code}</p>
                  <p className="text-sm">SKU: {skuData.code}</p>
                </div>
              </div>

              {/* MODE TABS */}
              <div className="flex bg-gray-100 rounded-xl overflow-hidden">
                {["pinjam", "minta"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 font-medium ${
                      mode === m
                        ? "bg-green-600 text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {m === "pinjam" ? "Meminjam" : "Meminta"}
                  </button>
                ))}
              </div>

              {/* FORM PINJAM */}
              {mode === "pinjam" && (
                <div className="grid grid-cols-2 gap-4">
                  <input className="input" placeholder="Nama" onChange={(e)=>setLoanForm({...loanForm,name:e.target.value})}/>
                  <input className="input" placeholder="No HP" onChange={(e)=>setLoanForm({...loanForm,phone_number:e.target.value})}/>
                  <input className="input col-span-2" placeholder="Email" onChange={(e)=>setLoanForm({...loanForm,email:e.target.value})}/>
                  <input className="input col-span-2" placeholder="Keperluan" onChange={(e)=>setLoanForm({...loanForm,necessity:e.target.value})}/>
                  <input type="number" min="1" className="input" placeholder="Jumlah Barang" onChange={(e)=>setLoanForm({...loanForm,qty:e.target.value})}/>
                  <input type="date" className="input" onChange={(e)=>setLoanForm({...loanForm,loan_date:e.target.value})}/>
                  <input type="date" className="input col-span-2" onChange={(e)=>setLoanForm({...loanForm,return_date:e.target.value})}/>
                  <textarea className="input col-span-2" placeholder="Catatan" onChange={(e)=>setLoanForm({...loanForm,note:e.target.value})}/>
                  <button onClick={submitLoan} className="col-span-2 bg-green-600 text-white py-3 rounded-xl">
                    Konfirmasi Pinjam
                  </button>
                </div>
              )}

              {/* FORM MINTA */}
              {mode === "minta" && (
                <div className="grid grid-cols-2 gap-4">
                  <input className="input" placeholder="Nama" onChange={(e)=>setRequestForm({...requestForm,name:e.target.value})}/>
                  <input className="input" placeholder="No HP" onChange={(e)=>setRequestForm({...requestForm,phone_number:e.target.value})}/>
                  <input className="input col-span-2" placeholder="Email" onChange={(e)=>setRequestForm({...requestForm,email:e.target.value})}/>
                  <input className="input col-span-2" placeholder="Keperluan" onChange={(e)=>setRequestForm({...requestForm,necessity:e.target.value})}/>
                  <input type="date" className="input col-span-2" onChange={(e)=>setRequestForm({...requestForm,request_date:e.target.value})}/>
                  <button onClick={submitRequest} className="col-span-2 bg-green-600 text-white py-3 rounded-xl">
                    Konfirmasi Permintaan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
