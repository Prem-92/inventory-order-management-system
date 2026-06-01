import React, { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import {
  ShoppingCart,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  Package,
  CheckCircle,
  Eye,
  CreditCard,
  Trash
} from "lucide-react";

export default function Orders() {
  const { products, customers, orders, createOrder, deleteOrder } = useInventory();

  // Search/Active Drawer states
  const [selectedOrder, setSelectedOrder] = useState(null); // Deep inspection modal
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Add mode drawer
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Order Form States
  const [orderCustomer, setOrderCustomer] = useState("");
  const [orderItems, setOrderItems] = useState([{ product_id: "", quantity: "1" }]);

  // Add Item Row helper
  const handleAddItemRow = () => {
    setOrderItems((prev) => [...prev, { product_id: "", quantity: "1" }]);
  };

  // Remove Item Row helper
  const handleRemoveItemRow = (idx) => {
    if (orderItems.length === 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update dynamic row value
  const handleUpdateItemRow = (idx, field, val) => {
    const updated = [...orderItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setOrderItems(updated);
  };

  // Calculate live total for the order form
  const getSimulatedTotal = () => {
    let sum = 0;
    for (const item of orderItems) {
      const pId = parseInt(item.product_id);
      const qty = parseInt(item.quantity);
      if (!isNaN(pId) && !isNaN(qty) && qty > 0) {
        const prod = products.find((p) => p.id === pId);
        if (prod) {
          sum += prod.price * qty;
        }
      }
    }
    return sum;
  };

  // Open helper for placing orders
  const handleOpenCreateForm = () => {
    setErrorMsg("");
    setOrderCustomer("");
    setOrderItems([{ product_id: "", quantity: "1" }]);
    setIsCreateOpen(true);
  };

  // Submit Order Creation (stock-locks, validations, deductions)
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const customerIdInt = parseInt(orderCustomer);
    if (isNaN(customerIdInt)) {
      setErrorMsg("Validation Fail: Select a valid billing customer.");
      setIsSubmitting(false);
      return;
    }

    // Step 1: Pre-validate form inputs
    const packedItems = [];
    for (let i = 0; i < orderItems.length; i++) {
      const line = orderItems[i];
      const prodIdInt = parseInt(line.product_id);
      const qtyInt = parseInt(line.quantity);

      if (isNaN(prodIdInt)) {
        setErrorMsg(`Validation Fail (Item row #${i + 1}): You must select a catalog product.`);
        setIsSubmitting(false);
        return;
      }

      if (isNaN(qtyInt) || qtyInt <= 0) {
        setErrorMsg(`Validation Fail (Item row #${i + 1}): Quantity must be at least 1.`);
        setIsSubmitting(false);
        return;
      }

      // Check duplicate inputs for same product to prevent multiple locks
      const duplicated = packedItems.some((pi) => pi.product_id === prodIdInt);
      if (duplicated) {
        setErrorMsg(`Validation Fail (Item row #${i + 1}): Duplicate product input. Please aggregate quantities onto a single row.`);
        setIsSubmitting(false);
        return;
      }

      // Stock check inside state
      const targetProduct = products.find((p) => p.id === prodIdInt);
      if (!targetProduct) {
        setErrorMsg(`Validation Fail: Selected product catalog index is missing.`);
        setIsSubmitting(false);
        return;
      }

      if (qtyInt > targetProduct.quantity_in_stock) {
        setErrorMsg(`Insufficient Stock: "${targetProduct.name}" only has ${targetProduct.quantity_in_stock} items remaining. Requested: ${qtyInt}`);
        setIsSubmitting(false);
        return;
      }

      packedItems.push({
        product_id: prodIdInt,
        quantity: qtyInt
      });
    }

    try {
      const response = await createOrder({
        customer_id: customerIdInt,
        items: packedItems
      });
      setIsCreateOpen(false);
    } catch (err) {
      setErrorMsg(err.message || "An unexpected database deadlock or transaction error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel order (returns stock assets and purges order)
  const handleCancelOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
      setSelectedOrder(null); // Close inspect drawer
    } catch (err) {
      console.error(err.message || "Cancellation failed.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Order Transactions Ledger
          </h2>
          <p className="text-sm text-slate-500">
            Monitor invoices, audit inventory allocations, and deploy checkout pipelines.
          </p>
        </div>

        <button
          onClick={handleOpenCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition duration-150 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Order Invoice
        </button>
      </div>

      {/* MASTER ORDER LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h4 className="text-slate-905 font-bold text-sm">No Orders Placed Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Compile a customer invoice transaction to begin tracking fulfillment activities.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Billing Customer</th>
                  <th className="px-6 py-4">Transaction Date</th>
                  <th className="px-6 py-4">Items count</th>
                  <th className="px-6 py-4">Grand Total</th>
                  <th className="px-6 py-4">Fulfillment Info</th>
                  <th className="px-6 py-4 text-right">Inspect Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((ord) => {
                  const targetCustomer = customers.find((c) => c.id === ord.customer_id);
                  const totalLineCount = ord.items.reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition duration-150">
                      
                      {/* INVOICE NUMBER */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-650">
                        INV-{ord.id}
                      </td>

                      {/* CLIENT BILLING PROFILE */}
                      <td className="px-6 py-4">
                        <span className="block font-semibold text-slate-800">
                          {targetCustomer?.full_name || `Archived Guest (ID: ${ord.customer_id})`}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {targetCustomer?.email || "No contact linked"}
                        </span>
                      </td>

                      {/* TRANSACTION DATE */}
                      <td className="px-6 py-4 text-xs text-slate-550 font-mono">
                        {new Date(ord.created_at).toLocaleString()}
                      </td>

                      {/* ITEMS COUNT */}
                      <td className="px-6 py-4 font-mono font-medium text-slate-800">
                        {totalLineCount} {totalLineCount === 1 ? "unit" : "units"}
                      </td>

                      {/* GRAND TOTAL */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        ₹{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* STATUS BADGE */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          COMPLETED
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          View Receipt
                        </button>
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-600 bg-white hover:bg-red-50 hover:text-red-700 transition cursor-pointer shadow-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
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

      {/* --- INVOICE DETAILS DRAWER MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
            
            {/* DRAWER HEADER */}
            <div className="p-6 border-b border-slate-150 bg-slate-50/70 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <FileText className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Sales Invoice: #INV-{selectedOrder.id}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Fulfillment Complete &middot; System Locked
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* BILLING CLIENT META INFO */}
            <div className="p-6 border-b border-slate-100 grid grid-cols-2 gap-4 text-xs font-sans bg-amber-50/10">
              
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Billing Client Details
                </span>
                {(() => {
                  const targetCustomer = customers.find((c) => c.id === selectedOrder.customer_id);
                  return (
                    <div className="space-y-0.5">
                      <span className="block font-bold text-slate-805 text-sm">
                        {targetCustomer?.full_name || "Archived Guest Accounts"}
                      </span>
                      <span className="block text-slate-500 font-mono text-[11px]">{targetCustomer?.email || "No email profile links"}</span>
                      <span className="block text-slate-500 font-mono text-[11px]">{targetCustomer?.phone_number || "No mobile links"}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Payment Metadata
                </span>
                <div className="space-y-0.5 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date Placed:</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gateway Status:</span>
                    <span className="font-bold text-emerald-700 font-mono text-[10px]">
                      COMPLETED
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ORDERED LINE ITEMS LISTING */}
            <div className="p-6 space-y-4 max-h-[280px] overflow-y-auto">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                Invoiced Assets Listing
              </span>

              <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-150 px-4 py-2 text-slate-500 font-bold uppercase font-mono text-[10px]">
                  <span className="col-span-6">Product Description</span>
                  <span className="col-span-2 text-right">Unit Price</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedOrder.items.map((it) => {
                    const matchedProduct = products.find((p) => p.id === it.product_id);
                    return (
                      <div key={it.id} className="grid grid-cols-12 px-4 py-3 items-center">
                        <div className="col-span-6 space-y-0.5">
                          <span className="block font-bold text-slate-800">
                            {matchedProduct?.name || `Deleted Catalog Item #${it.product_id}`}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-405">
                            SKU Code: {matchedProduct?.sku || "N/A"}
                          </span>
                        </div>

                        <span className="col-span-2 text-right font-mono text-slate-650">
                          ₹{it.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>

                        <span className="col-span-2 text-center font-mono font-bold text-slate-800">
                          {it.quantity}
                        </span>

                        <span className="col-span-2 text-right font-mono font-bold text-slate-900">
                          ₹{(it.unit_price * it.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER TOTALS AREA AND CANCEL ACTION */}
            <div className="p-6 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* ORDER RECOVERY DESTRUCTIVE ACTION button */}
              <button
                onClick={() => handleCancelOrder(selectedOrder.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Cancel Transactions (Replenish Stock)
              </button>

              <div className="w-full sm:w-auto text-right space-y-1">
                <span className="text-slate-400 text-xs block font-medium">Grand Invoice total:</span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono block">
                  ₹{selectedOrder.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- INVOICE CREATION PROCESS DRAWER --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            
            {/* INVOICE HEADER */}
            <div className="p-6 border-b border-slate-150 bg-slate-50/70 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <ShoppingCart className="h-4.5 w-4.5 animate-bounce" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Construct Customer Invoiced Order
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Deduces inventory levels safely with transaction commit
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ERROR SUMMARY */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-250 text-red-700 text-xs rounded-xl flex items-start gap-2 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 animate-pulse" />
                <span className="leading-tight font-medium">{errorMsg}</span>
              </div>
            )}

            {/* FORM FORM */}
            <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-sans flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* BUYER PROFILE DROPDOWN SELECTOR */}
                <div>
                  <label className="block text-slate-550 font-bold mb-1 font-mono text-[10px] uppercase">
                    Select Account Customer (Required)
                  </label>
                  <select
                    required
                    value={orderCustomer}
                    onChange={(e) => setOrderCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="">-- Choose registered customer file --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* LINE ITEMS MASTER SECTION */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="block text-slate-550 font-bold font-mono text-[10px] uppercase">
                      Invoice Item Lines
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-650 border border-slate-200 rounded text-[10px] font-bold font-mono uppercase transition cursor-pointer"
                    >
                      + Add Row Line
                    </button>
                  </div>

                  {/* LOOP EACH ROW */}
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {orderItems.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        
                        {/* INDEX BADGE */}
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>

                        {/* PRODUCT SELECTOR */}
                        <div className="flex-1">
                          <select
                            required
                            value={row.product_id}
                            onChange={(e) => handleUpdateItemRow(idx, "product_id", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Choose Product SKU --</option>
                            {products.map((p) => {
                              const isSelectedByOther = orderItems.some((oi, oiIdx) => oiIdx !== idx && parseInt(oi.product_id) === p.id);
                              return (
                                <option 
                                  key={p.id} 
                                  value={p.id} 
                                  disabled={p.quantity_in_stock === 0 || isSelectedByOther}
                                >
                                  {p.sku} - {p.name} (₹{p.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) [{p.quantity_in_stock} left]
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* QUANTITY INPUT */}
                        <div className="w-24">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) => handleUpdateItemRow(idx, "quantity", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-center focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* DELETE ROW TRIGGERS */}
                        <button
                          type="button"
                          disabled={orderItems.length === 1}
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-2 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* STICKY TOTAL AND SUBMISSIONS CONTAINER */}
              <div className="pt-6 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 bg-slate-50 -mx-6 -mb-6 p-6">
                
                <div className="text-center sm:text-left">
                  <span className="text-slate-400 text-xs block font-medium">Estimated invoice total:</span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight block">
                    ₹{getSimulatedTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 sm:flex-none px-5 py-3 text-slate-650 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 rounded-xl font-semibold transition cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {isSubmitting ? "Committing transaction..." : "Confirm & Place Order"}
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
