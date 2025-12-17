import { useEffect, useState } from "react";

export default function ItemMovementTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/item-movement")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching item movement:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Item Movement
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone Number</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Necessity</th>
                  <th className="px-6 py-3">Request Date</th>
                  <th className="px-6 py-3">SKU Code</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">
                        {item.phone_number}
                      </td>
                      <td className="px-6 py-4">
                        {item.email}
                      </td>
                      <td className="px-6 py-4">
                        {item.necessity}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(item.request_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        {/* Jika relasi array */}
                        {Array.isArray(item.item_movement_details)
                          ? item.item_movement_details
                              .map((d) => d.sku_code)
                              .join(", ")
                          : item.item_movement_details?.sku_code}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
