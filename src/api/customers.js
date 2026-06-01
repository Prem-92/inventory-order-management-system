const BASE_URL = "http://localhost:8000/api/v1/customers";

// GET all customers
export async function fetchCustomers(skip = 0, limit = 100) {
  const res = await fetch(`${BASE_URL}?skip=${skip}&limit=${limit}`);

  if (!res.ok) {
    throw new Error("Failed to fetch customers");
  }

  return await res.json();
}

// CREATE customer
export async function createCustomer(payload) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.detail || "Failed to create customer");
  }

  return await res.json();
}

// DELETE customer
export async function deleteCustomerById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    throw new Error("Failed to delete customer");
  }

  return await res.json();
}
