import React, { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import {
  Users,
  Plus,
  Trash2,
  Search,
  X,
  AlertTriangle,
  Mail,
  Phone,
  UserCheck
} from "lucide-react";

export default function Customers() {
  const { customers, orders, addCustomer, deleteCustomer } = useInventory();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Process filters
  const filteredCustomers = customers.filter((cust) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      cust.full_name.toLowerCase().includes(query) ||
      cust.email.toLowerCase().includes(query) ||
      (cust.phone_number && cust.phone_number.includes(query))
    );
  });

  const handleOpenAdd = () => {
    setErrorMsg("");
    setFullName("");
    setEmail("");
    setPhone("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const clientPayload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone.trim()
    };

    if (!clientPayload.full_name) {
      setErrorMsg("Validation Fail: Full name is required for registration.");
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientPayload.email)) {
      setErrorMsg("Validation Fail: Provide a syntactically correct email address structure.");
      setIsSubmitting(false);
      return;
    }

    try {
      await addCustomer(clientPayload);
      setIsFormOpen(false);
    } catch (err) {
      setErrorMsg(err.message || "Email uniqueness check failed on database commit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name, email) => {
    try {
      await deleteCustomer(id);
    } catch (err) {
      console.error(err.message || "Failed to remove customer.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Directory
          </h2>
          <p className="text-sm text-slate-500">
            Enroll new buyers, review client profiles, and track billing destinations.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition duration-150 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Enroll Customer
        </button>
      </div>

      {/* SEARCH AND CONTROL ROW */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by full name or mailing email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="font-bold text-slate-700">{filteredCustomers.length}</span> profiles
        </div>
      </div>

      {/* CUSTOMER DIRECTORY LAYOUT GRID */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center flex flex-col items-center justify-center space-y-3 shadow-sm animate-fadeIn">
          <div className="p-4 bg-slate-50 rounded-full text-slate-400">
            <Users className="h-8 w-8" />
          </div>
          <h4 className="text-slate-900 font-bold text-sm">No Customers Registered</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Try correcting your search terms or enroll a brand-new customer profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => {
            const clientOrdersCount = orders.filter((o) => o.customer_id === cust.id).length;
            const clientSpentTotal = orders
              .filter((o) => o.customer_id === cust.id)
              .reduce((acc, curr) => acc + curr.total_amount, 0);

            return (
              <div
                key={cust.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                
                {/* PROFILE INFORMATION */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-650 font-bold uppercase transition hover:scale-105 duration-150 text-sm">
                      {cust.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{cust.full_name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        UID: #{cust.id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-sans pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{cust.phone_number || "No contact digits registered"}</span>
                    </div>
                  </div>
                </div>

                {/* LEDGER METADATA & OPERATIONS ACTIONS */}
                <div className="mt-5 pt-4 border-t border-slate-150 flex items-center justify-between">
                  <div className="text-[11px] font-mono">
                    <div className="text-slate-400">Total orders:</div>
                    <div className="font-bold text-slate-800">
                      {clientOrdersCount} order(s) placed
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(cust.id, cust.full_name, cust.email)}
                    className="p-2 border border-red-50 text-red-650 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Delete record and cancel references"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER FORM FOR CLIENT ENROLLMENT */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-400/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Users className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Register Customer Profile
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Unique identity constraint checks
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

            {/* ERROR DISPLAY */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
                <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
              
              {/* CUSTOMER NAME */}
              <div>
                <label className="block text-slate-550 font-bold mb-1 font-mono text-[10px] uppercase">
                  Customer full name (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-slate-550 font-bold mb-1 font-mono text-[10px] uppercase">
                  Mailing address (Required / Unique constraint)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-450 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-slate-550 font-bold mb-1 font-mono text-[10px] uppercase">
                  Telephone Contact (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-450 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* ACTION COMMANDS */}
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
                  {isSubmitting ? "Enrolling client..." : "Create Profile"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
