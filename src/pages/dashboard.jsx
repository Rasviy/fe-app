import Layout from "./layout";

export default function Dashboard() {
  const stats = [
    { label: "Total Item Types", value: "1,204", change: "+4.5%", changeType: "increase" },
    { label: "Total Stock Value", value: "$84,390", change: "+1.8%", changeType: "increase" },
    { label: "Low Stock Items", value: "15", change: "3 new", changeType: "neutral" },
    { label: "Items Outs This Month", value: "320", change: "-10.3%", changeType: "decrease" },
  ];

  const lowStock = [
    { name: "Mechanical Keyboard", sku: "KB-MECH-001", stock: 5, status: "critical" },
    { name: "Ergonomic Mouse", sku: "MS-ERGO-003", stock: 12, status: "low" },
    { name: "USB-C Cable 2m", sku: "CB-USBC-2M", stock: 8, status: "critical" },
  ];

  return (
    <Layout>
      <div className="p-6 w-full">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Inventory Dashboard</h2>
        <p className="text-sm text-gray-500 mb-6">
          Welcome back, here’s a summary of your inventory.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {stats.map((item, i) => (
            <div key={i} className="bg-white border rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm">{item.label}</p>
              <h3 className="text-xl font-semibold mt-1">{item.value}</h3>
              <span
                className={`text-xs mt-1 inline-block font-medium ${
                  item.changeType === "increase"
                    ? "text-green-600"
                    : item.changeType === "decrease"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>

        {/* Low Stock */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Items</h3>

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ITEM NAME</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">STOCK LEFT</th>
                <th className="px-4 py-3 text-left">STATUS</th>
                <th className="px-4 py-3 text-left">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {lowStock.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 font-bold">{item.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.status === "critical"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {item.status === "critical" ? "Critically Low" : "Getting Low"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline">
                      Re-order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </Layout>
  );
}
