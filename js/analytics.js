const API_BASE_URL = "/api";

let analyticsState = {
    categories: [],
    scopes: [],
    tags: [],
    grouping: "month",
    filters: {
        dateFrom: "",
        dateTo: "",
        amountMin: "",
        amountMax: "",
        search: "",
        categoryId: "",
        type: "",
        scopeId: "",
        withoutScope: false,
        tagIds: []
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    initAnalyticsEvents();
    await loadAnalyticsDictionaries();
    await loadAnalyticsData();
});

function initAnalyticsEvents() {
    document.getElementById("analyticsApplyBtn")?.addEventListener("click", async () => {
        readQuickFiltersFromPage();
        syncFilterModalFromState();
        updateDateText();
        updateActiveFiltersCounter();
        await loadAnalyticsData();
    });

    document.getElementById("analyticsResetBtn")?.addEventListener("click", async () => {
        resetAnalyticsFilters();
        await loadAnalyticsData();
    });

    document.getElementById("analyticsDateBtn")?.addEventListener("click", openDateModal);
    document.getElementById("analyticsDateClose")?.addEventListener("click", closeDateModal);
    document.getElementById("analyticsDateCancel")?.addEventListener("click", closeDateModal);

    document.getElementById("analyticsDateReset")?.addEventListener("click", async () => {
        analyticsState.filters.dateFrom = "";
        analyticsState.filters.dateTo = "";

        document.getElementById("analyticsDateFromInput").value = "";
        document.getElementById("analyticsDateToInput").value = "";

        updateDateText();
        syncFilterModalFromState();
        updateActiveFiltersCounter();
        closeDateModal();
        await loadAnalyticsData();
    });

    document.getElementById("analyticsDateForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();

        analyticsState.filters.dateFrom = document.getElementById("analyticsDateFromInput").value;
        analyticsState.filters.dateTo = document.getElementById("analyticsDateToInput").value;

        updateDateText();
        syncFilterModalFromState();
        updateActiveFiltersCounter();
        closeDateModal();
        await loadAnalyticsData();
    });

    document.getElementById("analyticsFiltersBtn")?.addEventListener("click", openFiltersModal);
    document.getElementById("analyticsFiltersClose")?.addEventListener("click", closeFiltersModal);

    document.getElementById("analyticsFiltersReset")?.addEventListener("click", async () => {
        resetAnalyticsFilters();
        closeFiltersModal();
        await loadAnalyticsData();
    });

    document.getElementById("analyticsFiltersApply")?.addEventListener("click", async () => {
        readModalFiltersFromPage();
        syncQuickFiltersFromState();
        updateDateText();
        updateActiveFiltersCounter();
        closeFiltersModal();
        await loadAnalyticsData();
    });

    document.querySelectorAll(".period-tabs button").forEach((button) => {
        button.addEventListener("click", async () => {
            document.querySelectorAll(".period-tabs button").forEach((item) => {
                item.classList.remove("active");
            });

            button.classList.add("active");
            analyticsState.grouping = button.dataset.grouping || "month";

            await loadAnalyticsData();
        });
    });

    document.getElementById("openExpenseCategoriesBtn")?.addEventListener("click", () => {
        window.location.href = "transactions.html?type=Expense";
    });

    document.getElementById("openGroupedExpensesBtn")?.addEventListener("click", () => {
        window.location.href = "transactions.html?hasScope=true";
    });

    document.getElementById("openTaggedExpensesBtn")?.addEventListener("click", () => {
        window.location.href = "transactions.html?hasTags=true";
    });

    document.getElementById("openAllExpensesBtn")?.addEventListener("click", () => {
        window.location.href = "transactions.html?type=Expense";
    });

    document.querySelectorAll(".analytics-modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                overlay.hidden = true;
            }
        });
    });
}

async function loadAnalyticsDictionaries() {
    try {
        const [categoriesResponse, scopesResponse, tagsResponse] = await Promise.all([
            fetchJson(`${API_BASE_URL}/categories`),
            fetchJson(`${API_BASE_URL}/scopes`),
            fetchJson(`${API_BASE_URL}/tags`)
        ]);

        analyticsState.categories = normalizeArrayResponse(categoriesResponse);
        analyticsState.scopes = normalizeArrayResponse(scopesResponse);
        analyticsState.tags = normalizeArrayResponse(tagsResponse);

        fillSelect("analyticsCategoryFilter", analyticsState.categories, "Все категории");
        fillSelect("analyticsScopeFilter", analyticsState.scopes, "Все группы");

        fillSelect("analyticsFilterCategory", analyticsState.categories, "Все категории");
        fillSelect("analyticsFilterScope", analyticsState.scopes, "Все группы");

        renderFilterTags();
    } catch (error) {
        console.error("Ошибка загрузки справочников аналитики:", error);
    }
}

async function loadAnalyticsData() {
    try {
        setAnalyticsLoading();

        const query = buildAnalyticsQuery();

        const expenseQuery = buildAnalyticsQuery({
            forcedType: "Expense"
        });

        const [summaryResponse, categoryResponse, scopeResponse, tagResponse, timeResponse] = await Promise.all([
            fetchJson(`${API_BASE_URL}/analytics/summary${query}`),
            fetchJson(`${API_BASE_URL}/analytics/by-category${expenseQuery}`),
            fetchJson(`${API_BASE_URL}/analytics/by-scope${expenseQuery}`),
            fetchJson(`${API_BASE_URL}/analytics/by-tag${expenseQuery}`),
            fetchJson(`${API_BASE_URL}/analytics/by-time${query}&grouping=${encodeURIComponent(analyticsState.grouping)}`)
        ]);

        const summary = unwrapData(summaryResponse);
        const categories = normalizeArrayResponse(categoryResponse);
        const scopes = normalizeArrayResponse(scopeResponse);
        const tags = normalizeArrayResponse(tagResponse);
        const time = normalizeArrayResponse(timeResponse);

        renderSummary(summary);
        renderCategoryAnalytics(categories);
        renderScopeAnalytics(scopes);
        renderTagAnalytics(tags);
        renderTimeAnalytics(time);
    } catch (error) {
        console.error("Ошибка загрузки аналитики:", error);
        renderNoDataState();
    }
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Ошибка запроса ${response.status}: ${url}`);
    }

    return await response.json();
}

function buildAnalyticsQuery(options = {}) {
    const params = new URLSearchParams();

    if (analyticsState.filters.dateFrom) {
        params.append("DateFrom", toApiDate(analyticsState.filters.dateFrom));
    }

    if (analyticsState.filters.dateTo) {
        params.append("DateTo", toApiDate(analyticsState.filters.dateTo));
    }

    if (analyticsState.filters.amountMin) {
        params.append("AmountMin", normalizeDecimal(analyticsState.filters.amountMin));
    }

    if (analyticsState.filters.amountMax) {
        params.append("AmountMax", normalizeDecimal(analyticsState.filters.amountMax));
    }

    if (analyticsState.filters.categoryId) {
        params.append("CategoryId", analyticsState.filters.categoryId);
    }

    if (options.forcedType) {
        params.append("Type", options.forcedType);
    } else if (analyticsState.filters.type) {
        params.append("Type", analyticsState.filters.type);
    }

    if (analyticsState.filters.scopeId) {
        params.append("ScopeId", analyticsState.filters.scopeId);
    }

    analyticsState.filters.tagIds.forEach((tagId) => {
        params.append("TagIds", tagId);
    });

    const queryString = params.toString();

    return queryString ? `?${queryString}` : "?";
}

function readQuickFiltersFromPage() {
    analyticsState.filters.search = document.getElementById("analyticsSearchInput")?.value.trim() || "";
    analyticsState.filters.categoryId = document.getElementById("analyticsCategoryFilter")?.value || "";
    analyticsState.filters.type = document.getElementById("analyticsTypeFilter")?.value || "";
    analyticsState.filters.scopeId = document.getElementById("analyticsScopeFilter")?.value || "";
}

function readModalFiltersFromPage() {
    analyticsState.filters.dateFrom = document.getElementById("analyticsFilterDateFrom")?.value || "";
    analyticsState.filters.dateTo = document.getElementById("analyticsFilterDateTo")?.value || "";
    analyticsState.filters.search = document.getElementById("analyticsFilterSearch")?.value.trim() || "";
    analyticsState.filters.amountMin = document.getElementById("analyticsFilterAmountMin")?.value.trim() || "";
    analyticsState.filters.amountMax = document.getElementById("analyticsFilterAmountMax")?.value.trim() || "";
    analyticsState.filters.categoryId = document.getElementById("analyticsFilterCategory")?.value || "";
    analyticsState.filters.type = document.getElementById("analyticsFilterType")?.value || "";
    analyticsState.filters.scopeId = document.getElementById("analyticsFilterScope")?.value || "";
    analyticsState.filters.withoutScope = Boolean(document.getElementById("analyticsFilterWithoutScope")?.checked);

    analyticsState.filters.tagIds = Array.from(
        document.querySelectorAll(".analytics-filter-tag-checkbox:checked")
    ).map((checkbox) => checkbox.value);
}

function syncQuickFiltersFromState() {
    const searchInput = document.getElementById("analyticsSearchInput");
    const categorySelect = document.getElementById("analyticsCategoryFilter");
    const typeSelect = document.getElementById("analyticsTypeFilter");
    const scopeSelect = document.getElementById("analyticsScopeFilter");

    if (searchInput) searchInput.value = analyticsState.filters.search;
    if (categorySelect) categorySelect.value = analyticsState.filters.categoryId;
    if (typeSelect) typeSelect.value = analyticsState.filters.type;
    if (scopeSelect) scopeSelect.value = analyticsState.filters.scopeId;
}

function syncFilterModalFromState() {
    const fields = {
        analyticsFilterDateFrom: analyticsState.filters.dateFrom,
        analyticsFilterDateTo: analyticsState.filters.dateTo,
        analyticsFilterSearch: analyticsState.filters.search,
        analyticsFilterAmountMin: analyticsState.filters.amountMin,
        analyticsFilterAmountMax: analyticsState.filters.amountMax,
        analyticsFilterCategory: analyticsState.filters.categoryId,
        analyticsFilterType: analyticsState.filters.type,
        analyticsFilterScope: analyticsState.filters.scopeId
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });

    const withoutScope = document.getElementById("analyticsFilterWithoutScope");
    if (withoutScope) withoutScope.checked = analyticsState.filters.withoutScope;

    document.querySelectorAll(".analytics-filter-tag-checkbox").forEach((checkbox) => {
        checkbox.checked = analyticsState.filters.tagIds.includes(checkbox.value);
    });
}

function resetAnalyticsFilters() {
    analyticsState.filters = {
        dateFrom: "",
        dateTo: "",
        amountMin: "",
        amountMax: "",
        search: "",
        categoryId: "",
        type: "",
        scopeId: "",
        withoutScope: false,
        tagIds: []
    };

    syncQuickFiltersFromState();
    syncFilterModalFromState();
    updateDateText();
    updateActiveFiltersCounter();
}

function openDateModal() {
    document.getElementById("analyticsDateFromInput").value = analyticsState.filters.dateFrom;
    document.getElementById("analyticsDateToInput").value = analyticsState.filters.dateTo;
    document.getElementById("analyticsDateModal").hidden = false;
}

function closeDateModal() {
    document.getElementById("analyticsDateModal").hidden = true;
}

function openFiltersModal() {
    syncFilterModalFromState();
    document.getElementById("analyticsFiltersModal").hidden = false;
}

function closeFiltersModal() {
    document.getElementById("analyticsFiltersModal").hidden = true;
}

function updateDateText() {
    const dateText = document.getElementById("analyticsDateText");

    if (!dateText) return;

    if (!analyticsState.filters.dateFrom && !analyticsState.filters.dateTo) {
        dateText.textContent = "Период не выбран";
        return;
    }

    const from = analyticsState.filters.dateFrom
        ? formatDateRu(analyticsState.filters.dateFrom)
        : "с начала";

    const to = analyticsState.filters.dateTo
        ? formatDateRu(analyticsState.filters.dateTo)
        : "по сегодня";

    dateText.textContent = `${from} – ${to}`;
}

function updateActiveFiltersCounter() {
    const counter = document.getElementById("analyticsFilterCounter");

    if (!counter) return;

    const activeCount = [
        analyticsState.filters.dateFrom,
        analyticsState.filters.dateTo,
        analyticsState.filters.amountMin,
        analyticsState.filters.amountMax,
        analyticsState.filters.search,
        analyticsState.filters.categoryId,
        analyticsState.filters.type,
        analyticsState.filters.scopeId,
        analyticsState.filters.withoutScope,
        analyticsState.filters.tagIds.length > 0
    ].filter(Boolean).length;

    counter.textContent = activeCount;
    counter.hidden = activeCount === 0;
}

function fillSelect(selectId, items, defaultText) {
    const select = document.getElementById(selectId);

    if (!select) return;

    select.innerHTML = `<option value="">${defaultText}</option>`;

    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name || "Без названия";
        select.appendChild(option);
    });
}

function renderFilterTags() {
    const container = document.getElementById("analyticsFilterTagsList");

    if (!container) return;

    if (!analyticsState.tags.length) {
        container.innerHTML = `<span class="filters-empty">Теги пока не созданы</span>`;
        return;
    }

    container.innerHTML = "";

    analyticsState.tags.forEach((tag) => {
        const label = document.createElement("label");
        label.className = "filters-tag-checkbox";

        label.innerHTML = `
            <input
                type="checkbox"
                class="analytics-filter-tag-checkbox"
                value="${escapeHtml(tag.id)}"
            >
            <span>${escapeHtml(tag.name || "Без названия")}</span>
        `;

        container.appendChild(label);
    });
}

function renderSummary(summary) {
    const totalIncome = document.getElementById("totalIncome");
    const totalExpense = document.getElementById("totalExpense");
    const totalBalance = document.getElementById("totalBalance");

    const totalIncomeHint = document.getElementById("totalIncomeHint");
    const totalExpenseHint = document.getElementById("totalExpenseHint");
    const totalBalanceHint = document.getElementById("totalBalanceHint");

    if (!summary || !hasSummaryData(summary)) {
        if (totalIncome) totalIncome.textContent = "Нет данных";
        if (totalExpense) totalExpense.textContent = "Нет данных";
        if (totalBalance) totalBalance.textContent = "Нет данных";

        if (totalIncomeHint) totalIncomeHint.textContent = "Загрузите транзакции";
        if (totalExpenseHint) totalExpenseHint.textContent = "Загрузите транзакции";
        if (totalBalanceHint) totalBalanceHint.textContent = "Загрузите транзакции";
        return;
    }

    if (totalIncome) totalIncome.textContent = formatMoney(summary.totalIncome);
    if (totalExpense) totalExpense.textContent = formatMoney(summary.totalExpense);
    if (totalBalance) totalBalance.textContent = formatMoney(summary.balance);

    if (totalIncomeHint) totalIncomeHint.textContent = "За выбранный период";
    if (totalExpenseHint) totalExpenseHint.textContent = "За выбранный период";
    if (totalBalanceHint) totalBalanceHint.textContent = "За выбранный период";
}

function renderCategoryAnalytics(items) {
    const container = document.getElementById("categoryAnalyticsList");

    if (!container) return;

    const expenses = items
        .filter((item) => Number(item.total || 0) !== 0)
        .sort((a, b) => Math.abs(Number(b.total || 0)) - Math.abs(Number(a.total || 0)));

    if (!expenses.length) {
        renderEmpty(container, "Нет расходов по категориям");
        return;
    }

    const totalExpense = expenses.reduce((sum, item) => sum + Math.abs(Number(item.total || 0)), 0);

    container.innerHTML = "";

    expenses.forEach((item, index) => {
        const amount = Math.abs(Number(item.total || 0));
        const percent = totalExpense > 0 ? amount / totalExpense * 100 : 0;

        const row = document.createElement("div");
        row.className = "analytics-row";

        row.innerHTML = `
            <span>
                <b class="dot ${getDotClass(index)}"></b>
                ${escapeHtml(item.category?.name || "Без категории")}
            </span>
            <span>${formatMoney(amount)}</span>
            <span>${formatPercent(percent)}</span>
        `;

        container.appendChild(row);
    });
}

function renderScopeAnalytics(items) {
    const container = document.getElementById("scopeAnalyticsList");

    if (!container) return;

    const expenses = items
        .filter((item) => item.scope && Number(item.total || 0) !== 0)
        .sort((a, b) => Math.abs(Number(b.total || 0)) - Math.abs(Number(a.total || 0)));

    if (!expenses.length) {
        renderEmpty(container, "Нет расходов в группах");
        return;
    }

    container.innerHTML = "";

    expenses.forEach((item) => {
        const row = document.createElement("div");
        row.className = "analytics-row";

        row.innerHTML = `
            <span>${escapeHtml(item.scope?.name || "Без группы")}</span>
            <span>${formatMoney(Math.abs(Number(item.total || 0)))}</span>
            <span>${item.count || 0}</span>
        `;

        container.appendChild(row);
    });
}

function renderTagAnalytics(items) {
    const container = document.getElementById("tagAnalyticsList");

    if (!container) return;

    const expenses = items
        .filter((item) => item.tag && Number(item.total || 0) !== 0)
        .sort((a, b) => Math.abs(Number(b.total || 0)) - Math.abs(Number(a.total || 0)));

    if (!expenses.length) {
        renderEmpty(container, "Нет расходов с тегами");
        return;
    }

    container.innerHTML = "";

    expenses.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "analytics-row";

        row.innerHTML = `
            <span>
                <b class="tag ${getTagClass(index)}">
                    ${escapeHtml(item.tag?.name || "Без тега")}
                </b>
            </span>
            <span>${formatMoney(Math.abs(Number(item.total || 0)))}</span>
            <span>${item.count || 0}</span>
        `;

        container.appendChild(row);
    });
}

function renderTimeAnalytics(items) {
    const container = document.getElementById("timeAnalyticsList");

    if (!container) return;

    if (!items.length) {
        renderEmpty(container, "Нет операций за выбранный период");
        return;
    }

    container.innerHTML = "";

    items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "analytics-row time-row";

        row.innerHTML = `
            <span>${escapeHtml(formatPeriod(item.period))}</span>
            <span>${formatMoney(item.totalIncome || 0)}</span>
            <span>${formatMoney(item.totalExpense || 0)}</span>
            <span>${formatMoney(item.balance || 0)}</span>
        `;

        container.appendChild(row);
    });
}

function setAnalyticsLoading() {
    setText("totalIncome", "Загрузка...");
    setText("totalExpense", "Загрузка...");
    setText("totalBalance", "Загрузка...");

    renderLoading("categoryAnalyticsList");
    renderLoading("scopeAnalyticsList");
    renderLoading("tagAnalyticsList");
    renderLoading("timeAnalyticsList");
}

function renderNoDataState() {
    setText("totalIncome", "Нет данных");
    setText("totalExpense", "Нет данных");
    setText("totalBalance", "Нет данных");

    setText("totalIncomeHint", "Загрузите транзакции");
    setText("totalExpenseHint", "Загрузите транзакции");
    setText("totalBalanceHint", "Загрузите транзакции");

    renderEmptyById("categoryAnalyticsList", "Загрузите транзакции, чтобы увидеть аналитику");
    renderEmptyById("scopeAnalyticsList", "Нет расходов в группах");
    renderEmptyById("tagAnalyticsList", "Нет расходов с тегами");
    renderEmptyById("timeAnalyticsList", "Нет операций за выбранный период");
}

function renderLoading(containerId) {
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="empty-analytics">
            Загрузка аналитики...
        </div>
    `;
}

function renderEmptyById(containerId, text) {
    const container = document.getElementById(containerId);

    if (!container) return;

    renderEmpty(container, text);
}

function renderEmpty(container, text) {
    container.innerHTML = `
        <div class="empty-analytics">
            ${escapeHtml(text)}
        </div>
    `;
}

function normalizeArrayResponse(response) {
    const data = unwrapData(response);

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(response)) {
        return response;
    }

    return [];
}

function unwrapData(response) {
    if (!response) {
        return null;
    }

    if (response.data !== undefined) {
        return response.data;
    }

    return response;
}

function hasSummaryData(summary) {
    return Number(summary.totalIncome || 0) !== 0 ||
        Number(summary.totalExpense || 0) !== 0 ||
        Number(summary.balance || 0) !== 0;
}

function formatMoney(value) {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}

function formatPercent(value) {
    return `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
}

function formatDateRu(value) {
    if (!value) return "";

    const [year, month, day] = value.split("-");

    return `${day}.${month}.${year}`;
}

function formatPeriod(period) {
    if (!period) {
        return "Период не указан";
    }

    if (/^\d{4}-W\d{2}$/.test(period)) {
        const [year, week] = period.split("-W");

        return `${Number(week)}-я неделя ${year} г.`;
    }

    if (/^\d{4}-\d{2}$/.test(period)) {
        const [year, month] = period.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);

        return date.toLocaleDateString("ru-RU", {
            month: "long",
            year: "numeric"
        });
    }

    return period;
}

function toApiDate(value) {
    return value ? `${value}T00:00:00.000Z` : "";
}

function normalizeDecimal(value) {
    return String(value || "").replace(",", ".");
}

function getDotClass(index) {
    const classes = ["green", "red", "violet", "orange", "peach", "blue", "purple"];
    return classes[index % classes.length];
}

function getTagClass(index) {
    const classes = ["tag-violet", "tag-blue", "tag-green", "tag-orange", "tag-purple", "tag-gray"];
    return classes[index % classes.length];
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}