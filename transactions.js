const API_URL = "http://localhost:5009/api";

const tableBody = document.querySelector("#transactionsTableBody");
const transactionsCount = document.querySelector("#transactionsCount");
const rangeInfo = document.querySelector("#rangeInfo");

const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const scopeFilter = document.querySelector("#scopeFilter");
const typeFilter = document.querySelector("#typeFilter");

const selectAllCheckbox = document.querySelector("#selectAll");
const selectedCountElement = document.querySelector(".selected-count");

const prevPageBtn = document.querySelector("#prevPage");
const nextPageBtn = document.querySelector("#nextPage");
const pagesList = document.querySelector("#pagesList");

const changeCategoryBtn = document.querySelector("#changeCategoryBtn");
const addScopeBtn = document.querySelector("#addScopeBtn");
const deleteBtn = document.querySelector("#deleteBtn");

const dateFilterBtn = document.querySelector(".date-filter");
const filterBtn = document.querySelector(".filter-btn");
const settingsBtn = document.querySelector(".settings-btn");
const pageSizeBtn = document.querySelector(".page-size");

let transactions = [];
let filteredTransactions = [];
let categories = [];
let scopes = [];

let currentPage = 1;
let pageSize = 25;

let dateFrom = null;
let dateTo = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadCategories();
    await loadScopes();
    await loadTransactions();
    bindEvents();
});

async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Ошибка загрузки транзакций");
            return;
        }

        transactions = data.data || [];

        transactions.sort((a, b) => {
            return new Date(b.dateUtc) - new Date(a.dateUtc);
        });

        applyFilters();

    } catch (error) {
        console.error(error);
        alert("Не удалось загрузить транзакции");
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();

        if (!data.success) {
            return;
        }

        categories = data.data || [];

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });

    } catch (error) {
        console.error(error);
    }
}

async function loadScopes() {
    try {
        const response = await fetch(`${API_URL}/scopes`);
        const data = await response.json();

        if (!data.success) {
            return;
        }

        scopes = data.data || [];

        scopes.forEach(scope => {
            const option = document.createElement("option");
            option.value = scope.id;
            option.textContent = scope.name;
            scopeFilter.appendChild(option);
        });

    } catch (error) {
        console.error(error);
    }
}

function bindEvents() {
    searchInput.addEventListener("input", applyFilters);
    categoryFilter.addEventListener("change", applyFilters);
    scopeFilter.addEventListener("change", applyFilters);
    typeFilter.addEventListener("change", applyFilters);

    selectAllCheckbox.addEventListener("change", toggleAllCheckboxes);

    prevPageBtn.addEventListener("click", previousPage);
    nextPageBtn.addEventListener("click", nextPage);

    changeCategoryBtn.addEventListener("click", changeCategory);
    addScopeBtn.addEventListener("click", addScope);
    deleteBtn.addEventListener("click", deleteTransactions);

    if (dateFilterBtn) {
        dateFilterBtn.addEventListener("click", changeDatePeriod);
    }

    if (filterBtn) {
        filterBtn.addEventListener("click", resetFilters);
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            alert("Настройка колонок пока не реализована");
        });
    }

    if (pageSizeBtn) {
        pageSizeBtn.addEventListener("click", changePageSize);
    }
}

function applyFilters() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedScope = scopeFilter.value;
    const selectedType = typeFilter.value;

    filteredTransactions = transactions.filter(transaction => {
        const description = transaction.description || "";
        const categoryName = transaction.category?.name || "";
        const scopeName = transaction.scope?.name || "";
        const tagsText = transaction.tags?.map(tag => tag.name).join(" ") || "";

        const searchableText = `
            ${description}
            ${categoryName}
            ${scopeName}
            ${tagsText}
        `.toLowerCase();

        const matchesSearch =
            !searchText || searchableText.includes(searchText);

        const matchesCategory =
            !selectedCategory ||
            transaction.category?.id === selectedCategory;

        const matchesScope =
            !selectedScope ||
            transaction.scope?.id === selectedScope;

        const matchesType =
            !selectedType ||
            transaction.type === selectedType;

        const transactionDate = new Date(transaction.dateUtc);

        const matchesDateFrom =
            !dateFrom || transactionDate >= dateFrom;

        const matchesDateTo =
            !dateTo || transactionDate <= dateTo;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesScope &&
            matchesType &&
            matchesDateFrom &&
            matchesDateTo
        );
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    transactionsCount.textContent = filteredTransactions.length;
    tableBody.innerHTML = "";
    selectAllCheckbox.checked = false;
    updateSelectedCount();

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-row">
                    Транзакции не найдены
                </td>
            </tr>
        `;

        updatePagination();
        return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    const pageItems = filteredTransactions.slice(start, end);

    pageItems.forEach(transaction => {
        const amount = Number(transaction.amount);

        const amountClass =
            amount >= 0 ? "amount-income" : "amount-expense";

        const amountText =
            amount >= 0
                ? `+${formatMoney(amount)} ₽`
                : `${formatMoney(amount)} ₽`;

        const date = new Date(transaction.dateUtc);

        const formattedDate =
            date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        const tags = transaction.tags?.length
            ? transaction.tags
                .map(tag => `<span class="tag-item">${tag.name}</span>`)
                .join("")
            : "—";

        const row = `
            <tr data-id="${transaction.id}">
                <td>
                    <input
                        type="checkbox"
                        class="transaction-checkbox"
                        value="${transaction.id}"
                    >
                </td>

                <td>${formattedDate}</td>

                <td>${transaction.description || "—"}</td>

                <td>
                    <span class="category-tag">
                        ${transaction.category?.name || "—"}
                    </span>
                </td>

                <td class="${amountClass}">
                    ${amountText}
                </td>

                <td>${tags}</td>

                <td>
                    <span class="scope-tag">
                        ${transaction.scope?.name || "—"}
                    </span>
                </td>

                <td class="comment-cell">
                    ${transaction.comment || "—"}
                </td>
            </tr>
        `;

        tableBody.innerHTML += row;
    });

    const checkboxes = document.querySelectorAll(".transaction-checkbox");

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateSelectedCount);
    });

    updatePagination();
}

function updatePagination() {
    const totalItems = filteredTransactions.length;

    const totalPages = Math.max(
        1,
        Math.ceil(totalItems / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    const startItem =
        totalItems === 0
            ? 0
            : (currentPage - 1) * pageSize + 1;

    const endItem =
        Math.min(currentPage * pageSize, totalItems);

    if (rangeInfo) {
        rangeInfo.textContent = `${startItem}–${endItem}`;
    }

    renderPageNumbers(totalPages);
}

function renderPageNumbers(totalPages) {
    if (!pagesList) {
        return;
    }

    pagesList.innerHTML = "";

    const pages = getPaginationPages(currentPage, totalPages);

    pages.forEach(item => {
        if (item === "...") {
            const dots = document.createElement("span");
            dots.className = "page-dots";
            dots.textContent = "...";
            pagesList.appendChild(dots);
            return;
        }

        const button = document.createElement("button");
        button.className = "page-number";

        if (item === currentPage) {
            button.classList.add("active");
        }

        button.textContent = item;

        button.addEventListener("click", () => {
            currentPage = item;
            renderTable();
        });

        pagesList.appendChild(button);
    });
}

function getPaginationPages(current, total) {
    if (total <= 5) {
        return Array.from(
            { length: total },
            (_, index) => index + 1
        );
    }

    if (current <= 3) {
        return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 2) {
        return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current, current + 1, current + 2, "...", total];
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);

    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function toggleAllCheckboxes() {
    const checkboxes = document.querySelectorAll(".transaction-checkbox");

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });

    updateSelectedCount();
}

function updateSelectedCount() {
    const selectedIds = getSelectedIds();

    if (selectedCountElement) {
        selectedCountElement.textContent = selectedIds.length;
    }
}

function getSelectedIds() {
    const checkboxes =
        document.querySelectorAll(".transaction-checkbox:checked");

    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

async function changeCategory() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        alert("Выберите транзакции");
        return;
    }

    if (categories.length === 0) {
        alert("Категории не загружены");
        return;
    }

    const categoryText = categories
        .map((category, index) => `${index + 1}. ${category.name}`)
        .join("\n");

    const choice = prompt(
        `Выберите номер категории:\n\n${categoryText}`
    );

    if (!choice) {
        return;
    }

    const index = Number(choice) - 1;
    const category = categories[index];

    if (!category) {
        alert("Такой категории нет");
        return;
    }

    try {
        await updateCategory(selectedIds, category.id);

        categoryFilter.value = "";

        await loadTransactions();

        alert("Категория успешно изменена");

    } catch (error) {
        console.error(error);
        alert("Ошибка изменения категории");
    }
}

async function addScope() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        alert("Выберите транзакции");
        return;
    }

    if (scopes.length === 0) {
        alert("Группы не загружены");
        return;
    }

    const scopeText = scopes
        .map((scope, index) => `${index + 1}. ${scope.name}`)
        .join("\n");

    const choice = prompt(
        `Выберите номер группы:\n\n${scopeText}`
    );

    if (!choice) {
        return;
    }

    const index = Number(choice) - 1;
    const scope = scopes[index];

    if (!scope) {
        alert("Такой группы нет");
        return;
    }

    try {
        await updateScope(selectedIds, scope.id);

        scopeFilter.value = "";

        await loadTransactions();

        alert("Группа успешно изменена");

    } catch (error) {
        console.error(error);
        alert("Ошибка изменения группы");
    }
}

async function deleteTransactions() {
    const ids = getSelectedIds();

    if (ids.length === 0) {
        alert("Выберите транзакции");
        return;
    }

    const confirmed = confirm(
        `Удалить выбранные транзакции (${ids.length})?`
    );

    if (!confirmed) {
        return;
    }

    try {
        for (const id of ids) {
            const response = await fetch(
                `${API_URL}/transactions/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error(`Ошибка удаления транзакции ${id}`);
            }
        }

        await loadTransactions();

        alert("Транзакции удалены");

    } catch (error) {
        console.error(error);
        alert("Не удалось удалить транзакции");
    }
}

async function updateCategory(ids, categoryId) {
    const response = await fetch(
        `${API_URL}/transactions/bulk`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                transactionIds: ids,
                categoryId: categoryId
            })
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error(text);
        throw new Error("Не удалось изменить категорию");
    }
}

async function updateScope(ids, scopeId) {
    const response = await fetch(
        `${API_URL}/transactions/bulk`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                transactionIds: ids,
                scopeId: scopeId
            })
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error(text);
        throw new Error("Не удалось назначить группу");
    }
}

function changeDatePeriod() {
    const fromInput = prompt(
        "Введите начальную дату в формате ДД.ММ.ГГГГ\nНапример: 01.05.2024"
    );

    if (!fromInput) {
        return;
    }

    const toInput = prompt(
        "Введите конечную дату в формате ДД.ММ.ГГГГ\nНапример: 31.05.2024"
    );

    if (!toInput) {
        return;
    }

    const from = parseRussianDate(fromInput);
    const to = parseRussianDate(toInput);

    if (!from || !to) {
        alert("Неверный формат даты");
        return;
    }

    to.setHours(23, 59, 59, 999);

    dateFrom = from;
    dateTo = to;

    const span = dateFilterBtn.querySelector("span");

    if (span) {
        span.textContent = `${fromInput} – ${toInput}`;
    }

    applyFilters();
}

function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "";
    scopeFilter.value = "";
    typeFilter.value = "";
    dateFrom = null;
    dateTo = null;

    const span = dateFilterBtn?.querySelector("span");

    if (span) {
        span.textContent = "Все даты";
    }

    applyFilters();
}

function changePageSize() {
    const value = prompt(
        "Сколько транзакций показывать на странице?\nНапример: 10, 25, 50"
    );

    if (!value) {
        return;
    }

    const number = Number(value);

    if (!number || number <= 0) {
        alert("Введите нормальное число");
        return;
    }

    pageSize = number;
    currentPage = 1;

    const pageSizeText = pageSizeBtn?.querySelector("b");

    if (pageSizeText) {
        pageSizeText.textContent = pageSize;
    }

    renderTable();
}

function parseRussianDate(value) {
    const parts = value.split(".");

    if (parts.length !== 3) {
        return null;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);

    const date = new Date(year, month, day);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function formatMoney(value) {
    return value.toLocaleString("ru-RU", {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    });
}