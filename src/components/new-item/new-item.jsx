// import { useEffect, useState } from "react";

// export default function IncomingItemTable() {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch("http://localhost:3000/items")
//       .then((res) => res.json())
//       .then((result) => {
//         const data = result.data ?? result;
//         setItems(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch items:", err);
//         setLoading(false);
//       });
//   }, []);

//   /* =====================
//      HELPER
//   ====================== */

//   const isIncomingItem = (dateValue) => {
//     if (!dateValue) return false;

//     const itemDate = new Date(dateValue);
//     const now = new Date();
//     const diffHours =
//       (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);

//     return diffHours <= 24; // <= 24 JAM = ITEM MASUK
//   };

//   const formatDateTime = (dateValue) => {
//     if (!dateValue) return "-";
//     return new Date(dateValue).toLocaleString("id-ID", {
//       day: "2-digit",
//       month: "long",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   /* =====================
//      FILTER ITEM MASUK
//   ====================== */

//   const incomingItems = items.filter((item) => {
//     const dateSource = item.request_date || item.created_at;
//     return isIncomingItem(dateSource);
//   });

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <div className="bg-white rounded-xl shadow-md overflow-hidden">

//         {/* HEADER */}
//         <div className="p-4 border-b">
//           <h2 className="text-xl font-semibold text-gray-800">
//             Incoming Items (Last 24 Hours)
//           </h2>
//           <p className="text-sm text-gray-500">
//             Items that entered the warehouse within the last 24 hours
//           </p>
//         </div>

//         {/* CONTENT */}
//         {loading ? (
//           <div className="p-6 text-center text-gray-500">
//             Loading items...
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm text-left">
//               <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
//                 <tr>
//                   <th className="px-6 py-3">Image</th>
//                   <th className="px-6 py-3">Item Name</th>
//                   <th className="px-6 py-3">Unit</th>
//                   <th className="px-6 py-3">Category</th>
//                   <th className="px-6 py-3">Supplier</th>
//                   <th className="px-6 py-3 text-center">Stock</th>
//                   <th className="px-6 py-3">Incoming Date</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y">
//                 {incomingItems.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan="7"
//                       className="px-6 py-6 text-center text-gray-500"
//                     >
//                       No incoming items in the last 24 hours
//                     </td>
//                   </tr>
//                 ) : (
//                   incomingItems.map((item) => (
//                     <tr
//                       key={item.id}
//                       className="hover:bg-gray-50 transition"
//                     >
//                       {/* IMAGE */}
//                       <td className="px-6 py-4">
//                         <img
//                           src={item.image_url || "/placeholder.png"}
//                           alt={item.name}
//                           className="w-12 h-12 object-cover rounded-lg border"
//                         />
//                       </td>

//                       {/* NAME */}
//                       <td className="px-6 py-4 font-medium text-gray-800">
//                         {item.name}
//                       </td>

//                       {/* UNIT */}
//                       <td className="px-6 py-4">
//                         {item.unit?.name || "-"}
//                       </td>

//                       {/* CATEGORY */}
//                       <td className="px-6 py-4">
//                         {item.category?.name || "-"}
//                       </td>

//                       {/* SUPPLIER */}
//                       <td className="px-6 py-4">
//                         {item.supplier?.name || "-"}
//                       </td>

//                       {/* STOCK */}
//                       <td className="px-6 py-4 text-center font-semibold">
//                         {item.stock}
//                       </td>

//                       {/* INCOMING DATE */}
//                       <td className="px-6 py-4">
//                         {formatDateTime(
//                           item.request_date || item.created_at
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
