import React, { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertTriangle,
  Check,
  Package,
  Layers,
  Sparkles,
  Info
} from "lucide-react";

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useInventory();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all, low, out

  // Form Management States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means "Add Mode", non-null holds product ID
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  // Process data view filters
  const filteredProducts = products.filter((prod) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = 
      prod.sku.toLowerCase().includes(query) ||
      prod.name.toLowerCase().includes(query) ||
      (prod.description && prod.description.toLowerCase().includes(query));

    if (stockFilter === "low") {
      return matchesQuery && prod.quantity_in_stock > 0 && prod.quantity_in_stock <= 3;
    }
    if (stockFilter === "out") {
      return matchesQuery && prod.quantity_in_stock === 0;
    }
    return matchesQuery;
  });

  // Open helper for adding
  const handleOpenAdd = () => {
    setErrorMsg("");
    setEditingId(null);
    setSku("");
    setName("");
    setPrice("");
    setStock("");
    setDescription("");
    setIsFormOpen(true);
  };

  // Open helper for editing
  const handleOpenEdit = (prod) => {
    setErrorMsg("");
    setEditingId(prod.id);
    setSku(prod.sku);
    setName(prod.name);
    setPrice(prod.price.toString());
    setStock(prod.quantity_in_stock.toString());
    setDescription(prod.description || "");
    setIsFormOpen(true);
  };

  // Submit handler (Pydantic style validations)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const productPayload = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      price: parseFloat(price),
      quantity_in_stock: parseInt(stock),
      description: description.trim()
    };

    // Client validators matching FastAPI Schemas
    if (!productPayload.sku || productPayload.sku.length < 3) {
      setErrorMsg("Validation Fail: SKU code must span at least 3 alphanumeric characters.");
      setIsSubmitting(false);
      return;
    }
    if (!productPayload.name) {
      setErrorMsg("Validation Fail: Product display name is required.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(productPayload.price) || productPayload.price <= 0) {
      setErrorMsg("Validation Fail: Price must represent a positive currency value.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(productPayload.quantity_in_stock) || productPayload.quantity_in_stock < 0) {
      setErrorMsg("Validation Fail: Stock quantity cannot sit below zero units.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        // Edit Mode
        await updateProduct(editingId, productPayload);
      } else {
        // Create Mode
        await addProduct(productPayload);
      }
      setIsFormOpen(false);
    } catch (err) {
      setErrorMsg(err.message || "An unexpected database commit exception occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async (id, name, sku) => {
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error(err.message || "Deletion failed.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Product Inventory
          </h2>
          <p className="text-sm text-slate-500">
            Add standard SKUs, update real-time stock levels, and audit physical volume.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition duration-150 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Catalog Product
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU code, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        {/* STOCK STATUS TOGGLES */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setStockFilter("all")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
              stockFilter === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setStockFilter("low")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
              stockFilter === "low"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Low Stock (&le;3)
          </button>
          <button
            onClick={() => setStockFilter("out")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
              stockFilter === "out"
                ? "bg-white text-red-650 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Out of Stock (0)
          </button>
        </div>

      </div>

      {/* PRODUCTS MASTER LEDGER */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                <Package className="h-8 w-8" />
              </div>
              <h4 className="text-slate-900 font-bold text-sm">No Catalog Items Located</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Try modifying your query tags, auditing stock status toggles, or registering a brand new SKU catalog.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">Product Attributes</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Available Stock</th>
                  <th className="px-6 py-4 text-right">Database Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((prod) => {
                  const isLow = prod.quantity_in_stock > 0 && prod.quantity_in_stock <= 3;
                  const isOut = prod.quantity_in_stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition duration-150">
                      
                      {/* SKU CODE */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                        <span className="bg-slate-100 border border-slate-200/60 px-2 py-1 rounded">
                          {prod.sku}
                        </span>
                      </td>

                      {/* PRODUCT DESCRIPTION */}
                      <td className="px-6 py-4 max-w-sm">
                        <span className="block font-semibold text-slate-800">
                          {prod.name}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {prod.description || "No description set in metadata"}
                        </span>
                      </td>

                      {/* PRICE */}
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                        ₹{prod.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* AVAILABLE STOCK BADGES */}
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                            Out of stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-255 rounded-lg animate-pulse">
                            Low Stock ({prod.quantity_in_stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                            {prod.quantity_in_stock} Units
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition hover:text-slate-900 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name, prod.sku)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-100 rounded-lg text-xs font-semibold text-red-600 bg-white hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DRAWER FORM WINDOW (ADD AND EDIT) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-250 shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            
            {/* DRAWER HEADER */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Package className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingId ? "Update Product Record" : "Catalog New Product"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Schema API v1 // POST/PUT Context
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ERROR CHANNEL */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMsg}</span>
              </div>
            )}

            {/* FORM CONTAINER */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
              
              {/* SKU CODE FIELD */}
              <div>
                <label className="block text-slate-500 font-bold font-mono tracking-wide mb-1 text-[10px] uppercase">
                  Product SKU code (Required & Unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MOUSE-LOGI-MX"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 text-xs font-mono uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* NAME FIELD */}
              <div>
                <label className="block text-slate-500 font-bold font-mono tracking-wide mb-1 text-[10px] uppercase">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logitech MX Master Wireless Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* PRICE & STOCK UNIT ROW */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* PRICE */}
                <div>
                  <label className="block text-slate-500 font-bold font-mono tracking-wide mb-1 text-[10px] uppercase">
                    Wholesale Price (INR, ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="8000.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-850 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* STOCK LEVEL */}
                <div>
                  <label className="block text-slate-500 font-bold font-mono tracking-wide mb-1 text-[10px] uppercase">
                    Initial Stock Level
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={stock}
                    disabled={!!editingId} // FastAPIs usually require inventory transactions instead of straight edits to stock
                    onChange={(e) => setStock(e.target.value)}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-850 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition ${editingId ? "opacity-60 cursor-not-allowed cursor:none" : ""}`}
                  />
                  {editingId && (
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block leading-tight">
                      *Stock mod is locked for audits.
                    </span>
                  )}
                </div>

              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-slate-500 font-bold font-mono tracking-wide mb-1 text-[10px] uppercase">
                  Catalog Description (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Define size parameters, serial arrays, or packaging specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-850 placeholder:text-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* ACTION COMMAND BUTTONS */}
              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 rounded-xl font-semibold transition cursor-pointer shadow-md shadow-blue-600/15"
                >
                  {isSubmitting ? "Committing..." : editingId ? "Commit Updates" : "Insert Record"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
