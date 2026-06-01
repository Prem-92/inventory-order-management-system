import React, { createContext, useContext, useState, useEffect } from "react";

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};

const API_BASE = "http://localhost:8000/api/v1";

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/products/`),
        fetch(`${API_BASE}/customers/`),
        fetch(`${API_BASE}/orders/`)
      ]);

      if (productsRes.ok) {
        const prodData = await productsRes.json();
        setProducts(prodData);
      }
      if (customersRes.ok) {
        const custData = await customersRes.json();
        setCustomers(custData);
      }
      if (ordersRes.ok) {
        const ordData = await ordersRes.json();
        setOrders(ordData);
      }
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS WITH BACKEND INTEGRATION ---

  // 1. PRODUCTS
  const addProduct = async (productData) => {
    const sku = productData.sku.trim().toUpperCase();
    const name = productData.name.trim();
    const price = parseFloat(productData.price);
    const stock = parseInt(productData.quantity_in_stock);

    if (!sku || sku.length < 3) throw new Error("SKU must be at least 3 characters long.");
    if (!name) throw new Error("Product name cannot be empty.");
    if (isNaN(price) || price <= 0) throw new Error("Price must be a positive decimal number.");
    if (isNaN(stock) || stock < 0) throw new Error("Stock cannot be negative.");

    const response = await fetch(`${API_BASE}/products/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        name,
        description: productData.description?.trim() || "",
        price: price,
        quantity_in_stock: stock
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to add product");
    }

    const newProd = await response.json();
    setProducts((prev) => [...prev, newProd]);
    return newProd;
  };

  const updateProduct = async (id, updatedData) => {
    const sku = updatedData.sku.trim().toUpperCase();
    const name = updatedData.name.trim();
    const price = parseFloat(updatedData.price);
    const stock = parseInt(updatedData.quantity_in_stock);

    if (!sku || sku.length < 3) throw new Error("SKU must be at least 3 characters long.");
    if (!name) throw new Error("Product name cannot be empty.");
    if (isNaN(price) || price <= 0) throw new Error("Price must be a positive decimal.");
    if (isNaN(stock) || stock < 0) throw new Error("Stock quantity cannot be negative.");

    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        name,
        description: updatedData.description?.trim() || "",
        price: price,
        quantity_in_stock: stock
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to update product");
    }

    const updatedProd = await response.json();
    setProducts((prev) => prev.map((p) => (p.id === id ? updatedProd : p)));
  };

  const deleteProduct = async (id) => {
    const response = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to delete product");
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };


  // 2. CUSTOMERS
  const addCustomer = async (customerData) => {
    const fullName = customerData.full_name.trim();
    const email = customerData.email.trim().toLowerCase();
    const phone = customerData.phone_number?.trim() || "";

    if (!fullName) throw new Error("Customer full name is required.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Please supply a valid email address.");

    const response = await fetch(`${API_BASE}/customers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone_number: phone || null
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to register customer");
    }

    const newCust = await response.json();
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  const deleteCustomer = async (id) => {
    const response = await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to delete customer");
    }
    await fetchData(); // Refetch to sync cascaded orders if deleted
  };


  // 3. ORDERS
  const createOrder = async (orderData) => {
    const customerId = parseInt(orderData.customer_id);
    if (isNaN(customerId)) throw new Error("Invalid billing customer selected.");

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Order must contain at least 1 item line.");
    }

    const items = orderData.items.map(item => ({
      product_id: parseInt(item.product_id),
      quantity: parseInt(item.quantity)
    }));

    for (let item of items) {
      if (isNaN(item.product_id)) throw new Error("Each line item must point to a valid product catalog.");
      if (isNaN(item.quantity) || item.quantity <= 0) throw new Error("Desired quantity must be 1 or greater.");
    }

    const response = await fetch(`${API_BASE}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        items: items
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to create order");
    }

    const newOrd = await response.json();
    await fetchData(); // Refetch all to update products stock and orders lists
    return newOrd;
  };

  const deleteOrder = async (orderId) => {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, { method: "DELETE" });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to cancel order");
    }
    await fetchData(); // Refetch to update restored product stock and remove order
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        customers,
        orders,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        deleteCustomer,
        createOrder,
        deleteOrder
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
