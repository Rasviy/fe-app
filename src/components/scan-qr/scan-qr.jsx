// src/pages/ScannerPage.jsx
import { useState } from "react";

export default function ScannerPage() {
  const [cameraOn, setCameraOn] = useState(true);
  const [inputSKU, setInputSKU] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [mode, setMode] = useState("pinjam");
  const [loanData, setLoanData] = useState({
    start: "",
    end: "",
    note: "",
  });

  return (
    <div className="w-full min-h-screen bg-[#0F270F] text-white p-8 flex justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ===================== LEFT SIDE ===================== */}
        <div className="space-y-4">

          {/* Title */}
          <h1 className="text-3xl font-bold">Scanner Inventaris</h1>
          <p className="text-gray-400 -mt-2">
            Scan QR code barang atau masukkan SKU secara manual untuk melakukan peminjaman.
          </p>

          {/* CAMERA CARD */}
          <div className="bg-[#102E12] p-4 rounded-2xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Kamera Pemindai</p>

              {/* Toggle Switch */}
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cameraOn}
                  onChange={() => setCameraOn(!cameraOn)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-green-500"></div>
                <span className="ml-3 text-sm">On</span>
              </label>
            </div>

            {/* kamera simulasi */}
            <div className="w-full h-64 bg-black rounded-xl flex items-center justify-center relative">
              {cameraOn ? (
                <>
                  <p className="text-sm text-gray-300">[ Kamera Menyala ]</p>
                  <div className="absolute inset-0 border-4 border-green-500 rounded-xl pointer-events-none m-4"></div>
                </>
              ) : (
                <p className="text-gray-500">Kamera dimatikan</p>
              )}
            </div>
          </div>

          {/* INPUT SKU jika kamera OFF */}
          {!cameraOn && (
            <div className="bg-[#102E12] rounded-2xl p-4 shadow-lg">
              <p className="text-gray-300 text-sm mb-2">Input Code</p>

              <input
                className="w-full px-4 py-3 rounded-xl bg-[#0C200C] border border-green-700 focus:outline-none"
                placeholder="Masukkan SKU..."
                value={inputSKU}
                onChange={(e) => setInputSKU(e.target.value)}
              />

              <button
                onClick={() => setShowCard(true)}
                disabled={!inputSKU}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-xl disabled:bg-gray-600 disabled:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* ===================== RIGHT SIDE ===================== */}
        <div className="w-full">
          {showCard && (
            <div className="bg-[#102E12] p-6 rounded-2xl shadow-xl">

              {/* ITEM HEADER */}
              <div className="flex gap-4 items-start">
                <img
                  src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-m3-pro-spaceblack-select-202310?wid=2000&hei=1536&fmt=jpeg&qlt=90&.v=1696971522627"
                  className="w-24 h-24 rounded-xl object-cover border border-green-700"
                />

                <div>
                  <span className="px-3 py-1 text-xs bg-green-700 rounded-full">
                    ELECTRONICS
                  </span>
                  <h2 className="text-xl font-semibold mt-2">
                    MacBook Pro 14” M3
                  </h2>
                  <p className="text-gray-400 text-sm">SKU: {inputSKU}</p>
                </div>
              </div>

              <hr className="my-4 border-green-900" />

              {/* MODE SWITCH */}
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    mode === "pinjam"
                      ? "bg-green-500 text-black"
                      : "bg-[#0C200C] text-gray-300"
                  }`}
                  onClick={() => setMode("pinjam")}
                >
                  Meminjam
                </button>

                <button
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    mode === "minta"
                      ? "bg-green-500 text-black"
                      : "bg-[#0C200C] text-gray-300"
                  }`}
                  onClick={() => setMode("minta")}
                >
                  Meminta
                </button>
              </div>

              {/* FORM PEMINJAMAN */}
              {mode === "pinjam" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm mb-1 text-gray-300">Durasi Peminjaman</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={loanData.start}
                        onChange={(e) =>
                          setLoanData({ ...loanData, start: e.target.value })
                        }
                        className="px-3 py-2 bg-[#0C200C] rounded-xl border border-green-700"
                      />

                      <input
                        type="date"
                        value={loanData.end}
                        onChange={(e) =>
                          setLoanData({ ...loanData, end: e.target.value })
                        }
                        className="px-3 py-2 bg-[#0C200C] rounded-xl border border-green-700"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm mb-1 text-gray-300">Keperluan</p>
                    <textarea
                      rows={3}
                      value={loanData.note}
                      onChange={(e) =>
                        setLoanData({ ...loanData, note: e.target.value })
                      }
                      placeholder="Jelaskan alasan peminjaman..."
                      className="w-full px-3 py-2 bg-[#0C200C] rounded-xl border border-green-700"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* POLICY */}
              <div className="bg-[#0C200C] p-3 rounded-xl mt-4 text-gray-300 text-sm">
                Barang harus dikembalikan dalam kondisi baik. Kerusakan menjadi
                tanggung jawab peminjam.
              </div>

              {/* SUBMIT BUTTON */}
              <button className="mt-5 w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-xl">
                Konfirmasi Peminjaman
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
