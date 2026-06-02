const API_BASE_URL = "http://localhost:5009/api";

let analyticsState = {
    categories: [],
    scopes: [],
    tags: [],
    grouping: "month",
    filters: {
        dateFrom: "",
        dateTo: "",
        search: "",
        categoryId: "",
        type: "",
        scopeId: ""
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    initAnalyticsEvents();
    await loadAnalyticsDictionaries();
    await loadAnalyticsData();
});

function initAnalyticsEvents() {
    const applyBtn = document.getElementById("analyticsApplyBtn");
    const resetBtn = document.getElementById("analyticsResetBtn");
    const groupingButtons = document.querySelectorAll(".period-tabs button");

    if (applyBtn) {
        applyBtn.addEventListener("click", async () => {
            readFiltersFromPage();
            updateActiveFiltersCounter();
            await loadAnalyticsData();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            resetAnalyticsFilters();
            updateActiveFiltersCounter();
            await loadAnalyticsData();
        });
    }

    groupingButtons.forEach((button) => {
        button.addEventListener("click", async () => {
            groupingButtons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");

            analyticsState.grouping = button.dataset.grouping || "month";
            await loadAnalyticsData();
        });
    });
}

async function loadAnalyticsDictionaries() {
    try {
        const [categories, scopes, tags] = await Promise.all([
            fetchJson(`${API_BASE_URL}/categories`),
            fetchJson(`${API_BASE_URL}/scopes`),
            fetchJson(`${API_BASE_URL}/tags`)
        ]);

        analyticsState.categories = normalizeArrayResponse(categories);
        analyticsState.scopes = normalizeArrayResponse(scopes);
        analyticsState.tags = normalizeArrayResponse(tags);

        fillSelect("analyticsCategoryFilter", analyticsState.categories, "Все категории");
        fillSelect("analyticsScopeFilter", analyticsState.scopes, "Все группы");
    } catch (error) {
        console.error("Ошибка загрузки справочников аналитики:", error);
    }
}

async function loadAnalyticsData() {
    try {
        setAnalyticsLoading();

        const query = buildAnalyticsQuery();

        const [summary, byCategory, byScope, byTag, byTime] = await Promise.all([
            fetchJson(`${API_BASE_URL}/analytics/summary${query}`),
            fetchJson(`${API_BASE_URL}/analytics/by-category${query}`),
            fetchJson(`${API_BASE_URL}/analytics/by-scope${query}`),
            fetchJson(`${API_BASE_URL}/analytics/by-tag${query}`),
            fetchJson(`${API_BASE_URL}/analytics/by-time${query}&grouping=${encodeURIComponent(analyticsState.grouping)}`)
        ]);

        renderSummary(unwrapData(summary));
        renderCategoryAnalytics(normalizeArrayResponse(byCategory));
        renderScopeAnalytics(normalizeArrayResponse(byScope));
        renderTagAnalytics(normalizeArrayResponse(byTag));
        renderTimeAnalytics(normalizeArrayResponse(byTime));
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

function buildAnalyticsQuery() {
    const params = new URLSearchParams();

    if (analyticsState.filters.dateFrom) {
        params.append("DateFrom", analyticsState.filters.dateFrom);
    }

    if (analyticsState.filters.dateTo) {
        params.append("DateTo", analyticsState.filters.dateTo);
    }

    if (analyticsState.filters.categoryId) {
        params.append("CategoryId", analyticsState.filters.categoryId);
    }

    if (analyticsState.filters.type) {
        params.append("Type", analyticsState.filters.type);
    }

    if (analyticsState.filters.scopeId) {
        params.append("ScopeId", analyticsState.filters.scopeId);
    }

    const queryString = params.toString();

    return queryString ? `?${queryString}` : "?";
}

function readFiltersFromPage() {
    const searchInput = document.getElementById("analyticsSearchInput");
    const categorySelect = document.getElementById("analyticsCategoryFilter");
    const typeSelect = document.getElementById("analyticsTypeFilter");
    const scopeSelect = document.getElementById("analyticsScopeFilter");

    analyticsState.filters.search = searchInput ? searchInput.value.trim() : "";
    analyticsState.filters.categoryId = categorySelect ? categorySelect.value : "";
    analyticsState.filters.type = typeSelect ? typeSelect.value : "";
    analyticsState.filters.scopeId = scopeSelect ? scopeSelect.value : "";
}

function resetAnalyticsFilters() {
    analyticsState.filters = {
        dateFrom: "",
        dateTo: "",
        search: "",
        categoryId: "",
        type: "",
        scopeId: ""
    };

    const searchInput = document.getElementById("analyticsSearchInput");
    const categorySelect = document.getElementById("analyticsCategoryFilter");
    const typeSelect = document.getElementById("analyticsTypeFilter");
    const scopeSelect = document.getElementById("analyticsScopeFilter");
    const dateText = document.getElementById("analyticsDateText");

    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "";
    if (typeSelect) typeSelect.value = "";
    if (scopeSelect) scopeSelect.value = "";
    if (dateText) dateText.textContent = "Период не выбран";
}

function updateActiveFiltersCounter() {
    const counter = document.getElementById("analyticsFilterCounter");

    if (!counter) return;

    const activeCount = Object.values(analyticsState.filters).filter(Boolean).length;

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
        option.textContent = item.name;
        select.appendChild(option);
    });
}

function renderSummary(summary) {
    const totalIncome = document.getElementById("totalIncome");
    const totalExpense = document.getElementById("totalExpense");
    const totalBalance = document.getElementById("totalBalance");

    if (!summary || !hasSummaryData(summary)) {
        if (totalIncome) totalIncome.textContent = "Нет данных";
        if (totalExpense) totalExpense.textContent = "Нет данных";
        if (totalBalance) totalBalance.textContent = "Нет данных";
        return;
    }

    if (totalIncome) totalIncome.textContent = formatMoney(summary.totalIncome);
    if (totalExpense) totalExpense.textContent = formatMoney(summary.totalExpense);
    if (totalBalance) totalBalance.textContent = formatMoney(summary.balance);
}

function renderCategoryAnalytics(items) {
    const container = document.getElementById("categoryAnalyticsList");

    if (!container) return;

    if (!items.length) {
        renderEmpty(container);
        return;
    }

    container.innerHTML = "";

    items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "analytics-row";

        row.innerHTML = `
            <span>
                <b class="dot ${getDotClass(index)}"></b>
                ${escapeHtml(item.category?.name || "Без категории")}
            </span>
            <span>${formatMoney(Math.abs(item.total || 0))}</span>
            <span>${formatPercent(item.percent)}</span>
        `;

        container.appendChild(row);
    });
}

function renderScopeAnalytics(items) {
    const container = document.getElementById("scopeAnalyticsList");

    if (!container) return;

    if (!items.length) {
        renderEmpty(container);
        return;
    }

    container.innerHTML = "";

    items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "analytics-row";

        row.innerHTML = `
            <span>${escapeHtml(item.scope?.name || "Без группы")}</span>
            <span>${formatMoney(Math.abs(item.total || 0))}</span>
            <span>${item.count || 0}</span>
        `;

        container.appendChild(row);
    });
}

function renderTagAnalytics(items) {
    const container = document.getElementById("tagAnalyticsList");

    if (!container) return;

    if (!items.length) {
        renderEmpty(container);
        return;
    }

    container.innerHTML = "";

    items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "analytics-row";

        row.innerHTML = `
            <span>
                <b class="tag ${getTagClass(index)}">
                    ${escapeHtml(item.tag?.name || "без тега")}
                </b>
            </span>
            <span>${formatMoney(Math.abs(item.total || 0))}</span>
            <span>${item.count || 0}</span>
        `;

        container.appendChild(row);
    });
}

function renderTimeAnalytics(items) {
    const container = document.getElementById("timeAnalyticsList");

    if (!container) return;

    if (!items.length) {
        renderEmpty(container);
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
    const totalIncome = document.getElementById("totalIncome");
    const totalExpense = document.getElementById("totalExpense");
    const totalBalance = document.getElementById("totalBalance");

    if (totalIncome) totalIncome.textContent = "Загрузка...";
    if (totalExpense) totalExpense.textContent = "Загрузка...";
    if (totalBalance) totalBalance.textContent = "Загрузка...";

    renderLoading("categoryAnalyticsList");
    renderLoading("scopeAnalyticsList");
    renderLoading("tagAnalyticsList");
    renderLoading("timeAnalyticsList");
}

function renderNoDataState() {
    const totalIncome = document.getElementById("totalIncome");
    const totalExpense = document.getElementById("totalExpense");
    const totalBalance = document.getElementById("totalBalance");

    if (totalIncome) totalIncome.textContent = "Нет данных";
    if (totalExpense) totalExpense.textContent = "Нет данных";
    if (totalBalance) totalBalance.textContent = "Нет данных";

    renderEmptyById("categoryAnalyticsList");
    renderEmptyById("scopeAnalyticsList");
    renderEmptyById("tagAnalyticsList");
    renderEmptyById("timeAnalyticsList");
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

function renderEmptyById(containerId) {
    const container = document.getElementById(containerId);

    if (!container) return;

    renderEmpty(container);
}

function renderEmpty(container) {
    container.innerHTML = `
        <div class="empty-analytics">
            Загрузите транзакции, чтобы увидеть аналитику
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

function formatPeriod(period) {
    if (!period) {
        return "Период не указан";
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

function getDotClass(index) {
    const classes = ["green", "red", "violet", "orange", "peach", "blue", "purple"];
    return classes[index % classes.length];
}

function getTagClass(index) {
    const classes = ["tag-violet", "tag-blue", "tag-green", "tag-orange", "tag-purple", "tag-gray"];
    return classes[index % classes.length];
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}