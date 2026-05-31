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
const moreBtn = document.querySelector("#moreBtn");

const dateFilterBtn = document.querySelector(".date-filter");
const filterBtn = document.querySelector(".filter-btn");
const settingsBtn = document.querySelector("#settingsBtn");
const pageSizeBtn = document.querySelector(".page-size");

const settingsModal = document.querySelector("#settingsModal");
const settingsCloseBtn = document.querySelector("#settingsCloseBtn");
const settingsTabs = document.querySelectorAll(".settings-tab");
const settingsList = document.querySelector("#settingsList");
const settingsCreateForm = document.querySelector("#settingsCreateForm");
const settingsCreateInput = document.querySelector("#settingsCreateInput");
const settingsHint = document.querySelector("#settingsHint");
const settingsError = document.querySelector("#settingsError");

const selectModal = document.querySelector("#selectModal");
const selectModalTitle = document.querySelector("#selectModalTitle");
const selectModalSelect = document.querySelector("#selectModalSelect");
const selectCloseBtn = document.querySelector("#selectCloseBtn");
const selectCancelBtn = document.querySelector("#selectCancelBtn");
const selectApplyBtn = document.querySelector("#selectApplyBtn");

let transactions = [];
let filteredTransactions = [];
let categories = [];
let scopes = [];
let tags = [];

let currentPage = 1;
let pageSize = 25;

let dateFrom = null;
let dateTo = null;

let activeSettingsTab = "categories";
let currentSelectAction = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadReferences();
    await loadTransactions();
    bindEvents();
});

/*
    =========================
    API
    =========================
*/

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);

    if (!response.ok && response.status !== 204) {
        let errorText = `HTTP ${response.status}`;

        try {
            const errorData = await response.json();
            errorText = errorData.error || errorText;
        } catch {
            errorText = await response.text();
        }

        throw new Error(errorText);
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (data && data.success === false) {
        throw new Error(data.error || "Ошибка API");
    }

    return data?.data ?? data;
}

async function loadTransactions() {
    try {
        const data = await apiRequest("/transactions");

        transactions = data || [];

        transactions.sort((a, b) => {
            return new Date(b.dateUtc) - new Date(a.dateUtc);
        });

        applyFilters();

    } catch (error) {
        console.error(error);
        alert("Не удалось загрузить транзакции");
    }
}

async function loadReferences() {
    await Promise.all([
        loadCategories(),
        loadScopes(),
        loadTags()
    ]);
}

async function loadCategories() {
    try {
        categories = await apiRequest("/categories") || [];
        renderCategoryFilter();

    } catch (error) {
        console.error(error);
    }
}

async function loadScopes() {
    try {
        scopes = await apiRequest("/scopes") || [];
        renderScopeFilter();

    } catch (error) {
        console.error(error);
    }
}

async function loadTags() {
    try {
        tags = await apiRequest("/tags") || [];

    } catch (error) {
        console.error(error);
    }
}

async function createReference(type, name) {
    const path = getReferencePath(type);

    await apiRequest(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
    });
}

async function updateReference(type, id, name) {
    const path = getReferencePath(type);

    await apiRequest(`${path}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
    });
}

async function deleteReference(type, id) {
    const path = getReferencePath(type);

    await apiRequest(`${path}/${id}`, {
        method: "DELETE"
    });
}

function getReferencePath(type) {
    if (type === "categories") {
        return "/categories";
    }

    if (type === "scopes") {
        return "/scopes";
    }

    return "/tags";
}

/*
    =========================
    СОБЫТИЯ
    =========================
*/

function bindEvents() {
    searchInput.addEventListener("input", applyFilters);
    categoryFilter.addEventListener("change", applyFilters);
    scopeFilter.addEventListener("change", applyFilters);
    typeFilter.addEventListener("change", applyFilters);

    selectAllCheckbox.addEventListener("change", toggleAllCheckboxes);

    prevPageBtn.addEventListener("click", previousPage);
    nextPageBtn.addEventListener("click", nextPage);

    changeCategoryBtn.addEventListener("click", openCategorySelect);
    addScopeBtn.addEventListener("click", openScopeSelect);
    deleteBtn.addEventListener("click", deleteTransactions);

    if (moreBtn) {
        moreBtn.addEventListener("click", openMoreActions);
    }

    if (dateFilterBtn) {
        dateFilterBtn.addEventListener("click", changeDatePeriod);
    }

    if (filterBtn) {
        filterBtn.addEventListener("click", resetFilters);
    }

    if (pageSizeBtn) {
        pageSizeBtn.addEventListener("click", changePageSize);
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", openSettingsModal);
    }

    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener("click", closeSettingsModal);
    }

    if (settingsModal) {
        settingsModal.addEventListener("click", event => {
            if (event.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }

    settingsTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeSettingsTab = tab.dataset.tab;

            settingsTabs.forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            renderSettingsModal();
        });
    });

    if (settingsCreateForm) {
        settingsCreateForm.addEventListener("submit", createReferenceFromModal);
    }

    if (selectCloseBtn) {
        selectCloseBtn.addEventListener("click", closeSelectModal);
    }

    if (selectCancelBtn) {
        selectCancelBtn.addEventListener("click", closeSelectModal);
    }

    if (selectApplyBtn) {
        selectApplyBtn.addEventListener("click", applySelectAction);
    }

    if (selectModal) {
        selectModal.addEventListener("click", event => {
            if (event.target === selectModal) {
                closeSelectModal();
            }
        });
    }
}

/*
    =========================
    ФИЛЬТРЫ
    =========================
*/

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

/*
    =========================
    РЕНДЕР СПРАВОЧНИКОВ
    =========================
*/

function renderCategoryFilter() {
    const currentValue = categoryFilter.value;

    categoryFilter.innerHTML = `
        <option value="">Все категории</option>
    `;

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });

    categoryFilter.value = currentValue;
}

function renderScopeFilter() {
    const currentValue = scopeFilter.value;

    scopeFilter.innerHTML = `
        <option value="">Все группы</option>
    `;

    scopes.forEach(scope => {
        const option = document.createElement("option");
        option.value = scope.id;
        option.textContent = scope.name;
        scopeFilter.appendChild(option);
    });

    scopeFilter.value = currentValue;
}

/*
    =========================
    РЕНДЕР ТАБЛИЦЫ
    =========================
*/

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

        const tagsHtml = transaction.tags?.length
            ? transaction.tags
                .map(tag => `<span class="tag-item">${escapeHtml(tag.name)}</span>`)
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

                <td>${escapeHtml(transaction.description || "—")}</td>

                <td>
                    <span class="category-tag">
                        ${escapeHtml(transaction.category?.name || "—")}
                    </span>
                </td>

                <td class="${amountClass}">
                    ${amountText}
                </td>

                <td>${tagsHtml}</td>

                <td>
                    <span class="scope-tag">
                        ${escapeHtml(transaction.scope?.name || "—")}
                    </span>
                </td>

                <td class="comment-cell">
                    ${escapeHtml(transaction.comment || "—")}
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

/*
    =========================
    ПАГИНАЦИЯ
    =========================
*/

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

/*
    =========================
    ВЫБОР
    =========================
*/

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

/*
    =========================
    МАССОВЫЕ ДЕЙСТВИЯ
    =========================
*/

function openCategorySelect() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        alert("Выберите транзакции");
        return;
    }

    if (categories.length === 0) {
        alert("Категории не загружены");
        return;
    }

    openSelectModal({
        title: "Изменить категорию",
        items: categories,
        placeholder: "Выберите категорию",
        action: "category"
    });
}

function openScopeSelect() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        alert("Выберите транзакции");
        return;
    }

    if (scopes.length === 0) {
        alert("Сначала создайте группу в настройках");
        return;
    }

    openSelectModal({
        title: "Добавить в группу",
        items: scopes,
        placeholder: "Выберите группу",
        action: "scope"
    });
}

function openSelectModal({ title, items, placeholder, action }) {
    currentSelectAction = action;

    selectModalTitle.textContent = title;

    selectModalSelect.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = placeholder;
    selectModalSelect.appendChild(emptyOption);

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        selectModalSelect.appendChild(option);
    });

    selectModal.hidden = false;
}

function closeSelectModal() {
    selectModal.hidden = true;
    currentSelectAction = null;
    selectModalSelect.innerHTML = "";
}

async function applySelectAction() {
    const selectedIds = getSelectedIds();
    const selectedValue = selectModalSelect.value;

    if (selectedIds.length === 0) {
        alert("Выберите транзакции");
        closeSelectModal();
        return;
    }

    if (!selectedValue) {
        alert("Выберите значение");
        return;
    }

    try {
        if (currentSelectAction === "category") {
            await bulkUpdateTransactions({
                transactionIds: selectedIds,
                categoryId: selectedValue
            });

            categoryFilter.value = "";
        }

        if (currentSelectAction === "scope") {
            await bulkUpdateTransactions({
                transactionIds: selectedIds,
                scopeId: selectedValue
            });

            scopeFilter.value = "";
        }

        closeSelectModal();
        await loadTransactions();

    } catch (error) {
        console.error(error);
        alert("Не удалось применить изменение");
    }
}

function openMoreActions() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        alert("Выберите транзакции");
        return;
    }

    const action = prompt(
        "Выберите действие:\n\n1 — Убрать из группы\n2 — Задать комментарий\n3 — Очистить теги"
    );

    if (!action) {
        return;
    }

    if (action === "1") {
        removeScopeFromTransactions();
        return;
    }

    if (action === "2") {
        setCommentForTransactions();
        return;
    }

    if (action === "3") {
        clearTagsFromTransactions();
        return;
    }

    alert("Такого действия нет");
}

async function removeScopeFromTransactions() {
    const selectedIds = getSelectedIds();

    if (!confirm(`Убрать из группы выбранные транзакции (${selectedIds.length})?`)) {
        return;
    }

    try {
        await bulkUpdateTransactions({
            transactionIds: selectedIds,
            deleteScope: true
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);
        alert("Не удалось убрать группу");
    }
}

async function setCommentForTransactions() {
    const selectedIds = getSelectedIds();

    const comment = prompt("Введите комментарий");

    if (comment === null) {
        return;
    }

    try {
        await bulkUpdateTransactions({
            transactionIds: selectedIds,
            comment: comment
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);
        alert("Не удалось задать комментарий");
    }
}

async function clearTagsFromTransactions() {
    const selectedIds = getSelectedIds();

    if (!confirm(`Очистить теги у выбранных транзакций (${selectedIds.length})?`)) {
        return;
    }

    try {
        await bulkUpdateTransactions({
            transactionIds: selectedIds,
            replaceTagIds: []
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);
        alert("Не удалось очистить теги");
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
            await apiRequest(`/transactions/${id}`, {
                method: "DELETE"
            });
        }

        await loadTransactions();

    } catch (error) {
        console.error(error);
        alert("Не удалось удалить транзакции");
    }
}

async function bulkUpdateTransactions(dto) {
    await apiRequest("/transactions/bulk", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dto)
    });
}

/*
    =========================
    НАСТРОЙКИ
    =========================
*/

function openSettingsModal() {
    activeSettingsTab = "categories";

    settingsTabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === activeSettingsTab
        );
    });

    renderSettingsModal();

    settingsModal.hidden = false;
}

function closeSettingsModal() {
    settingsModal.hidden = true;
    settingsCreateInput.value = "";
    hideSettingsError();
}

function renderSettingsModal() {
    hideSettingsError();

    const items = getActiveSettingsItems();

    settingsList.innerHTML = "";

    if (activeSettingsTab === "tags") {
        settingsHint.hidden = false;
    } else {
        settingsHint.hidden = true;
    }

    settingsCreateInput.value = "";
    settingsCreateInput.maxLength =
        activeSettingsTab === "tags" ? 50 : 100;

    settingsCreateInput.placeholder =
        activeSettingsTab === "categories"
            ? "Новая категория"
            : activeSettingsTab === "tags"
                ? "Новый тег"
                : "Новая группа";

    if (items.length === 0) {
        settingsList.innerHTML = `
            <div class="settings-empty">
                Пока ничего нет
            </div>
        `;

        return;
    }

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "settings-item";
        row.dataset.id = item.id;

        const canEdit = activeSettingsTab !== "tags";

        row.innerHTML = `
            <span class="settings-item-name">
                ${escapeHtml(item.name)}
            </span>

            <div class="settings-item-actions">
                ${
                    canEdit
                        ? `
                            <button
                                type="button"
                                class="settings-icon-btn edit-reference-btn"
                                title="Изменить"
                            >
                                ✎
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="settings-icon-btn delete-reference-btn"
                    title="Удалить"
                >
                    🗑
                </button>
            </div>
        `;

        const editBtn = row.querySelector(".edit-reference-btn");
        const deleteBtn = row.querySelector(".delete-reference-btn");

        if (editBtn) {
            editBtn.addEventListener("click", () => {
                startReferenceEdit(row, item);
            });
        }

        deleteBtn.addEventListener("click", () => {
            deleteReferenceFromModal(item);
        });

        settingsList.appendChild(row);
    });
}

function getActiveSettingsItems() {
    if (activeSettingsTab === "categories") {
        return categories;
    }

    if (activeSettingsTab === "scopes") {
        return scopes;
    }

    return tags;
}

async function createReferenceFromModal(event) {
    event.preventDefault();

    const name = settingsCreateInput.value.trim();

    if (!name) {
        return;
    }

    try {
        await createReference(activeSettingsTab, name);
        settingsCreateInput.value = "";
        await refreshReferencesAfterSettingsChange();

    } catch (error) {
        console.error(error);
        showSettingsError(error.message || "Не удалось создать элемент");
    }
}

function startReferenceEdit(row, item) {
    row.innerHTML = `
        <input
            type="text"
            class="settings-edit-input"
            value="${escapeAttribute(item.name)}"
        >

        <div class="settings-item-actions">
            <button
                type="button"
                class="settings-icon-btn save-reference-btn"
                title="Сохранить"
            >
                ✓
            </button>

            <button
                type="button"
                class="settings-icon-btn cancel-reference-btn"
                title="Отмена"
            >
                ✕
            </button>
        </div>
    `;

    const input = row.querySelector(".settings-edit-input");
    const saveBtn = row.querySelector(".save-reference-btn");
    const cancelBtn = row.querySelector(".cancel-reference-btn");

    input.focus();

    saveBtn.addEventListener("click", async () => {
        const newName = input.value.trim();

        if (!newName) {
            return;
        }

        try {
            await updateReference(activeSettingsTab, item.id, newName);
            await refreshReferencesAfterSettingsChange();

        } catch (error) {
            console.error(error);
            showSettingsError(error.message || "Не удалось изменить элемент");
        }
    });

    cancelBtn.addEventListener("click", renderSettingsModal);
}

async function deleteReferenceFromModal(item) {
    const confirmed = confirm(`Удалить «${item.name}»?`);

    if (!confirmed) {
        return;
    }

    try {
        await deleteReference(activeSettingsTab, item.id);
        await refreshReferencesAfterSettingsChange();

    } catch (error) {
        console.error(error);
        showSettingsError(error.message || "Не удалось удалить элемент");
    }
}

async function refreshReferencesAfterSettingsChange() {
    await loadReferences();
    renderSettingsModal();
    applyFilters();
}

function showSettingsError(message) {
    settingsError.textContent = message;
    settingsError.hidden = false;
}

function hideSettingsError() {
    settingsError.textContent = "";
    settingsError.hidden = true;
}

/*
    =========================
    ДАТЫ
    =========================
*/

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

/*
    =========================
    УТИЛИТЫ
    =========================
*/

function formatMoney(value) {
    return value.toLocaleString("ru-RU", {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}