window.addEventListener("DOMContentLoaded", () => {
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modal = document.getElementById("itemModal");
    const modalTitle = document.getElementById("modalTitle");
    const form = document.getElementById("itemForm");
    const tableBody = document.getElementById("inventoryTable");

    const decrementModal = document.getElementById("decrementModal");
    const closeDecrementModal = document.getElementById("closeDecrementModal");
    const deleteItemBtn = document.getElementById("deleteItemBtn");
    const decreaseItemBtn = document.getElementById("decreaseItemBtn");
    const decrementValue = document.getElementById("decrementValue");

    const searchInput = document.getElementById("searchInput");
    const sortByValueBtn = document.getElementById("sortByValue");

    let selectedItemId = null;
    let editingItemId = null;
    let sortAsc = true;
    let allData = [];

    const API_URL = "https://burger-backend-o3cx.onrender.com";
    const API_ITEMS = `${API_URL}/api/inventory`; // Adjust to match your backend route

    // --- Modal Handling ---
    openModalBtn.addEventListener("click", () => {
        modalTitle.textContent = "Add New Item";
        editingItemId = null;
        form.reset();
        modal.classList.remove("hidden");
    });

    closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

    // --- Add/Edit Item ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("itemName").value.trim();
        const category = document.getElementById("category").value.trim();
        const unit = document.getElementById("unitSelect").value.trim();
        const quantity = parseFloat(document.getElementById("quantity").value) || 0;
        const unitCost = parseFloat(document.getElementById("unitCost").value) || 0;
        const totalCost = quantity * unitCost;

        const item = { name, category, unit, quantity, unitCost, totalCost };

        try {
            if (editingItemId) {
                const res = await fetch(`${API_ITEMS}/${editingItemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item),
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                const res = await fetch(API_ITEMS, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item),
                });
                if (!res.ok) throw new Error(await res.text());
            }

            await reloadTable();
            modal.classList.add("hidden");
            form.reset();
        } catch (err) {
            console.error("Failed to save item:", err);
        }
    });

    // --- Table Row Rendering ---
    function addTableRow(item) {
        const row = document.createElement("tr");
        const lowStockClass = item.quantity <= 5 ? "bg-red-100" : "";
        row.className = lowStockClass;

        const formattedUnitCost = Number(item.unitCost).toLocaleString('de-DE');
        const formattedTotalCost = Number(item.totalCost).toLocaleString('de-DE');

        row.innerHTML = `
      <td class="p-3 border">${item.name}</td>
      <td class="p-3 border">${item.category}</td>
      <td class="p-3 border">${item.unit}</td>
      <td class="p-3 border">${item.quantity}</td>
      <td class="p-3 border">${formattedUnitCost} so'm</td>
      <td class="p-3 border">${formattedTotalCost} so'm</td>
      <td class="p-3 border text-center flex gap-2">
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded decrementBtn" data-id="${item._id}">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded editBtn" data-id="${item._id}">
          <i class="fa-solid fa-pen"></i>
        </button>
      </td>
    `;
        tableBody.appendChild(row);
    }

    // --- Reload Table ---
    async function reloadTable() {
        tableBody.innerHTML = "";
        try {
            const res = await fetch(API_ITEMS);
            if (!res.ok) throw new Error(await res.text());
            allData = await res.json();
            renderTable(allData);
        } catch (err) {
            console.error("Failed to load inventory:", err);
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = "";
        let total = 0;
        data.forEach(item => {
            addTableRow(item);
            total += Number(item.totalCost);
        });
        const formattedTotal = total.toLocaleString('de-DE');
        document.getElementById("totalInventoryValue").textContent = `${formattedTotal} so'm`;
    }

    // --- Actions ---
    tableBody.addEventListener("click", (e) => {
        if (e.target.closest(".decrementBtn")) {
            selectedItemId = e.target.closest(".decrementBtn").dataset.id;
            decrementModal.classList.remove("hidden");
        }
        if (e.target.closest(".editBtn")) {
            editingItemId = e.target.closest(".editBtn").dataset.id;
            openEditModal(editingItemId);
        }
    });

    function openEditModal(id) {
        const item = allData.find(x => x._id === id);
        if (!item) return;
        modalTitle.textContent = "Edit Item";
        document.getElementById("itemName").value = item.name;
        document.getElementById("category").value = item.category;
        document.getElementById("unitSelect").value = item.unit;
        document.getElementById("quantity").value = item.quantity;
        document.getElementById("unitCost").value = item.unitCost;
        modal.classList.remove("hidden");
    }

    // --- Decrement/Delete ---
    closeDecrementModal.addEventListener("click", () => decrementModal.classList.add("hidden"));
    decrementModal.addEventListener("click", (e) => { if (e.target === decrementModal) decrementModal.classList.add("hidden"); });

    deleteItemBtn.addEventListener("click", async () => {
        try {
            const res = await fetch(`${API_ITEMS}/${selectedItemId}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            await reloadTable();
            decrementModal.classList.add("hidden");
        } catch (err) {
            console.error("Failed to delete item:", err);
        }
    });

    decreaseItemBtn.addEventListener("click", async () => {
        const amount = parseInt(decrementValue.value) || 1;
        try {
            const res = await fetch(`${API_ITEMS}/${selectedItemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "decrement", amount }),
            });
            if (!res.ok) throw new Error(await res.text());
            await reloadTable();
            decrementValue.value = "";
            decrementModal.classList.add("hidden");
        } catch (err) {
            console.error("Failed to decrement item:", err);
        }
    });

    // --- Search ---
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allData.filter(item => item.name.toLowerCase().includes(query));
        renderTable(filtered);
    });

    // --- Sort ---
    sortByValueBtn.addEventListener("click", () => {
        const sorted = [...allData].sort((a, b) => sortAsc ? a.totalCost - b.totalCost : b.totalCost - a.totalCost);
        sortAsc = !sortAsc;
        renderTable(sorted);
    });

    // --- Init ---
    reloadTable();
});