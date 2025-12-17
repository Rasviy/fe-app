import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../pages/layout";

const API = "http://localhost:3000/loans";

/* =======================
   STATUS BADGE
======================= */
function StatusBadge({ status }) {
  let color = "bg-gray-100 text-gray-600";
  let text = status || "-";

  if (status === "borrowed") {
    color = "bg-yellow-100 text-yellow-700";
    text = "Dipinjam";
  } else if (status === "returned") {
    color = "bg-green-100 text-green-700";
    text = "Dikembalikan";
  } else if (status === "late") {
    color = "bg-red-100 text-red-700";
    text = "Terlambat";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {text}
    </span>
  );
}

export default function LoansTable() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =======================
     FETCH LOANS
  ======================= */
  const fetchLoans = async () => {
    try {
      setLoading(true);

      const res = await axios.get(API, {
        params: {
          page: 1,
          limit: 10,
        },
      });

      // Backend PAGINATED RESPONSE
      setLoans(res.data?.data || []);
    } catch (err) {
      console.error("ERROR FETCH LOANS:", err);
      alert("Gagal mengambil data loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto space-y-4">

          <h1 className="text-2xl font-bold">Data Peminjaman (Loans)</h1>

          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left">NAME</th>
                  <th className="px-6 py-4 text-left">EMAIL</th>
                  <th className="px-6 py-4 text-left">PHONE</th>
                  <th className="px-6 py-4 text-left">KEBUTUHAN</th>
                  <th className="px-6 py-4 text-left">NOTE</th>
                  <th className="px-6 py-4 text-left">LOAN DATE</th>
                  <th className="px-6 py-4 text-center">QTY</th>
                  <th className="px-6 py-4 text-left">RETURN DATE</th>
                  <th className="px-6 py-4 text-center">STATUS</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan="9" className="text-center py-10">
                      Loading data...
                    </td>
                  </tr>
                )}

                {!loading && loans.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-gray-500">
                      Tidak ada data peminjaman
                    </td>
                  </tr>
                )}

                {loans.map((loan) => {
                  const details = loan.loan_details || [];

                  const totalQty = details.reduce(
                    (sum, d) => sum + (d.qty || 0),
                    0
                  );

                  const latestReturnDate =
                    details.find((d) => d.return_date)?.return_date || null;

                  const status =
                    details.find((d) => d.status === "late")?.status ||
                    details.find((d) => d.status === "borrowed")?.status ||
                    details[0]?.status;

                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                        {loan.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {loan.email || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {loan.phone_number || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {loan.necessity || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {loan.note || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {loan.loan_date
                          ? new Date(loan.loan_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {totalQty}
                      </td>
                      <td className="px-6 py-4">
                        {latestReturnDate
                          ? new Date(latestReturnDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </Layout>
  );
}
