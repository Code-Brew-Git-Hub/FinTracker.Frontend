const API_URL =
    "http://localhost:5009/api";

const navLinks =
    document.querySelectorAll(".nav a");

const homeButton =
    document.querySelector(".go-home");

const transactionsLink =
    document.querySelector(".go-transactions");

const uploadHeaderButton =
    document.querySelector(".go-upload");

const switchButtons =
    document.querySelectorAll(".switch-btn");

const importPanel =
    document.querySelector("#importPanel");

const manualForm =
    document.querySelector("#manualForm");

const chooseBtn =
    document.querySelector(".choose-btn");

const fileInput =
    document.querySelector("#fileInput");

const dropzone =
    document.querySelector("#dropzone");

const importButton =
    document.querySelector(".import-btn");

const cancelButton =
    document.querySelector(".cancel-btn");

const tableBody =
    document.querySelector("#previewTableBody");

const transactionsCount =
    document.querySelector(".transactions-count");

const incomeCount =
    document.querySelector(".income-count");

const expenseCount =
    document.querySelector(".expense-count");

const periodText =
    document.querySelector(".period-text");

const categoryTags =
    document.querySelector(".category-tags");

const manualKindButtons =
    document.querySelectorAll(".manual-kind-btn");

const manualAmount =
    document.querySelector("#manualAmount");

const manualCurrency =
    document.querySelector("#manualCurrency");

const manualDate =
    document.querySelector("#manualDate");

const manualDescription =
    document.querySelector("#manualDescription");

const manualCategory =
    document.querySelector("#manualCategory");

const manualCategoryHint =
    document.querySelector("#manualCategoryHint");

const manualScope =
    document.querySelector("#manualScope");

const manualTags =
    document.querySelector("#manualTags");

const manualComment =
    document.querySelector("#manualComment");

const manualError =
    document.querySelector("#manualError");

const manualResetBtn =
    document.querySelector("#manualResetBtn");

const manualSubmitBtn =
    document.querySelector("#manualSubmitBtn");

const uploadMessageModal =
    document.querySelector("#uploadMessageModal");

const uploadMessageTitle =
    document.querySelector("#uploadMessageTitle");

const uploadMessageText =
    document.querySelector("#uploadMessageText");

const uploadMessageClose =
    document.querySelector("#uploadMessageClose");

const uploadMessageOk =
    document.querySelector("#uploadMessageOk");

let manualKind = "expense";

let categories = [];
let scopes = [];
let tags = [];

/*
    =========================
    СТАРТ
    =========================
*/

document.addEventListener("DOMContentLoaded", async () => {
    setDefaultManualDate();
    bindEvents();
    await loadReferences();
});

/*
    =========================
    СОБЫТИЯ
    =========================
*/

function bindEvents() {
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(el => {
                el.classList.remove("active");
            });

            link.classList.add("active");
        });
    });

    homeButton.addEventListener("click", () => {
        window.location.href = "../index.html";
    });

    if (transactionsLink) {
        transactionsLink.addEventListener("click", async () => {
            const imported =
                localStorage.getItem("transactionsImported");

            if (imported === "true") {
                window.location.href = "transactions.html";
            } else {
                await showMessage(
                    "Нет транзакций",
                    "Сначала импортируйте файл или создайте транзакцию вручную."
                );
            }
        });
    }

    if (uploadHeaderButton) {
        uploadHeaderButton.addEventListener("click", () => {
            window.location.href = "upload.html";
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            window.location.href = "../index.html";
        });
    }

    switchButtons.forEach(button => {
        button.addEventListener("click", () => {
            switchMode(button.dataset.mode);
        });
    });

    manualKindButtons.forEach(button => {
        button.addEventListener("click", () => {
            setManualKind(button.dataset.kind);
        });
    });

    chooseBtn.addEventListener("click", () => {
        fileInput.click();
    });

    if (dropzone) {
        dropzone.addEventListener("dragover", (event) => {
            event.preventDefault();
            dropzone.style.borderColor = "#2F80ED";
            dropzone.style.background = "#EDF5FF";
        });

        dropzone.addEventListener("dragleave", () => {
            dropzone.style.borderColor = "#B9D4FA";
            dropzone.style.background = "#F5F9FF";
        });

        dropzone.addEventListener("drop", async (event) => {
            event.preventDefault();

            dropzone.style.borderColor = "#B9D4FA";
            dropzone.style.background = "#F5F9FF";

            const files =
                event.dataTransfer.files;

            if (!files.length) {
                return;
            }

            await uploadFiles(files);
        });
    }

    fileInput.addEventListener("change", async () => {
        const files =
            fileInput.files;

        if (!files.length) {
            return;
        }

        await uploadFiles(files);

        fileInput.value = "";
    });

    if (importButton) {
        importButton.addEventListener("click", async () => {
            const imported =
                localStorage.getItem("transactionsImported");

            if (imported === "true") {
                window.location.href = "transactions.html";
            } else {
                await showMessage(
                    "Файл не загружен",
                    "Сначала загрузите CSV-файл или создайте транзакцию вручную."
                );
            }
        });
    }

    if (manualForm) {
        manualForm.addEventListener("submit", createManualTransaction);
    }

    if (manualResetBtn) {
        manualResetBtn.addEventListener("click", resetManualForm);
    }

    uploadMessageClose.addEventListener("click", closeMessage);
    uploadMessageOk.addEventListener("click", closeMessage);

    uploadMessageModal.addEventListener("click", event => {
        if (event.target === uploadMessageModal) {
            closeMessage();
        }
    });
}

/*
    =========================
    ПЕРЕКЛЮЧАТЕЛЬ
    =========================
*/

function switchMode(mode) {
    switchButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.mode === mode
        );
    });

    if (mode === "manual") {
        importPanel.hidden = true;
        manualForm.hidden = false;
    } else {
        importPanel.hidden = false;
        manualForm.hidden = true;
    }
}

function setManualKind(kind) {
    manualKind =
        kind === "income"
            ? "income"
            : "expense";

    manualKindButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.kind === manualKind
        );
    });
}

/*
    =========================
    API
    =========================
*/

async function apiRequest(path, options = {}) {
    const response =
        await fetch(`${API_URL}${path}`, options);

    if (!response.ok && response.status !== 204) {
        let errorText =
            `HTTP ${response.status}`;

        try {
            const errorData =
                await response.json();

            errorText =
                errorData.error ||
                errorData.title ||
                errorText;

        } catch {
            errorText =
                await response.text();
        }

        throw new Error(errorText);
    }

    if (response.status === 204) {
        return null;
    }

    const data =
        await response.json();

    if (data && data.success === false) {
        throw new Error(
            data.error || "Ошибка API"
        );
    }

    return data?.data ?? data;
}

async function loadReferences() {
    try {
        const results =
            await Promise.all([
                apiRequest("/categories"),
                apiRequest("/scopes"),
                apiRequest("/tags")
            ]);

        categories =
            results[0] || [];

        scopes =
            results[1] || [];

        tags =
            results[2] || [];

        renderManualReferences();

    } catch (error) {
        console.error(error);

        showManualError(
            "Не удалось загрузить категории, группы и теги"
        );
    }
}

function renderManualReferences() {
    renderManualCategories();
    renderManualScopes();
    renderManualTags();
}

function renderManualCategories() {
    manualCategory.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent =
        "Выберите категорию";

    manualCategory.appendChild(emptyOption);

    categories.forEach(category => {
        const option =
            document.createElement("option");

        option.value =
            category.id;

        option.textContent =
            category.name;

        manualCategory.appendChild(option);
    });

    if (categories.length === 0) {
        manualCategory.disabled = true;
        manualCategoryHint.hidden = false;
    } else {
        manualCategory.disabled = false;
        manualCategoryHint.hidden = true;
    }
}

function renderManualScopes() {
    manualScope.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent =
        "Без группы";

    manualScope.appendChild(emptyOption);

    scopes.forEach(scope => {
        const option =
            document.createElement("option");

        option.value =
            scope.id;

        option.textContent =
            scope.name;

        manualScope.appendChild(option);
    });
}

function renderManualTags() {
    manualTags.innerHTML = "";

    if (tags.length === 0) {
        manualTags.innerHTML = `
            <span class="manual-tags-empty">
                Теги пока не созданы
            </span>
        `;

        return;
    }

    tags.forEach(tag => {
        const label =
            document.createElement("label");

        label.className =
            "manual-tag-option";

        label.innerHTML = `
            <input
                type="checkbox"
                value="${escapeHtml(tag.id)}"
            >

            <span>
                ${escapeHtml(tag.name)}
            </span>
        `;

        manualTags.appendChild(label);
    });
}

/*
    =========================
    ИМПОРТ
    =========================
*/

async function uploadFiles(files) {
    const formData =
        new FormData();

    for (const file of files) {
        console.log(file);
        formData.append("files", file);
    }

    try {
        const response =
            await fetch(
                `${API_URL}/import`,
                {
                    method: "POST",
                    body: formData
                }
            );

        const responseData =
            await response.json();

        console.log(
            "Ответ сервера:",
            responseData
        );

        if (!responseData.success) {
            await showMessage(
                "Ошибка импорта",
                responseData.error || "Не удалось импортировать файл"
            );

            return;
        }

        const imports =
            responseData.data;

        const importResult =
            imports[imports.length - 1];

        if (!importResult.success) {
            await showMessage(
                "Ошибка импорта",
                importResult.error || "Не удалось импортировать файл"
            );

            return;
        }

        const result =
            importResult.result;

        localStorage.setItem(
            "transactionsImported",
            "true"
        );

        renderImportResult(result);

    } catch (error) {
        console.error(error);

        await showMessage(
            "Ошибка загрузки",
            "Не удалось загрузить файл"
        );
    }
}

function renderImportResult(result) {
    transactionsCount.textContent =
        result.total;

    incomeCount.textContent =
        result.incomeCount;

    expenseCount.textContent =
        result.expenseCount;

    if (result.period) {
        const from =
            new Date(result.period.from);

        const to =
            new Date(result.period.to);

        periodText.innerHTML =
            `${from.toLocaleDateString("ru-RU")} –<br>${to.toLocaleDateString("ru-RU")}`;
    }

    if (result.categories?.length > 0) {
        categoryTags.innerHTML = "";

        result.categories.forEach((category, index) => {
            const colors = [
                "blue-tag",
                "orange-tag",
                "green-tag",
                "gray-tag"
            ];

            const tag = `
                <div class="tag ${colors[index % colors.length]}">
                    ${escapeHtml(category.name)} × ${category.count}
                </div>
            `;

            categoryTags.innerHTML += tag;
        });
    }

    if (result.preview?.length > 0) {
        tableBody.innerHTML = "";

        const lastTransactions =
            result.preview.slice(0, 5);

        lastTransactions.forEach(transaction => {
            let formattedDate =
                "—";

            if (transaction.dateUtc) {
                formattedDate =
                    new Date(
                        transaction.dateUtc
                    ).toLocaleDateString("ru-RU");
            }

            const amount =
                Number(transaction.amount);

            const formattedAmount =
                amount > 0
                    ? `+${amount.toLocaleString("ru-RU")} ₽`
                    : `${amount.toLocaleString("ru-RU")} ₽`;

            let categoryClass =
                "gray-tag";

            if (amount > 0) {
                categoryClass =
                    "green-tag";
            }

            if (amount < 0) {
                categoryClass =
                    "orange-tag";
            }

            const row = `
                <tr>
                    <td>${formattedDate}</td>

                    <td>
                        ${escapeHtml(transaction.description || "Без описания")}
                    </td>

                    <td>
                        ${formattedAmount}
                    </td>

                    <td>
                        <span class="table-tag ${categoryClass}">
                            ${escapeHtml(transaction.category || "—")}
                        </span>
                    </td>
                </tr>
            `;

            tableBody.innerHTML += row;
        });
    }
}

/*
    =========================
    РУЧНОЕ СОЗДАНИЕ
    =========================
*/

async function createManualTransaction(event) {
    event.preventDefault();

    hideManualError();

    const amount =
        parseAmount(manualAmount.value);

    if (!amount || amount <= 0) {
        showManualError(
            "Укажите сумму больше нуля"
        );

        return;
    }

    if (!manualDate.value) {
        showManualError(
            "Укажите дату"
        );

        return;
    }

    if (!manualCategory.value) {
        showManualError(
            "Выберите категорию"
        );

        return;
    }

    const signedAmount =
        manualKind === "expense"
            ? -amount
            : amount;

    const tagIds =
        Array.from(
            manualTags.querySelectorAll("input:checked")
        ).map(input => input.value);

    const payload = {
        amount: signedAmount,
        currency: manualCurrency.value,
        dateUtc: dateInputToUtcIso(manualDate.value),
        description:
            manualDescription.value.trim() || null,
        comment:
            manualComment.value.trim() || null,
        categoryId:
            manualCategory.value,
        tagIds:
            tagIds
    };

    if (manualScope.value) {
        payload.scopeId =
            manualScope.value;
    }

    manualSubmitBtn.disabled = true;
    manualSubmitBtn.textContent =
        "Создание...";

    try {
        await apiRequest(
            "/transactions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        localStorage.setItem(
            "transactionsImported",
            "true"
        );

        resetManualForm();

        await showMessage(
            "Транзакция создана",
            "Новая транзакция успешно добавлена. Теперь её можно увидеть на странице «Транзакции»."
        );

    } catch (error) {
        console.error(error);

        showManualError(
            error.message || "Не удалось создать транзакцию"
        );

    } finally {
        manualSubmitBtn.disabled = false;
        manualSubmitBtn.textContent =
            "Создать транзакцию";
    }
}

function resetManualForm() {
    manualKind = "expense";

    manualKindButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.kind === manualKind
        );
    });

    manualAmount.value = "";
    manualCurrency.value = "RUB";
    manualDescription.value = "";
    manualComment.value = "";
    manualCategory.value = "";
    manualScope.value = "";

    manualTags
        .querySelectorAll("input")
        .forEach(input => {
            input.checked = false;
        });

    setDefaultManualDate();
    hideManualError();
}

function setDefaultManualDate() {
    if (!manualDate) {
        return;
    }

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    manualDate.value =
        `${year}-${month}-${day}`;
}

function parseAmount(value) {
    const normalized =
        String(value)
            .replace(",", ".")
            .replace(/\s/g, "");

    const number =
        Number(normalized);

    if (Number.isNaN(number)) {
        return null;
    }

    return number;
}

function dateInputToUtcIso(value) {
    return `${value}T12:00:00Z`;
}

function showManualError(message) {
    manualError.textContent =
        message;

    manualError.hidden =
        false;
}

function hideManualError() {
    manualError.textContent =
        "";

    manualError.hidden =
        true;
}

/*
    =========================
    МОДАЛКА
    =========================
*/

function showMessage(title, message) {
    uploadMessageTitle.textContent =
        title;

    uploadMessageText.textContent =
        message;

    uploadMessageModal.hidden =
        false;

    return new Promise(resolve => {
        const close = () => {
            uploadMessageModal.hidden =
                true;

            uploadMessageOk.removeEventListener(
                "click",
                close
            );

            uploadMessageClose.removeEventListener(
                "click",
                close
            );

            resolve();
        };

        uploadMessageOk.addEventListener(
            "click",
            close
        );

        uploadMessageClose.addEventListener(
            "click",
            close
        );
    });
}

function closeMessage() {
    uploadMessageModal.hidden =
        true;
}

/*
    =========================
    УТИЛИТЫ
    =========================
*/

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}