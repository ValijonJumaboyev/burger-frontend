window.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://burger-backend-o3cx.onrender.com/api/recipes"

    const recipesContainer = document.getElementById("recipesContainer");
    const recipeModal = document.getElementById("recipeModal");
    const openRecipeModal = document.getElementById("openRecipeModal");
    const closeRecipeModal = document.getElementById("closeRecipeModal");
    const recipeForm = document.getElementById("recipeForm");
    const ingredientsContainer = document.getElementById("ingredientsContainer");
    const productNameInput = document.getElementById("productName");

    let editingId = null;

    // List of allowed units
    const UNITS = ["pcs", "g", "kg", "mg", "ml", "L", "slices", "leaves", "packs", "bottles", "cans", "boxes", "spoons"];

    // Modal handling
    openRecipeModal.addEventListener("click", () => {
        recipeModal.classList.remove("hidden");
        resetForm();
    });

    closeRecipeModal.addEventListener("click", () => {
        recipeModal.classList.add("hidden");
    });

    // Add ingredient row
    document.getElementById("addIngredientBtn").addEventListener("click", () => {
        const row = document.createElement("div");
        row.className = "flex gap-2 items-center";
        row.innerHTML = `
            <input type="text" placeholder="Name" class="border px-2 py-1 rounded flex-1" />
            <input type="number" placeholder="Qty" min="0.0001" step="0.0001" class="border px-2 py-1 rounded w-20" />
            <select class="border px-2 py-1 rounded w-24">
                ${UNITS.map(u => `<option value="${u}">${u}</option>`).join("")}
            </select>
            <button type="button" class="text-red-600 removeIngredient">✕</button>
        `;
        row.querySelector(".removeIngredient").addEventListener("click", () => row.remove());
        ingredientsContainer.appendChild(row);
    });

    // Submit recipe
    recipeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const ingredients = Array.from(ingredientsContainer.children).map(row => {
            const name = row.querySelector("input[type='text']").value.trim();
            const quantity = parseFloat(row.querySelector("input[type='number']").value);
            const unit = row.querySelector("select").value;
            return { name, quantity, unit };
        });

        const recipe = {
            productName: productNameInput.value.trim(),
            ingredients
        };

        try {
            const res = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(recipe)
            });

            if (!res.ok) throw new Error(await res.text());
            recipeModal.classList.add("hidden");
            loadRecipes();
        } catch (err) {
            console.error("Failed to save recipe:", err);
        }
    });

    // Load recipes
    async function loadRecipes() {
        recipesContainer.innerHTML = "";
        try {
            const res = await fetch(API_URL);
            const data = await res.json();

            data.forEach(recipe => renderRecipeCard(recipe));
        } catch (err) {
            console.error("Failed to load recipes:", err);
        }
    }

    function renderRecipeCard(recipe) {
        const card = document.createElement("div");
        card.className = "flex justify-between items-center bg-white p-6 rounded-lg shadow";

        card.innerHTML = `
            <div>
                <h3 class="text-xl font-bold">${recipe.productName}</h3>
                <p class="text-sm text-gray-600">${recipe.ingredients.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(", ")}</p>
            </div>
            <div class="flex gap-2">
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded editBtn">Edit</button>
                <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded deleteBtn">Delete</button>
            </div>
        `;

        card.querySelector(".editBtn").addEventListener("click", () => editRecipe(recipe));
        card.querySelector(".deleteBtn").addEventListener("click", () => deleteRecipe(recipe._id));

        recipesContainer.appendChild(card);
    }

    function editRecipe(recipe) {
        editingId = recipe._id;
        productNameInput.value = recipe.productName;
        ingredientsContainer.innerHTML = "";
        recipe.ingredients.forEach(ing => {
            const row = document.createElement("div");
            row.className = "flex gap-2 items-center";
            row.innerHTML = `
                <input type="text" value="${ing.name}" class="border px-2 py-1 rounded flex-1" />
                <input type="number" value="${ing.quantity}" min="0.0001" step="0.0001" class="border px-2 py-1 rounded w-20" />
                <select class="border px-2 py-1 rounded w-24">
                    ${UNITS.map(u => `<option value="${u}" ${u === ing.unit ? "selected" : ""}>${u}</option>`).join("")}
                </select>
                <button type="button" class="text-red-600 removeIngredient">✕</button>
            `;
            row.querySelector(".removeIngredient").addEventListener("click", () => row.remove());
            ingredientsContainer.appendChild(row);
        });

        recipeModal.classList.remove("hidden");
    }

    async function deleteRecipe(id) {
        if (!confirm("Are you sure you want to delete this recipe?")) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            loadRecipes();
        } catch (err) {
            console.error("Failed to delete recipe:", err);
        }
    }

    function resetForm() {
        editingId = null;
        productNameInput.value = "";
        ingredientsContainer.innerHTML = "";
    }

    // Init
    loadRecipes();
});