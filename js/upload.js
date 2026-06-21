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

const presetSelect =
    document.querySelector("#presetSelect");

const presetQuickEditBtn =
    document.querySelector("#presetQuickEditBtn");

const presetSettingsBtn =
    document.querySelector("#presetSettingsBtn");

const presetsModal =
    document.querySelector("#presetsModal");

const presetsModalClose =
    document.querySelector("#presetsModalClose");

const presetsCancelBtn =
    document.querySelector("#presetsCancelBtn");

const presetsChooseBtn =
    document.querySelector("#presetsChooseBtn");

const presetsList =
    document.querySelector("#presetsList");

const addPresetBtn =
    document.querySelector("#addPresetBtn");

const presetEditorModal =
    document.querySelector("#presetEditorModal");

const presetEditorTitle =
    document.querySelector("#presetEditorTitle");

const presetEditorClose =
    document.querySelector("#presetEditorClose");

const presetEditorCancel =
    document.querySelector("#presetEditorCancel");

const presetEditorSave =
    document.querySelector("#presetEditorSave");

const presetNameInput =
    document.querySelector("#presetNameInput");

const presetHeadersList =
    document.querySelector("#presetHeadersList");

const presetDelimiter =
    document.querySelector("#presetDelimiter");

const presetDateCulture =
    document.querySelector("#presetDateCulture");

const presetDateFormat =
    document.querySelector("#presetDateFormat");

const presetNumberCulture =
    document.querySelector("#presetNumberCulture");

const presetMapDate =
    document.querySelector("#presetMapDate");

const presetMapAmount =
    document.querySelector("#presetMapAmount");

const presetMapCurrency =
    document.querySelector("#presetMapCurrency");

const presetMapDescription =
    document.querySelector("#presetMapDescription");

const presetMapCategory =
    document.querySelector("#presetMapCategory");

const presetMapType =
    document.querySelector("#presetMapType");

const presetEditorError =
    document.querySelector("#presetEditorError");

let manualKind = "expense";

let categories = [];
let scopes = [];
let tags = [];

let importPresets = [];
let selectedPresetId = "";
let presetRecognitionMessage = "";
let selectedFiles = [];
let previewIsReady = false;
let previewIsLoading = false;
let previewHeaders = [
    "operationDate",
    "currency",
    "amount",
    "description",
    "category",
    "type"
];

let currentEditingPresetId = null;
let editorHeaders = [];
let uploadMessageResolver = null;

/*
    =========================
    СТАРТ
    =========================
*/

document.addEventListener("DOMContentLoaded", async () => {
    setDefaultManualDate();
    bindEvents();

    await Promise.all([
        loadReferences(),
        loadImportPresets()
    ]);

    renderEmptyImportState();
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
        cancelButton.addEventListener("click", resetImportState);
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

            await handleSelectedFiles(files);
        });
    }

    fileInput.addEventListener("change", async () => {
        const files =
            fileInput.files;

        if (!files.length) {
            return;
        }

        await handleSelectedFiles(files);

        fileInput.value = "";
    });

    if (importButton) {
        importButton.addEventListener("click", importSelectedFiles);
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

    if (presetSelect) {
        presetSelect.addEventListener("change", () => {
            selectedPresetId = presetSelect.value;
            renderPresetsList();
        });
    }

    if (presetSettingsBtn) {
        presetSettingsBtn.addEventListener("click", openPresetsModal);
    }

    if (presetQuickEditBtn) {
        presetQuickEditBtn.addEventListener("click", () => {
            if (!selectedPresetId) {
                showMessage(
                    "Пресет не выбран",
                    "Сначала выберите пресет для редактирования."
                );

                return;
            }

            openPresetEditor(selectedPresetId);
        });
    }

    if (presetsModalClose) {
        presetsModalClose.addEventListener("click", closePresetsModal);
    }

    if (presetsCancelBtn) {
        presetsCancelBtn.addEventListener("click", closePresetsModal);
    }

    if (presetsChooseBtn) {
        presetsChooseBtn.addEventListener("click", choosePresetFromModal);
    }

    if (presetsModal) {
        presetsModal.addEventListener("click", event => {
            if (event.target === presetsModal) {
                closePresetsModal();
            }
        });
    }

    if (addPresetBtn) {
        addPresetBtn.addEventListener("click", () => {
            openPresetEditor(null);
        });
    }

    if (presetEditorClose) {
        presetEditorClose.addEventListener("click", closePresetEditor);
    }

    if (presetEditorCancel) {
        presetEditorCancel.addEventListener("click", closePresetEditor);
    }

    if (presetEditorModal) {
        presetEditorModal.addEventListener("click", event => {
            if (event.target === presetEditorModal) {
                closePresetEditor();
            }
        });
    }

    if (presetEditorSave) {
        presetEditorSave.addEventListener("click", savePresetFromEditor);
    }
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

async function loadImportPresets() {
    if (!presetSelect) {
        return;
    }

    try {
        importPresets =
            await apiRequest("/import/presets") || [];

        if (!selectedPresetId && importPresets.length > 0) {
            selectedPresetId =
                importPresets[0].id;
        }

        renderPresetSelect();
        renderPresetsList();

    } catch (error) {
        console.error(error);

        presetSelect.innerHTML = `
            <option value="">
                Ошибка пресетов
            </option>
        `;
    }
}

function renderPresetSelect() {
    if (!presetSelect) {
        return;
    }

    presetSelect.innerHTML = "";

    if (importPresets.length === 0) {
        const option =
            document.createElement("option");

        option.value = "";
        option.textContent =
            "Пресеты не найдены";

        presetSelect.appendChild(option);
        presetSelect.disabled = true;

        return;
    }

    presetSelect.disabled = false;

    const selectedExists =
        importPresets.some(preset => preset.id === selectedPresetId);

    if (!selectedPresetId && presetRecognitionMessage) {
        const option =
            document.createElement("option");

        option.value = "";
        option.textContent =
            presetRecognitionMessage;

        presetSelect.appendChild(option);
    } else if (!selectedExists) {
        selectedPresetId =
            importPresets[0].id;
    }

    importPresets.forEach(preset => {
        const option =
            document.createElement("option");

        option.value =
            preset.id;

        option.textContent =
            preset.name;

        presetSelect.appendChild(option);
    });

    presetSelect.value =
        selectedPresetId;
}

function openPresetsModal() {
    renderPresetsList();

    presetsModal.hidden =
        false;
}

function closePresetsModal() {
    presetsModal.hidden =
        true;
}

function choosePresetFromModal() {
    if (presetSelect) {
        presetSelect.value =
            selectedPresetId;
    }

    closePresetsModal();
}

function renderPresetsList() {
    if (!presetsList) {
        return;
    }

    presetsList.innerHTML = "";

    if (importPresets.length === 0) {
        presetsList.innerHTML = `
            <div class="presets-empty">
                Пресеты пока не созданы
            </div>
        `;

        return;
    }

    importPresets.forEach(preset => {
        const item =
            document.createElement("div");

        item.className =
            "preset-list-item";

        if (preset.id === selectedPresetId) {
            item.classList.add("active");
        }

        item.dataset.presetId =
            preset.id;

        item.innerHTML = `
            <span class="preset-list-name">
                ${escapeHtml(preset.name)}
            </span>

            <div class="preset-list-actions">
                <button
                    type="button"
                    class="preset-icon-btn"
                    data-preset-action="edit"
                    aria-label="Редактировать пресет"
                >
                    <img src="../img/change_category.png" alt="">
                </button>

                <button
                    type="button"
                    class="preset-icon-btn"
                    data-preset-action="delete"
                    aria-label="Удалить пресет"
                >
                    <img src="../img/delete.png" alt="">
                </button>
            </div>
        `;

        item.addEventListener("click", event => {
            const actionButton =
                event.target.closest("[data-preset-action]");

            if (actionButton) {
                return;
            }

            selectedPresetId =
                preset.id;

            renderPresetsList();
        });

        item
            .querySelector('[data-preset-action="edit"]')
            .addEventListener("click", () => {
                openPresetEditor(preset.id);
            });

        item
            .querySelector('[data-preset-action="delete"]')
            .addEventListener("click", async () => {
                await deletePreset(preset.id);
            });

        presetsList.appendChild(item);
    });
}

async function openPresetEditor(presetId) {
    currentEditingPresetId =
        presetId;

    hidePresetEditorError();

    if (presetId) {
        presetEditorTitle.textContent =
            "Изменить пресет";

        try {
            const preset =
                await apiRequest(`/import/presets/${presetId}`);

            fillPresetEditor(preset);

        } catch (error) {
            console.error(error);

            await showMessage(
                "Ошибка",
                "Не удалось загрузить пресет"
            );
        }

    } else {
        presetEditorTitle.textContent =
            "Новый пресет";

        fillPresetEditor({
            name: "",
            matchHeaders: previewHeaders,
            parseOptions: null
        });
    }

    presetEditorModal.hidden =
        false;
}

function closePresetEditor() {
    presetEditorModal.hidden =
        true;

    currentEditingPresetId =
        null;

    hidePresetEditorError();
}

function fillPresetEditor(preset) {
    const parseOptions =
        preset.parseOptions || {};

    const columnMapping =
        parseOptions.columnMapping || {};

    editorHeaders =
        preset.matchHeaders?.length > 0
            ? preset.matchHeaders
            : previewHeaders;

    presetNameInput.value =
        preset.name || "";

    presetDelimiter.value =
        parseOptions.delimiter || ";";

    presetDateCulture.value =
        parseOptions.culture || "ru-RU";

    presetDateFormat.value =
        parseOptions.dateFormat || "";

    presetNumberCulture.value =
        parseOptions.numberCulture || "ru-RU";

    renderPresetHeaders();
    renderMappingSelects(columnMapping);
}

function renderPresetHeaders() {
    presetHeadersList.innerHTML = "";

    editorHeaders.forEach(header => {
        presetHeadersList.innerHTML += `
            <span class="preset-header-chip">
                <img src="../img/mnogo_tochek.png" alt="">
                ${escapeHtml(header)}
            </span>
        `;
    });
}

function renderMappingSelects(columnMapping = {}) {
    renderColumnSelect(
        presetMapDate,
        getColumnName(columnMapping.date),
        false
    );

    renderColumnSelect(
        presetMapAmount,
        getColumnName(columnMapping.amount),
        false
    );

    renderColumnSelect(
        presetMapCurrency,
        getColumnName(columnMapping.currency),
        false
    );

    renderColumnSelect(
        presetMapDescription,
        getColumnName(columnMapping.description),
        true
    );

    renderColumnSelect(
        presetMapCategory,
        getColumnName(columnMapping.categoryName),
        false
    );

    renderColumnSelect(
        presetMapType,
        getColumnName(columnMapping.type?.column),
        true
    );
}

function renderColumnSelect(select, selectedValue, allowEmpty) {
    select.innerHTML = "";

    if (allowEmpty) {
        const emptyOption =
            document.createElement("option");

        emptyOption.value = "";
        emptyOption.textContent =
            "Не выбрано";

        select.appendChild(emptyOption);
    }

    editorHeaders.forEach(header => {
        const option =
            document.createElement("option");

        option.value =
            header;

        option.textContent =
            header;

        select.appendChild(option);
    });

    if (selectedValue) {
        select.value =
            selectedValue;
    }
}

function getColumnName(mapping) {
    if (!mapping) {
        return "";
    }

    if (mapping.columnName) {
        return mapping.columnName;
    }

    if (
        typeof mapping.columnIndex === "number" &&
        editorHeaders[mapping.columnIndex]
    ) {
        return editorHeaders[mapping.columnIndex];
    }

    return "";
}

async function savePresetFromEditor() {
    hidePresetEditorError();

    const name =
        presetNameInput.value.trim();

    if (!name) {
        showPresetEditorError(
            "Укажите название пресета"
        );

        return;
    }

    if (
        !presetMapDate.value ||
        !presetMapAmount.value ||
        !presetMapCurrency.value ||
        !presetMapCategory.value
    ) {
        showPresetEditorError(
            "Заполните обязательные поля маппинга"
        );

        return;
    }

    const payload =
        buildPresetPayload(name);

    presetEditorSave.disabled =
        true;

    presetEditorSave.textContent =
        "Сохранение...";

    try {
        if (currentEditingPresetId) {
            await apiRequest(
                `/import/presets/${currentEditingPresetId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );
        } else {
            await apiRequest(
                "/import/presets",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );
        }

        closePresetEditor();

        await loadImportPresets();

    } catch (error) {
        console.error(error);

        showPresetEditorError(
            error.message || "Не удалось сохранить пресет"
        );

    } finally {
        presetEditorSave.disabled =
            false;

        presetEditorSave.textContent =
            "Сохранить";
    }
}

function buildPresetPayload(name) {
    const delimiter =
        presetDelimiter.value === "\\t"
            ? "\t"
            : presetDelimiter.value;

    const columnMapping = {
        date:
            buildColumnRef(presetMapDate.value),
        amount:
            buildColumnRef(presetMapAmount.value),
        currency:
            buildColumnRef(presetMapCurrency.value),
        categoryName:
            buildColumnRef(presetMapCategory.value)
    };

    if (presetMapDescription.value) {
        columnMapping.description =
            buildColumnRef(presetMapDescription.value);
    }

    if (presetMapType.value) {
        columnMapping.type = {
            column:
                buildColumnRef(presetMapType.value),
            incomeValues: [
                "income",
                "приход",
                "credit",
                "зачисление",
                "пополнение",
                "доход"
            ],
            expenseValues: [
                "expense",
                "расход",
                "debit",
                "списание"
            ]
        };
    }

    return {
        name,
        matchHeaders:
            editorHeaders,
        parseOptions: {
            delimiter,
            culture:
                presetDateCulture.value,
            dateFormat:
                presetDateFormat.value || null,
            numberCulture:
                presetNumberCulture.value || null,
            hasHeaderRecord:
                true,
            columnMapping
        }
    };
}

function buildColumnRef(columnName) {
    return {
        columnName
    };
}

async function deletePreset(presetId) {
    const preset =
        importPresets.find(item => item.id === presetId);

    const confirmed =
        window.confirm(
            `Удалить пресет «${preset?.name || "без названия"}»?`
        );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            `/import/presets/${presetId}`,
            {
                method: "DELETE"
            }
        );

        if (selectedPresetId === presetId) {
            selectedPresetId = "";
        }

        await loadImportPresets();

    } catch (error) {
        console.error(error);

        await showMessage(
            "Ошибка",
            error.message || "Не удалось удалить пресет"
        );
    }
}

function showPresetEditorError(message) {
    presetEditorError.textContent =
        message;

    presetEditorError.hidden =
        false;
}

function hidePresetEditorError() {
    presetEditorError.textContent =
        "";

    presetEditorError.hidden =
        true;
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

async function handleSelectedFiles(files) {
    selectedFiles =
        Array.from(files);

    previewIsReady =
        false;

    presetRecognitionMessage =
        "";

    if (selectedFiles.length === 0) {
        renderEmptyImportState();
        return;
    }

    await previewImportFile(selectedFiles[0]);
}

async function previewImportFile(file) {
    if (previewIsLoading) {
        return;
    }

    previewIsLoading =
        true;

    importButton.disabled =
        true;

    importButton.textContent =
        "Предпросмотр...";

    const formData =
        new FormData();

    formData.append("file", file);

    try {
        const response =
            await fetch(
                `${API_URL}/import/preview`,
                {
                    method: "POST",
                    body: formData
                }
            );

        const responseData =
            await response.json();

        if (!response.ok || responseData.success === false) {
            throw new Error(
                responseData.error ||
                responseData.title ||
                "Не удалось выполнить предпросмотр"
            );
        }

        const preview =
            responseData.data || responseData;

        if (preview.headers?.length > 0) {
            previewHeaders =
                preview.headers;
        }

        if (Array.isArray(preview.presets)) {
            importPresets =
                preview.presets;

            renderPresetSelect();
        }

        if (preview.matchedPresetId) {
            selectedPresetId =
                preview.matchedPresetId;

            presetRecognitionMessage =
                "";

            if (presetSelect) {
                presetSelect.value =
                    selectedPresetId;
            }
        } else {
            selectedPresetId =
                "";

            presetRecognitionMessage =
                "Пресет не распознан";

            renderPresetSelect();
        }

        previewIsReady =
            true;

        renderPreviewState(file, preview);
        renderPresetsList();

    } catch (error) {
        console.error(error);

        previewIsReady =
            false;

        await showMessage(
            "Ошибка предпросмотра",
            error.message || "Не удалось прочитать CSV-файл"
        );

    } finally {
        previewIsLoading =
            false;

        importButton.disabled =
            false;

        importButton.textContent =
            "Импортировать";
    }
}

async function importSelectedFiles() {
    if (selectedFiles.length === 0) {
        await showMessage(
            "Файл не выбран",
            "Сначала выберите CSV-файл для импорта."
        );

        return;
    }

    if (!previewIsReady) {
        await showMessage(
            "Предпросмотр не готов",
            "Дождитесь завершения проверки файла."
        );

        return;
    }

    if (!selectedPresetId) {
        await showMessage(
            "Пресет не выбран",
            "Сначала выберите пресет для импорта."
        );

        return;
    }

    const formData =
        new FormData();

    selectedFiles.forEach(file => {
        formData.append("files", file);
    });

    formData.append("presetId", selectedPresetId);

    importButton.disabled = true;
    importButton.textContent =
        "Импорт...";

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

        if (!response.ok || responseData.success === false) {
            throw new Error(
                responseData.error ||
                responseData.title ||
                "Не удалось импортировать файл"
            );
        }

        const imports =
            responseData.data || [];

        const importResult =
            imports[imports.length - 1];

        if (!importResult || !importResult.success) {
            throw new Error(
                importResult?.error ||
                "Не удалось импортировать файл"
            );
        }

        const result =
            importResult.result;

        localStorage.setItem(
            "transactionsImported",
            "true"
        );

        renderImportResult(result);

        selectedFiles =
            [];

        previewIsReady =
            false;

        await showMessage(
            "Импорт завершён",
            "Транзакции успешно загружены."
        );

    } catch (error) {
        console.error(error);

        await showMessage(
            "Ошибка импорта",
            error.message || "Не удалось импортировать файл"
        );

    } finally {
        importButton.disabled = false;
        importButton.textContent =
            "Импортировать";
    }
}

function renderEmptyImportState() {
    transactionsCount.textContent = "—";
    incomeCount.textContent = "—";
    expenseCount.textContent = "—";
    periodText.innerHTML = "—";

    categoryTags.innerHTML = `
        <div class="tag gray-tag">
            —
        </div>
    `;

    tableBody.innerHTML = `
        <tr>
            <td colspan="4">
                —
            </td>
        </tr>
    `;
}


function renderPreviewState(file, preview) {
    transactionsCount.textContent = "—";
    incomeCount.textContent = "—";
    expenseCount.textContent = "—";

    periodText.innerHTML =
        "—";

    categoryTags.innerHTML = `
        <div class="tag gray-tag">
            —
        </div>
    `;

    tableBody.innerHTML = `
        <tr>
            <td colspan="4">
                —
            </td>
        </tr>
    `;
}

function resetImportState() {
    selectedFiles = [];
    previewIsReady = false;
    presetRecognitionMessage = "";
    renderPresetSelect();
    renderEmptyImportState();
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

            const currencySymbol =
                getCurrencySymbol(
                    transaction.currency || "RUB"
                );

            const formattedAmount =
                amount > 0
                    ? `+${amount.toLocaleString("ru-RU")} ${currencySymbol}`
                    : `${amount.toLocaleString("ru-RU")} ${currencySymbol}`;

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
        uploadMessageResolver =
            resolve;
    });
}

function closeMessage() {
    uploadMessageModal.hidden =
        true;

    if (uploadMessageResolver) {
        uploadMessageResolver();
        uploadMessageResolver = null;
    }
}

/*
    =========================
    УТИЛИТЫ
    =========================
*/

function getCurrencySymbol(currency) {
    const symbols = {
        RUB: "₽",
        USD: "$",
        EUR: "€"
    };

    return symbols[currency] || currency;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}