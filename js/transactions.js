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
const filterBtn = document.querySelector("#filtersBtn") || document.querySelector(".filter-btn");
const filterCounter = document.querySelector("#filterCounter");
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

const tagModal = document.querySelector("#tagModal");
const tagModalTitle = document.querySelector("#tagModalTitle");
const tagModalText = document.querySelector("#tagModalText");
const tagModalList = document.querySelector("#tagModalList");
const tagModalClose = document.querySelector("#tagModalClose");
const tagModalCancel = document.querySelector("#tagModalCancel");
const tagModalApply = document.querySelector("#tagModalApply");

const filtersModal = document.querySelector("#filtersModal");
const filtersCloseBtn = document.querySelector("#filtersCloseBtn");
const filtersApplyBtn = document.querySelector("#filtersApplyBtn");
const filtersResetBtn = document.querySelector("#filtersResetBtn");

const filterDateFrom = document.querySelector("#filterDateFrom");
const filterDateTo = document.querySelector("#filterDateTo");
const filterSearch = document.querySelector("#filterSearch");
const filterAmountMin = document.querySelector("#filterAmountMin");
const filterAmountMax = document.querySelector("#filterAmountMax");
const filterCategory = document.querySelector("#filterCategory");
const filterType = document.querySelector("#filterType");
const filterScope = document.querySelector("#filterScope");
const filterWithoutScope = document.querySelector("#filterWithoutScope");
const filterTagsList = document.querySelector("#filterTagsList");

const rowMenu = document.querySelector("#rowMenu");

const editTransactionModal = document.querySelector("#editTransactionModal");
const editTransactionForm = document.querySelector("#editTransactionForm");
const editTransactionClose = document.querySelector("#editTransactionClose");
const editTransactionCancel = document.querySelector("#editTransactionCancel");
const editTransactionSave = document.querySelector("#editTransactionSave");
const editTransactionError = document.querySelector("#editTransactionError");
const editKindButtons = document.querySelectorAll(".edit-kind-btn");
const editAmount = document.querySelector("#editAmount");
const editCurrency = document.querySelector("#editCurrency");
const editDate = document.querySelector("#editDate");
const editDescription = document.querySelector("#editDescription");
const editCategory = document.querySelector("#editCategory");
const editScope = document.querySelector("#editScope");
const editTagsList = document.querySelector("#editTagsList");
const editComment = document.querySelector("#editComment");

const messageModal = document.querySelector("#messageModal");
const messageModalTitle = document.querySelector("#messageModalTitle");
const messageModalText = document.querySelector("#messageModalText");
const messageModalClose = document.querySelector("#messageModalClose");
const messageModalOk = document.querySelector("#messageModalOk");
const messageModalCancel = document.querySelector("#messageModalCancel");

const inputModal = document.querySelector("#inputModal");
const inputModalForm = document.querySelector("#inputModalForm");
const inputModalTitle = document.querySelector("#inputModalTitle");
const inputModalText = document.querySelector("#inputModalText");
const inputModalField = document.querySelector("#inputModalField");
const inputModalClose = document.querySelector("#inputModalClose");
const inputModalCancel = document.querySelector("#inputModalCancel");

const dateModal = document.querySelector("#dateModal");
const dateModalForm = document.querySelector("#dateModalForm");
const dateModalClose = document.querySelector("#dateModalClose");
const dateModalCancel = document.querySelector("#dateModalCancel");
const dateModalReset = document.querySelector("#dateModalReset");
const dateFromInput = document.querySelector("#dateFromInput");
const dateToInput = document.querySelector("#dateToInput");

const actionsModal = document.querySelector("#actionsModal");
const actionsModalClose = document.querySelector("#actionsModalClose");
const actionsModalItems = document.querySelectorAll(".actions-modal-item");

let transactions = [];
let filteredTransactions = [];
let categories = [];
let scopes = [];
let tags = [];

let currentPage = 1;
let pageSize = 25;

let dateFrom = null;
let dateTo = null;

let amountMin = "";
let amountMax = "";
let selectedTagIds = [];
let excludeScopes = false;
let onlyWithScope = false;
let onlyWithTags = false;

let activeSettingsTab = "categories";
let currentSelectAction = null;
let currentTagAction = null;
let activeRowTransactionId = null;
let activeEditTransactionId = null;
let editTransactionKind = "expense";

let messageModalResolver = null;
let inputModalResolver = null;
let dateModalResolver = null;
let actionsModalResolver = null;
let tagModalResolver = null;

document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await loadReferences();
    applyFiltersFromUrl();
    await loadTransactions();
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
            errorText = errorData.error || errorData.title || errorText;
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

function applyFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const type = params.get("type");
    const hasScope = params.get("hasScope");
    const hasTags = params.get("hasTags");

    if (type) {
        typeFilter.value = type;
        filterType.value = type;
    }

    if (hasScope === "true") {
        onlyWithScope = true;
    }

    if (hasTags === "true") {
        onlyWithTags = true;
    }

    updateFilterCounter();
}

async function loadTransactions() {
    try {
        const data = await apiRequest(
            "/transactions?Page=1&PageSize=200"
        );

        transactions = data || [];

        transactions.sort((a, b) => {
            return new Date(b.dateUtc) - new Date(a.dateUtc);
        });

        applyFilters();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось загрузить транзакции"
        });
    }
}

async function loadReferences() {
    await Promise.all([
        loadCategories(),
        loadScopes(),
        loadTags()
    ]);

    renderAdvancedFiltersReferences();
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
    searchInput.addEventListener("input", () => {
        filterSearch.value = searchInput.value;
        applyFilters();
    });

    categoryFilter.addEventListener("change", () => {
        filterCategory.value = categoryFilter.value;
        applyFilters();
    });

    scopeFilter.addEventListener("change", () => {
        filterScope.value = scopeFilter.value;
        excludeScopes = false;
        filterWithoutScope.checked = false;
        applyFilters();
    });

    typeFilter.addEventListener("change", () => {
        filterType.value = typeFilter.value;
        applyFilters();
    });

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
        filterBtn.addEventListener("click", openFiltersModal);
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

    if (selectModal) {
        selectModal.addEventListener("click", event => {
            if (event.target === selectModal) {
                closeSelectModal();
            }
        });
    }

    if (filtersCloseBtn) {
        filtersCloseBtn.addEventListener("click", closeFiltersModal);
    }

    if (filtersModal) {
        filtersModal.addEventListener("click", event => {
            if (event.target === filtersModal) {
                closeFiltersModal();
            }
        });
    }

    if (filtersApplyBtn) {
        filtersApplyBtn.addEventListener("click", applyAdvancedFilters);
    }

    if (filtersResetBtn) {
        filtersResetBtn.addEventListener("click", resetFilters);
    }

    if (filterWithoutScope) {
        filterWithoutScope.addEventListener("change", () => {
            filterScope.disabled = filterWithoutScope.checked;
        });
    }

    document.addEventListener("click", handleDocumentClick);

    if (rowMenu) {
        rowMenu.addEventListener("click", handleRowMenuAction);
    }

    bindEditTransactionModal();
    bindAppModals();
    bindTagModal();
}

/*
    =========================
    МОДАЛКИ
    =========================
*/

function bindAppModals() {
    messageModalOk.addEventListener("click", () => {
        closeMessageModal(true);
    });

    messageModalCancel.addEventListener("click", () => {
        closeMessageModal(false);
    });

    messageModalClose.addEventListener("click", () => {
        closeMessageModal(false);
    });

    messageModal.addEventListener("click", event => {
        if (event.target === messageModal) {
            closeMessageModal(false);
        }
    });

    inputModalForm.addEventListener("submit", event => {
        event.preventDefault();
        closeInputModal(inputModalField.value);
    });

    inputModalCancel.addEventListener("click", () => {
        closeInputModal(null);
    });

    inputModalClose.addEventListener("click", () => {
        closeInputModal(null);
    });

    inputModal.addEventListener("click", event => {
        if (event.target === inputModal) {
            closeInputModal(null);
        }
    });

    dateModalForm.addEventListener("submit", event => {
        event.preventDefault();

        closeDateModal({
            mode: "apply",
            from: dateFromInput.value,
            to: dateToInput.value
        });
    });

    dateModalCancel.addEventListener("click", () => {
        closeDateModal(null);
    });

    dateModalClose.addEventListener("click", () => {
        closeDateModal(null);
    });

    dateModalReset.addEventListener("click", () => {
        closeDateModal({
            mode: "reset"
        });
    });

    dateModal.addEventListener("click", event => {
        if (event.target === dateModal) {
            closeDateModal(null);
        }
    });

    actionsModalClose.addEventListener("click", () => {
        closeActionsModal(null);
    });

    actionsModal.addEventListener("click", event => {
        if (event.target === actionsModal) {
            closeActionsModal(null);
        }
    });

    actionsModalItems.forEach(button => {
        button.addEventListener("click", () => {
            closeActionsModal(button.dataset.action);
        });
    });
}

function bindTagModal() {
    tagModalClose.addEventListener("click", () => {
        closeTagModal(null);
    });

    tagModalCancel.addEventListener("click", () => {
        closeTagModal(null);
    });

    tagModalApply.addEventListener("click", () => {
        const checked = tagModalList.querySelectorAll(
            ".tag-choice input:checked"
        );

        const selectedTagIds = Array.from(checked).map(
            checkbox => checkbox.value
        );

        closeTagModal(selectedTagIds);
    });

    tagModal.addEventListener("click", event => {
        if (event.target === tagModal) {
            closeTagModal(null);
        }
    });
}

function showMessage({ title = "Сообщение", message = "", confirm = false }) {
    messageModalTitle.textContent = title;
    messageModalText.textContent = message;

    messageModalCancel.hidden = !confirm;
    messageModalOk.textContent = confirm ? "Да" : "Хорошо";

    messageModal.hidden = false;

    return new Promise(resolve => {
        messageModalResolver = resolve;
    });
}

function closeMessageModal(value) {
    messageModal.hidden = true;

    if (messageModalResolver) {
        messageModalResolver(value);
        messageModalResolver = null;
    }
}

function showInputModal({ title = "Ввод данных", message = "", value = "", placeholder = "" }) {
    inputModalTitle.textContent = title;
    inputModalText.textContent = message;
    inputModalField.value = value;
    inputModalField.placeholder = placeholder;

    inputModal.hidden = false;

    setTimeout(() => {
        inputModalField.focus();
    }, 0);

    return new Promise(resolve => {
        inputModalResolver = resolve;
    });
}

function closeInputModal(value) {
    inputModal.hidden = true;

    if (inputModalResolver) {
        inputModalResolver(value);
        inputModalResolver = null;
    }
}

function showDateModal() {
    dateFromInput.value =
        dateFrom ? formatDateInputValue(dateFrom) : "";

    dateToInput.value =
        dateTo ? formatDateInputValue(dateTo) : "";

    dateModal.hidden = false;

    return new Promise(resolve => {
        dateModalResolver = resolve;
    });
}

function closeDateModal(value) {
    dateModal.hidden = true;

    if (dateModalResolver) {
        dateModalResolver(value);
        dateModalResolver = null;
    }
}

function showActionsModal() {
    actionsModal.hidden = false;

    return new Promise(resolve => {
        actionsModalResolver = resolve;
    });
}

function closeActionsModal(value) {
    actionsModal.hidden = true;

    if (actionsModalResolver) {
        actionsModalResolver(value);
        actionsModalResolver = null;
    }
}

function showTagModal({ title, text, action, checkedIds = [] }) {
    currentTagAction = action;

    tagModalTitle.textContent = title;
    tagModalText.textContent = text;

    tagModalList.innerHTML = "";

    if (tags.length === 0) {
        tagModalList.innerHTML = `
            <div class="tag-modal-empty">
                Пока нет тегов. Создайте тег в настройках.
            </div>
        `;
    } else {
        tags.forEach(tag => {
            const label = document.createElement("label");
            label.className = "tag-choice";

            label.innerHTML = `
                <input
                    type="checkbox"
                    value="${tag.id}"
                    ${checkedIds.includes(tag.id) ? "checked" : ""}
                >

                <span>
                    ${escapeHtml(tag.name)}
                </span>
            `;

            tagModalList.appendChild(label);
        });
    }

    tagModal.hidden = false;

    return new Promise(resolve => {
        tagModalResolver = resolve;
    });
}

function closeTagModal(value) {
    tagModal.hidden = true;
    currentTagAction = null;

    if (tagModalResolver) {
        tagModalResolver(value);
        tagModalResolver = null;
    }
}

/*
    =========================
    ФИЛЬТРЫ
    =========================
*/

function openFiltersModal() {
    filterDateFrom.value =
        dateFrom ? formatDateInputValue(dateFrom) : "";

    filterDateTo.value =
        dateTo ? formatDateInputValue(dateTo) : "";

    filterSearch.value = searchInput.value;
    filterAmountMin.value = amountMin;
    filterAmountMax.value = amountMax;
    filterCategory.value = categoryFilter.value;
    filterType.value = typeFilter.value;
    filterScope.value = scopeFilter.value;
    filterWithoutScope.checked = excludeScopes;
    filterScope.disabled = excludeScopes;

    renderFilterTags();

    filtersModal.hidden = false;
}

function closeFiltersModal() {
    filtersModal.hidden = true;
}

function applyAdvancedFilters() {
    searchInput.value = filterSearch.value.trim();
    categoryFilter.value = filterCategory.value;
    typeFilter.value = filterType.value;
    scopeFilter.value = filterScope.value;

    amountMin = filterAmountMin.value.trim();
    amountMax = filterAmountMax.value.trim();

    excludeScopes = filterWithoutScope.checked;

    selectedTagIds =
        Array.from(
            filterTagsList.querySelectorAll("input:checked")
        ).map(input => input.value);

    if (filterDateFrom.value) {
        dateFrom = new Date(filterDateFrom.value);
    } else {
        dateFrom = null;
    }

    if (filterDateTo.value) {
        dateTo = new Date(filterDateTo.value);
        dateTo.setHours(23, 59, 59, 999);
    } else {
        dateTo = null;
    }

    updateDateFilterText();
    updateFilterCounter();

    closeFiltersModal();
    applyFilters();
}

function applyFilters() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedScope = scopeFilter.value;
    const selectedType = typeFilter.value;

    const minAmount = parseAmount(amountMin);
    const maxAmount = parseAmount(amountMax);

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

        let matchesScope =
            excludeScopes
                ? !transaction.scope
                : !selectedScope ||
                  transaction.scope?.id === selectedScope;

        if (onlyWithScope) {
            matchesScope =
                matchesScope &&
                Boolean(transaction.scope);
        }

        const matchesType =
            !selectedType ||
            transaction.type === selectedType;

        const transactionDate = new Date(transaction.dateUtc);

        const matchesDateFrom =
            !dateFrom || transactionDate >= dateFrom;

        const matchesDateTo =
            !dateTo || transactionDate <= dateTo;

        const absoluteAmount =
            Math.abs(Number(transaction.amount));

        const matchesMinAmount =
            minAmount === null || absoluteAmount >= minAmount;

        const matchesMaxAmount =
            maxAmount === null || absoluteAmount <= maxAmount;

        const transactionTagIds =
            transaction.tags?.map(tag => tag.id) || [];

        let matchesTags =
            selectedTagIds.length === 0 ||
            selectedTagIds.every(tagId =>
                transactionTagIds.includes(tagId)
            );

        if (onlyWithTags) {
            matchesTags =
                matchesTags &&
                transactionTagIds.length > 0;
        }

        return (
            matchesSearch &&
            matchesCategory &&
            matchesScope &&
            matchesType &&
            matchesDateFrom &&
            matchesDateTo &&
            matchesMinAmount &&
            matchesMaxAmount &&
            matchesTags
        );
    });

    currentPage = 1;

    updateFilterCounter();
    renderTable();
}

function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "";
    scopeFilter.value = "";
    typeFilter.value = "";

    filterSearch.value = "";
    filterCategory.value = "";
    filterType.value = "";
    filterScope.value = "";
    filterAmountMin.value = "";
    filterAmountMax.value = "";
    filterDateFrom.value = "";
    filterDateTo.value = "";
    filterWithoutScope.checked = false;
    filterScope.disabled = false;

    dateFrom = null;
    dateTo = null;
    amountMin = "";
    amountMax = "";
    selectedTagIds = [];
    excludeScopes = false;
    onlyWithScope = false;
    onlyWithTags = false;

    renderFilterTags();
    updateDateFilterText();
    updateFilterCounter();

    closeFiltersModal();
    applyFilters();
}

function updateDateFilterText() {
    const span = dateFilterBtn?.querySelector("span");

    if (!span) {
        return;
    }

    if (!dateFrom && !dateTo) {
        span.textContent = "Все даты";
        return;
    }

    if (dateFrom && dateTo) {
        span.textContent =
            `${formatShortDate(dateFrom)} – ${formatShortDate(dateTo)}`;
        return;
    }

    if (dateFrom) {
        span.textContent =
            `С ${formatShortDate(dateFrom)}`;
        return;
    }

    span.textContent =
        `До ${formatShortDate(dateTo)}`;
}

function countActiveFilters() {
    let count = 0;

    if (dateFrom || dateTo) count++;
    if (searchInput.value.trim()) count++;
    if (categoryFilter.value) count++;
    if (typeFilter.value) count++;
    if (scopeFilter.value) count++;
    if (amountMin.trim() || amountMax.trim()) count++;
    if (selectedTagIds.length > 0) count++;
    if (excludeScopes) count++;
    if (onlyWithScope) count++;
    if (onlyWithTags) count++;

    return count;
}

function updateFilterCounter() {
    const count = countActiveFilters();

    if (!filterCounter || !filterBtn) {
        return;
    }

    if (count === 0) {
        filterCounter.hidden = true;
        filterCounter.textContent = "0";
        filterBtn.classList.remove("active");
        return;
    }

    filterCounter.hidden = false;
    filterCounter.textContent = count;
    filterBtn.classList.add("active");
}

function renderAdvancedFiltersReferences() {
    renderFilterSelect(filterCategory, categories, "Все категории");
    renderFilterSelect(filterScope, scopes, "Все группы");
    renderFilterTags();
}

function renderFilterSelect(select, items, defaultText) {
    if (!select) {
        return;
    }

    const currentValue = select.value;

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultText;
    select.appendChild(defaultOption);

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });

    select.value = currentValue;
}

function renderFilterTags() {
    if (!filterTagsList) {
        return;
    }

    filterTagsList.innerHTML = "";

    if (tags.length === 0) {
        filterTagsList.innerHTML = `
            <span class="filters-empty">
                Теги пока не созданы
            </span>
        `;

        return;
    }

    tags.forEach(tag => {
        const label = document.createElement("label");
        label.className = "filters-tag-option";

        label.innerHTML = `
            <input
                type="checkbox"
                value="${tag.id}"
                ${selectedTagIds.includes(tag.id) ? "checked" : ""}
            >

            <span>
                ${escapeHtml(tag.name)}
            </span>
        `;

        filterTagsList.appendChild(label);
    });
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
    closeRowMenu();

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="loading-row">
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

                <td class="row-actions-col">
                    <button
                        type="button"
                        class="row-menu-btn"
                        data-row-menu-id="${transaction.id}"
                        aria-label="Действия с транзакцией"
                    >
                        ⋮
                    </button>
                </td>
            </tr>
        `;

        tableBody.innerHTML += row;
    });

    const checkboxes = document.querySelectorAll(".transaction-checkbox");

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateSelectedCount);
    });

    const rowButtons = document.querySelectorAll(".row-menu-btn");

    rowButtons.forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            toggleRowMenu(button.dataset.rowMenuId, button);
        });
    });

    updatePagination();
}

/*
    =========================
    ТРИ ТОЧКИ В СТРОКЕ
    =========================
*/

function toggleRowMenu(transactionId, button) {
    if (!rowMenu) {
        return;
    }

    if (
        activeRowTransactionId === transactionId &&
        !rowMenu.hidden
    ) {
        closeRowMenu();
        return;
    }

    activeRowTransactionId = transactionId;

    document.querySelectorAll(".row-menu-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");

    const rect = button.getBoundingClientRect();

    rowMenu.style.top = `${rect.bottom + 6}px`;
    rowMenu.style.left = `${Math.max(8, rect.right - 230)}px`;

    const transaction =
        transactions.find(item => item.id === transactionId);

    updateRowMenuDisabledState(transaction);

    rowMenu.hidden = false;
}

function closeRowMenu() {
    if (rowMenu) {
        rowMenu.hidden = true;
    }

    activeRowTransactionId = null;

    document.querySelectorAll(".row-menu-btn").forEach(btn => {
        btn.classList.remove("active");
    });
}

function handleDocumentClick(event) {
    if (!rowMenu) {
        return;
    }

    if (
        rowMenu.contains(event.target) ||
        event.target.classList.contains("row-menu-btn")
    ) {
        return;
    }

    closeRowMenu();
}

function updateRowMenuDisabledState(transaction) {
    if (!rowMenu || !transaction) {
        return;
    }

    const scopeBtn =
        rowMenu.querySelector('[data-row-action="scope"]');

    const removeScopeBtn =
        rowMenu.querySelector('[data-row-action="remove-scope"]');

    const addTagsBtn =
        rowMenu.querySelector('[data-row-action="add-tags"]');

    const replaceTagsBtn =
        rowMenu.querySelector('[data-row-action="replace-tags"]');

    const clearTagsBtn =
        rowMenu.querySelector('[data-row-action="clear-tags"]');

    if (scopeBtn) {
        scopeBtn.disabled = scopes.length === 0;
    }

    if (removeScopeBtn) {
        removeScopeBtn.disabled = !transaction.scope;
    }

    if (addTagsBtn) {
        addTagsBtn.disabled = tags.length === 0;
    }

    if (replaceTagsBtn) {
        replaceTagsBtn.disabled = tags.length === 0;
    }

    if (clearTagsBtn) {
        clearTagsBtn.disabled =
            !transaction.tags || transaction.tags.length === 0;
    }
}

async function handleRowMenuAction(event) {
    const button = event.target.closest(".row-menu-item");

    if (!button || button.disabled || !activeRowTransactionId) {
        return;
    }

    const action = button.dataset.rowAction;
    const transactionId = activeRowTransactionId;

    closeRowMenu();

    if (action === "edit") {
        openEditTransactionModal(transactionId);
        return;
    }

    if (action === "delete") {
        await deleteSingleTransaction(transactionId);
    }

    if (action === "category") {
        await changeCategoryForIds([transactionId]);
    }

    if (action === "scope") {
        await addScopeForIds([transactionId]);
    }

    if (action === "remove-scope") {
        await removeScopeForIds([transactionId]);
    }

    if (action === "comment") {
        await setCommentForIds([transactionId]);
    }

    if (action === "clear-comment") {
        await clearCommentForIds([transactionId]);
    }

    if (action === "add-tags") {
        await addTagsForIds([transactionId]);
    }

    if (action === "replace-tags") {
        await replaceTagsForIds([transactionId]);
    }

    if (action === "clear-tags") {
        await clearTagsForIds([transactionId]);
    }
}


/*
    =========================
    РЕДАКТИРОВАНИЕ ТРАНЗАКЦИИ
    =========================
*/

function bindEditTransactionModal() {
    if (!editTransactionModal) {
        return;
    }

    editTransactionClose.addEventListener("click", closeEditTransactionModal);
    editTransactionCancel.addEventListener("click", closeEditTransactionModal);

    editTransactionModal.addEventListener("click", event => {
        if (event.target === editTransactionModal) {
            closeEditTransactionModal();
        }
    });

    editKindButtons.forEach(button => {
        button.addEventListener("click", () => {
            setEditTransactionKind(button.dataset.editKind);
        });
    });

    editTransactionForm.addEventListener("submit", saveEditedTransaction);
}

function openEditTransactionModal(transactionId) {
    const transaction =
        transactions.find(item => item.id === transactionId);

    if (!transaction) {
        return;
    }

    activeEditTransactionId = transactionId;

    setEditTransactionKind(
        Number(transaction.amount) >= 0
            ? "income"
            : "expense"
    );

    editAmount.value = String(
        Math.abs(Number(transaction.amount))
    );

    editCurrency.value = transaction.currency || "RUB";
    editDate.value = formatDateInputValue(new Date(transaction.dateUtc));
    editDescription.value = transaction.description || "";
    editComment.value = transaction.comment || "";

    renderEditCategoryOptions(transaction.category?.id || "");
    renderEditScopeOptions(transaction.scope?.id || "");
    renderEditTags(transaction.tags?.map(tag => tag.id) || []);

    hideEditTransactionError();
    editTransactionModal.hidden = false;
}

function closeEditTransactionModal() {
    if (!editTransactionModal) {
        return;
    }

    editTransactionModal.hidden = true;
    activeEditTransactionId = null;
    hideEditTransactionError();
}

function setEditTransactionKind(kind) {
    editTransactionKind =
        kind === "income"
            ? "income"
            : "expense";

    editKindButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.editKind === editTransactionKind
        );
    });
}

function renderEditCategoryOptions(selectedId) {
    editCategory.innerHTML = `
        <option value="">Выберите категорию</option>
    `;

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        editCategory.appendChild(option);
    });

    editCategory.value = selectedId;
}

function renderEditScopeOptions(selectedId) {
    editScope.innerHTML = `
        <option value="">Без группы</option>
    `;

    scopes.forEach(scope => {
        const option = document.createElement("option");
        option.value = scope.id;
        option.textContent = scope.name;
        editScope.appendChild(option);
    });

    editScope.value = selectedId;
}

function renderEditTags(selectedIds) {
    editTagsList.innerHTML = "";

    if (tags.length === 0) {
        editTagsList.innerHTML = `
            <span class="edit-tags-empty">
                Теги пока не созданы
            </span>
        `;

        return;
    }

    tags.forEach(tag => {
        const label = document.createElement("label");
        label.className = "edit-tag-option";

        label.innerHTML = `
            <input
                type="checkbox"
                value="${tag.id}"
                ${selectedIds.includes(tag.id) ? "checked" : ""}
            >

            <span>
                ${escapeHtml(tag.name)}
            </span>
        `;

        editTagsList.appendChild(label);
    });
}

async function saveEditedTransaction(event) {
    event.preventDefault();
    hideEditTransactionError();

    if (!activeEditTransactionId) {
        return;
    }

    const transaction =
        transactions.find(item => item.id === activeEditTransactionId);

    if (!transaction) {
        return;
    }

    const parsedAmount = parseAmount(editAmount.value);

    if (!parsedAmount || parsedAmount <= 0) {
        showEditTransactionError("Укажите сумму больше нуля");
        return;
    }

    if (!editDate.value) {
        showEditTransactionError("Укажите дату");
        return;
    }

    if (!editCategory.value) {
        showEditTransactionError("Выберите категорию");
        return;
    }

    const selectedEditTagIds =
        Array.from(
            editTagsList.querySelectorAll("input:checked")
        ).map(input => input.value);

    const newAmount =
        editTransactionKind === "expense"
            ? -parsedAmount
            : parsedAmount;

    const oldAmount =
        Number(transaction.amount);

    const typeChanged =
        oldAmount >= 0 !== newAmount >= 0;

    const payload = {
        amount: newAmount,
        currency: editCurrency.value,
        dateUtc: dateInputToUtcIso(editDate.value),
        description: editDescription.value.trim(),
        comment: editComment.value.trim(),
        categoryId: editCategory.value
    };

    if (editScope.value) {
        payload.scopeId = editScope.value;
    } else if (transaction.scope) {
        payload.deleteScope = true;
    }

    if (selectedEditTagIds.length > 0) {
        payload.tagIds = selectedEditTagIds;
    }

    editTransactionSave.disabled = true;
    editTransactionSave.textContent = "Сохранение...";

    try {
        try {
            await updateTransaction(activeEditTransactionId, payload);

            if (
                selectedEditTagIds.length === 0 &&
                transaction.tags &&
                transaction.tags.length > 0
            ) {
                await bulkUpdateTransactions({
                    transactionIds: [activeEditTransactionId],
                    replaceTagIds: []
                });
            }

        } catch (putError) {
            if (!typeChanged) {
                throw putError;
            }

            const createPayload = {
                amount: payload.amount,
                currency: payload.currency,
                dateUtc: payload.dateUtc,
                description: payload.description || null,
                comment: payload.comment || null,
                categoryId: payload.categoryId,
                tagIds: selectedEditTagIds
            };

            if (editScope.value) {
                createPayload.scopeId = editScope.value;
            }

            await createTransaction(createPayload);

            await apiRequest(`/transactions/${activeEditTransactionId}`, {
                method: "DELETE"
            });
        }

        closeEditTransactionModal();
        await loadTransactions();

    } catch (error) {
        console.error(error);

        showEditTransactionError(
            error.message || "Не удалось сохранить транзакцию"
        );

    } finally {
        editTransactionSave.disabled = false;
        editTransactionSave.textContent = "Сохранить";
    }
}

function showEditTransactionError(message) {
    editTransactionError.textContent = message;
    editTransactionError.hidden = false;
}

function hideEditTransactionError() {
    editTransactionError.textContent = "";
    editTransactionError.hidden = true;
}

function dateInputToUtcIso(value) {
    return `${value}T12:00:00Z`;
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

async function changePageSize() {
    const value = await showInputModal({
        title: "Количество строк",
        message: "Сколько транзакций показывать на странице?",
        value: String(pageSize),
        placeholder: "Например: 10, 25, 50"
    });

    if (value === null) {
        return;
    }

    const number = Number(value);

    if (!number || number <= 0) {
        await showMessage({
            title: "Ошибка",
            message: "Введите нормальное число"
        });

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

async function openCategorySelect() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        await showMessage({
            title: "Ничего не выбрано",
            message: "Выберите хотя бы одну транзакцию"
        });

        return;
    }

    await changeCategoryForIds(selectedIds);
}

async function openScopeSelect() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        await showMessage({
            title: "Ничего не выбрано",
            message: "Выберите хотя бы одну транзакцию"
        });

        return;
    }

    await addScopeForIds(selectedIds);
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

    if (!selectedValue) {
        await showMessage({
            title: "Значение не выбрано",
            message: "Выберите значение из списка"
        });

        return;
    }

    try {
        if (currentSelectAction === "category") {
            await bulkUpdateTransactions({
                transactionIds: selectedIds,
                categoryId: selectedValue
            });

            categoryFilter.value = "";
            filterCategory.value = "";
        }

        if (currentSelectAction === "scope") {
            await bulkUpdateTransactions({
                transactionIds: selectedIds,
                scopeId: selectedValue
            });

            scopeFilter.value = "";
            filterScope.value = "";
        }

        closeSelectModal();
        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось применить изменение"
        });
    }
}

async function openMoreActions() {
    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
        await showMessage({
            title: "Ничего не выбрано",
            message: "Выберите хотя бы одну транзакцию"
        });

        return;
    }

    const action = await showActionsModal();

    if (action === "remove-scope") {
        await removeScopeForIds(selectedIds);
    }

    if (action === "comment") {
        await setCommentForIds(selectedIds);
    }

    if (action === "clear-comment") {
        await clearCommentForIds(selectedIds);
    }

    if (action === "add-tags") {
        await addTagsForIds(selectedIds);
    }

    if (action === "replace-tags") {
        await replaceTagsForIds(selectedIds);
    }

    if (action === "clear-tags") {
        await clearTagsForIds(selectedIds);
    }
}

async function changeCategoryForIds(ids) {
    if (categories.length === 0) {
        await showMessage({
            title: "Нет категорий",
            message: "Категории не загружены"
        });

        return;
    }

    const categoryId = await chooseReference({
        title: "Изменить категорию",
        items: categories,
        placeholder: "Выберите категорию"
    });

    if (!categoryId) {
        return;
    }

    try {
        if (ids.length === 1) {
            await updateTransaction(ids[0], {
                categoryId
            });
        } else {
            await bulkUpdateTransactions({
                transactionIds: ids,
                categoryId
            });
        }

        categoryFilter.value = "";
        filterCategory.value = "";

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось изменить категорию"
        });
    }
}

async function addScopeForIds(ids) {
    if (scopes.length === 0) {
        await showMessage({
            title: "Нет групп",
            message: "Сначала создайте группу в настройках"
        });

        return;
    }

    const scopeId = await chooseReference({
        title: "Добавить в группу",
        items: scopes,
        placeholder: "Выберите группу"
    });

    if (!scopeId) {
        return;
    }

    try {
        if (ids.length === 1) {
            await updateTransaction(ids[0], {
                scopeId
            });
        } else {
            await bulkUpdateTransactions({
                transactionIds: ids,
                scopeId
            });
        }

        scopeFilter.value = "";
        filterScope.value = "";

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось назначить группу"
        });
    }
}

function chooseReference({ title, items, placeholder }) {
    return new Promise(resolve => {
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

        const apply = () => {
            cleanup();
            selectModal.hidden = true;
            resolve(selectModalSelect.value);
        };

        const cancel = () => {
            cleanup();
            selectModal.hidden = true;
            resolve(null);
        };

        const cleanup = () => {
            selectApplyBtn.removeEventListener("click", apply);
            selectCancelBtn.removeEventListener("click", cancel);
            selectCloseBtn.removeEventListener("click", cancel);
        };

        selectApplyBtn.addEventListener("click", apply);
        selectCancelBtn.addEventListener("click", cancel);
        selectCloseBtn.addEventListener("click", cancel);
    });
}

async function addTagsForIds(ids) {
    if (tags.length === 0) {
        await showMessage({
            title: "Нет тегов",
            message: "Сначала создайте хотя бы один тег в настройках"
        });

        return;
    }

    const tagIds = await showTagModal({
        title: "Добавить теги",
        text: "Выберите теги, которые нужно добавить к выбранным транзакциям.",
        action: "add"
    });

    if (tagIds === null) {
        return;
    }

    if (tagIds.length === 0) {
        await showMessage({
            title: "Теги не выбраны",
            message: "Выберите хотя бы один тег"
        });

        return;
    }

    try {
        await bulkUpdateTransactions({
            transactionIds: ids,
            addTagIds: tagIds
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось добавить теги"
        });
    }
}

async function replaceTagsForIds(ids) {
    if (tags.length === 0) {
        await showMessage({
            title: "Нет тегов",
            message: "Сначала создайте хотя бы один тег в настройках"
        });

        return;
    }

    const tagIds = await showTagModal({
        title: "Заменить теги",
        text: "Выберите теги, которые должны остаться у выбранных транзакций.",
        action: "replace"
    });

    if (tagIds === null) {
        return;
    }

    try {
        await bulkUpdateTransactions({
            transactionIds: ids,
            replaceTagIds: tagIds
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось заменить теги"
        });
    }
}

async function removeScopeForIds(ids) {
    const confirmed = await showMessage({
        title: "Убрать из группы?",
        message: `Убрать из группы выбранные транзакции (${ids.length})?`,
        confirm: true
    });

    if (!confirmed) {
        return;
    }

    try {
        if (ids.length === 1) {
            await updateTransaction(ids[0], {
                deleteScope: true
            });
        } else {
            await bulkUpdateTransactions({
                transactionIds: ids,
                deleteScope: true
            });
        }

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось убрать группу"
        });
    }
}

async function setCommentForIds(ids) {
    const comment = await showInputModal({
        title: "Комментарий",
        message: "Введите комментарий для выбранных транзакций",
        placeholder: "Комментарий"
    });

    if (comment === null) {
        return;
    }

    try {
        if (ids.length === 1) {
            await updateTransaction(ids[0], {
                comment
            });
        } else {
            await bulkUpdateTransactions({
                transactionIds: ids,
                comment
            });
        }

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось задать комментарий"
        });
    }
}

async function clearCommentForIds(ids) {
    const confirmed = await showMessage({
        title: "Очистить комментарий?",
        message: `Очистить комментарий у выбранных транзакций (${ids.length})?`,
        confirm: true
    });

    if (!confirmed) {
        return;
    }

    try {
        if (ids.length === 1) {
            await updateTransaction(ids[0], {
                comment: ""
            });
        } else {
            await bulkUpdateTransactions({
                transactionIds: ids,
                comment: ""
            });
        }

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось очистить комментарий"
        });
    }
}

async function clearTagsForIds(ids) {
    const confirmed = await showMessage({
        title: "Очистить теги?",
        message: `Очистить теги у выбранных транзакций (${ids.length})?`,
        confirm: true
    });

    if (!confirmed) {
        return;
    }

    try {
        await bulkUpdateTransactions({
            transactionIds: ids,
            replaceTagIds: []
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось очистить теги"
        });
    }
}

async function deleteSingleTransaction(id) {
    const confirmed = await showMessage({
        title: "Удалить транзакцию?",
        message: "Удалить эту транзакцию?",
        confirm: true
    });

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/transactions/${id}`, {
            method: "DELETE"
        });

        await loadTransactions();

    } catch (error) {
        console.error(error);

        await showMessage({
            title: "Ошибка",
            message: "Не удалось удалить транзакцию"
        });
    }
}

async function deleteTransactions() {
    const ids = getSelectedIds();

    if (ids.length === 0) {
        await showMessage({
            title: "Ничего не выбрано",
            message: "Выберите хотя бы одну транзакцию"
        });

        return;
    }

    const confirmed = await showMessage({
        title: "Удалить транзакции?",
        message: `Удалить выбранные транзакции (${ids.length})?`,
        confirm: true
    });

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

        await showMessage({
            title: "Ошибка",
            message: "Не удалось удалить транзакции"
        });
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

async function createTransaction(dto) {
    return apiRequest("/transactions", {
        method: "POST",
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
    if (activeSettingsTab === "categories") {
        const usedByTransactions =
            transactions.some(transaction =>
                transaction.category?.id === item.id
            );

        if (usedByTransactions) {
            await showMessage({
                title: "Категорию нельзя удалить",
                message: "Эта категория используется в транзакциях. Сначала измените категорию у этих транзакций, а потом удалите категорию."
            });

            return;
        }
    }

    if (activeSettingsTab === "scopes") {
        const usedByTransactions =
            transactions.some(transaction =>
                transaction.scope?.id === item.id
            );

        if (usedByTransactions) {
            await showMessage({
                title: "Группу нельзя удалить",
                message: "Эта группа используется в транзакциях. Сначала уберите транзакции из группы, а потом удалите группу."
            });

            return;
        }
    }

    const confirmed = await showMessage({
        title: "Удалить элемент?",
        message: `Удалить «${item.name}»?`,
        confirm: true
    });

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

async function changeDatePeriod() {
    const result = await showDateModal();

    if (!result) {
        return;
    }

    if (result.mode === "reset") {
        dateFrom = null;
        dateTo = null;

        filterDateFrom.value = "";
        filterDateTo.value = "";

        updateDateFilterText();
        updateFilterCounter();

        applyFilters();
        return;
    }

    if (!result.from || !result.to) {
        await showMessage({
            title: "Ошибка",
            message: "Выберите обе даты"
        });

        return;
    }

    const from = new Date(result.from);
    const to = new Date(result.to);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        await showMessage({
            title: "Ошибка",
            message: "Неверный формат даты"
        });

        return;
    }

    to.setHours(23, 59, 59, 999);

    dateFrom = from;
    dateTo = to;

    filterDateFrom.value = result.from;
    filterDateTo.value = result.to;

    updateDateFilterText();
    updateFilterCounter();

    applyFilters();
}

/*
    =========================
    УТИЛИТЫ
    =========================
*/

function parseAmount(value) {
    if (!value || !String(value).trim()) {
        return null;
    }

    const number =
        Number(
            String(value)
                .replace(",", ".")
                .replace(/\s/g, "")
        );

    if (Number.isNaN(number)) {
        return null;
    }

    return Math.abs(number);
}

function formatMoney(value) {
    return value.toLocaleString("ru-RU", {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    });
}

function formatDateInputValue(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatShortDate(date) {
    return date.toLocaleDateString("ru-RU");
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