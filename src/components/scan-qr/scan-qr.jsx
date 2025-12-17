import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import Layout from "../../pages/layout";

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
    <Layout>
      <div className="w-full min-h-screen bg-gray-100 p-8 flex justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Scanner Inventaris
            </h1>
            <p className="text-gray-500">
              Scan QR code atau input SKU manual
            </p>

            {/* CAMERA */}
            <div className="bg-white p-4 rounded-2xl shadow space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold">Kamera</p>

                <input
                  type="checkbox"
                  checked={cameraOn}
                  onChange={() => setCameraOn(!cameraOn)}
                />
              </div>

              {cameraOn ? (
                <div className="rounded-xl overflow-hidden border">
                  <Scanner
                    constraints={{ facingMode: "environment" }}
                    onScan={(result) => {
                      if (result?.[0]?.rawValue) {
                        setInputSKU(result[0].rawValue);
                        setShowCard(true);
                        setCameraOn(false);
                      }
                    }}
                    onError={(error) => console.error(error)}
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-center">
                  Kamera dimatikan
                </p>
              )}
            </div>

            {/* INPUT MANUAL */}
            {!cameraOn && (
              <div className="bg-white p-4 rounded-2xl shadow">
                <input
                  className="w-full border px-4 py-3 rounded-xl"
                  placeholder="Masukkan SKU..."
                  value={inputSKU}
                  onChange={(e) => setInputSKU(e.target.value)}
                />

                <button
                  onClick={() => setShowCard(true)}
                  className="mt-3 w-full bg-green-500 text-white py-3 rounded-xl"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>
            {showCard && (
              <div className="bg-white p-6 rounded-2xl shadow">
                <h2 className="text-xl font-bold mb-2">
                  Barang Ditemukan
                </h2>
                <p className="text-gray-500 mb-4">
                  SKU: {inputSKU}
                </p>

                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setMode("pinjam")}
                    className={`px-4 py-2 rounded ${
                      mode === "pinjam"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Meminjam
                  </button>

                  <button
                    onClick={() => setMode("minta")}
                    className={`px-4 py-2 rounded ${
                      mode === "minta"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Meminta
                  </button>
                </div>

                {mode === "pinjam" && (
                  <>
                    <input
                      type="date"
                      className="border w-full p-2 rounded mb-2"
                      onChange={(e) =>
                        setLoanData({ ...loanData, start: e.target.value })
                      }
                    />
                    <input
                      type="date"
                      className="border w-full p-2 rounded mb-2"
                      onChange={(e) =>
                        setLoanData({ ...loanData, end: e.target.value })
                      }
                    />
                    <textarea
                      className="border w-full p-2 rounded"
                      placeholder="Keperluan..."
                      onChange={(e) =>
                        setLoanData({ ...loanData, note: e.target.value })
                      }
                    />
                  </>
                )}

                <button className="mt-4 w-full bg-green-500 text-white py-3 rounded-xl">
                  Konfirmasi
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
