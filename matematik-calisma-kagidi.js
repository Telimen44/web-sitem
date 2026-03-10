
(function () {
    "use strict";

    const WORKSHEET_SITE_LABEL = "telimenegitim.com";

    const CLASS_LEVELS = [
        { value: "1", label: "1. Sınıf" },
        { value: "2", label: "2. Sınıf" },
        { value: "3", label: "3. Sınıf" },
        { value: "4", label: "4. Sınıf" }
    ];

    const TOPICS_BY_CLASS = {
        "1": ["ritmik-sayma", "onceki-sonraki", "aradaki-sayilar", "sayi-karsilastirma", "toplama", "cikarma"],
        "2": ["toplama", "cikarma", "ritmik-sayma", "sayi-karsilastirma", "carpma", "karisik-islemler"],
        "3": ["toplama", "cikarma", "carpma", "ritmik-sayma", "kesir-okuma", "karisik-islemler"],
        "4": ["toplama", "cikarma", "carpma", "bolme", "kesir-okuma", "karisik-islemler"]
    };

    const PRESET_OPTIONS = [
        { value: "kolay", label: "Kolay" },
        { value: "orta", label: "Orta" },
        { value: "zor", label: "Zor" },
        { value: "gunluk-tekrar", label: "Günlük Tekrar" },
        { value: "mini-yoklama", label: "Mini Yoklama" },
        { value: "odev-kagidi", label: "Ödev Kağıdı" }
    ];
    const DEFAULT_PRESET_ID = "orta";

    const LAYOUT_OPTIONS = [
        { value: "altalta", label: "Alt alta" },
        { value: "single", label: "Tek sütun" },
        { value: "double", label: "Çift sütun" }
    ];

    const GENERATION_TYPE_OPTIONS = [
        { value: "single", label: "Tek Etkinlik" },
        { value: "pack", label: "Çoklu Etkinlik Paketi" }
    ];

    const DIFFICULTY_FLOW_OPTIONS = [
        { value: "sabit", label: "Sabit" },
        { value: "kolaydan-zora", label: "Kolaydan zora" },
        { value: "karisik", label: "Karışık" },
        { value: "tekrar-paketi", label: "Tekrar paketi" }
    ];

    const ANSWER_KEY_MODE_OPTIONS = [
        { value: "yok", label: "Yok" },
        { value: "her-sayfadan-sonra", label: "Her sayfadan sonra" },
        { value: "sonda-toplu", label: "Sonda toplu" }
    ];

    const TOPIC_REGISTRY = {
        "ritmik-sayma": {
            label: "Ritmik Sayma",
            title: "Ritmik Sayma Çalışma Kağıdı",
            instruction: "Aşağıda verilen sayıları devam ettiriniz.",
            settings: [
                numberField("maxNumber", "En büyük sayı", 100, 20, 1000),
                numberField("step", "Kaçar gitsin", 5, 1, 20),
                selectField("direction", "Yön", [
                    { value: "forward", label: "İleri" },
                    { value: "backward", label: "Geri" }
                ], "forward"),
                numberField("questionCount", "Soru sayısı", 15, 5, 50),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateRhythmicCounting
        },
        "onceki-sonraki": {
            label: "Önceki / Sonraki Sayı",
            title: "Önceki ve Sonraki Sayı Çalışma Kağıdı",
            instruction: "Verilen sayılardan önceki ve sonraki sayıları yazınız.",
            settings: [
                numberField("maxNumber", "En büyük sayı", 100, 10, 1000),
                numberField("questionCount", "Soru sayısı", 16, 5, 50),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generatePreviousNext
        },
        "aradaki-sayilar": {
            label: "Aradaki Sayılar",
            title: "Aradaki Sayılar Çalışma Kağıdı",
            instruction: "Verilen sayıların arasında kalan sayıları yazınız.",
            settings: [
                numberField("maxNumber", "En büyük sayı", 120, 10, 1000),
                numberField("questionCount", "Soru sayısı", 16, 5, 50),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateBetweenNumbers
        },
        "sayi-karsilastirma": {
            label: "Sayı Karşılaştırma",
            title: "Sayı Karşılaştırma Çalışma Kağıdı",
            instruction: "Boşluğa uygun sembolü yazınız: >, < veya =",
            settings: [
                selectField("digitCount", "Kaç basamaklı", digitOptions(1, 4), "2"),
                numberField("questionCount", "Soru sayısı", 18, 5, 60),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateComparison
        },
        "toplama": {
            label: "Toplama İşlemi",
            title: "Toplama İşlemi Çalışma Kağıdı",
            instruction: "İşlemleri tamamlayınız.",
            settings: [
                selectField("digitCount", "Sayılar kaç basamaklı olsun?", digitOptions(1, 4), "2"),
                selectField("carryMode", "İşlem türü", [
                    { value: "eldesiz", label: "Eldesiz" },
                    { value: "eldeli", label: "Eldeli" },
                    { value: "mixed", label: "Karışık" }
                ], "eldesiz"),
                numberField("questionCount", "Soru sayısı", 24, 6, 80),
                selectField("layout", "İşlem düzeni", LAYOUT_OPTIONS, "altalta"),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateAddition
        },
        "cikarma": {
            label: "Çıkarma İşlemi",
            title: "Çıkarma İşlemi Çalışma Kağıdı",
            instruction: "İşlemleri tamamlayınız.",
            settings: [
                selectField("digitCount", "Sayılar kaç basamaklı olsun?", digitOptions(1, 4), "2"),
                selectField("borrowMode", "İşlem türü", [
                    { value: "bozmasiz", label: "Bozmasız" },
                    { value: "bozmali", label: "Onluk bozmalı" },
                    { value: "mixed", label: "Karışık" }
                ], "bozmasiz"),
                numberField("questionCount", "Soru sayısı", 24, 6, 80),
                selectField("layout", "İşlem düzeni", LAYOUT_OPTIONS, "altalta"),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateSubtraction
        },
        "carpma": {
            label: "Çarpma İşlemi",
            title: "Çarpma İşlemi Çalışma Kağıdı",
            instruction: "Çarpma işlemlerini tamamlayınız.",
            settings: [
                numberField("factorMax", "Çarpanlar kaça kadar olsun?", 10, 2, 20),
                numberField("questionCount", "Soru sayısı", 24, 6, 80),
                selectField("layout", "İşlem düzeni", LAYOUT_OPTIONS, "altalta"),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateMultiplication
        },
        "bolme": {
            label: "Bölme İşlemi",
            title: "Bölme İşlemi Çalışma Kağıdı",
            instruction: "Bölme işlemlerini tamamlayınız.",
            settings: [
                selectField("dividendDigits", "Bölünen kaç basamaklı olsun?", digitOptions(2, 5), "3"),
                selectField("divisorDigits", "Bölen kaç basamaklı olsun?", digitOptions(1, 2), "2"),
                selectField("remainderMode", "İşlemde kalan olsun mu?", [
                    { value: "kalanli", label: "Evet" },
                    { value: "kalansiz", label: "Hayır" }
                ], "kalansiz"),
                selectField("divisionStyle", "Bölme görünümü", [
                    { value: "short", label: "Kısa" },
                    { value: "long", label: "Uzun bölme" },
                    { value: "mixed", label: "Karışık" }
                ], "short"),
                numberField("questionCount", "Soru sayısı", 24, 6, 80),
                selectField("layout", "İşlem düzeni", LAYOUT_OPTIONS, "altalta"),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateDivision
        },
        "karisik-islemler": {
            label: "Karışık İşlemler",
            title: "Karışık İşlemler Çalışma Kağıdı",
            instruction: "Karışık işlemleri dikkatlice tamamlayınız.",
            settings: [
                numberField("questionCount", "Soru sayısı", 24, 8, 80),
                selectField("layout", "İşlem düzeni", LAYOUT_OPTIONS, "altalta"),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateMixedOperations
        },
        "kesir-okuma": {
            label: "Kesir Okuma",
            title: "Kesir Okuma Çalışma Kağıdı",
            instruction: "Verilen kesirleri yazıyla okuyunuz.",
            settings: [
                numberField("questionCount", "Soru sayısı", 18, 6, 40),
                checkboxField("includeMixed", "Tam sayılı kesirler olsun mu", false),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateFractionReading
        }
    };

    const form = document.getElementById("mkg-form");
    const classLevelSelect = document.getElementById("mkg-class-level");
    const topicSelect = document.getElementById("mkg-topic");
    const generationSettingsRoot = document.getElementById("mkg-generation-settings");
    const topicSettingsRoot = document.getElementById("mkg-topic-settings");
    const presetRoot = document.getElementById("mkg-presets");
    const previewRoot = document.getElementById("mkg-preview-root");
    const statusBox = document.getElementById("mkg-status");
    const regenerateButton = document.getElementById("mkg-regenerate");
    const printButton = document.getElementById("mkg-print");

    let lastWorksheet = null;
    let previewScaleFrame = 0;
    let selectedPresetId = null;
    let stickyFormState = {
        teacherName: "",
        showAnswerKey: true
    };
    let generationState = {
        generationType: "single",
        pageCount: 3,
        questionsPerPage: 24,
        difficultyFlow: "sabit",
        answerKeyMode: "sonda-toplu"
    };

    init();

    function init() {
        classLevelSelect.innerHTML = CLASS_LEVELS
            .map((entry) => `<option value="${entry.value}">${entry.label}</option>`)
            .join("");

        classLevelSelect.addEventListener("change", onClassChange);
        topicSelect.addEventListener("change", onTopicChange);
        presetRoot.addEventListener("click", onPresetClick);
        form.addEventListener("input", onFormInput);
        form.addEventListener("change", onFormChange);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            generateAndRender();
        });

        regenerateButton.addEventListener("click", function () {
            generateAndRender();
        });

        printButton.addEventListener("click", function () {
            window.print();
        });

        window.addEventListener("resize", queuePreviewScaleUpdate);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                if (lastWorksheet) {
                    renderWorksheet(lastWorksheet);
                    return;
                }
                queuePreviewScaleUpdate();
            });
        }

        renderPresetButtons();
        onClassChange();
        queuePreviewScaleUpdate();
    }

    function onClassChange() {
        rememberStickyFields();
        const classLevel = classLevelSelect.value;
        const topicIds = TOPICS_BY_CLASS[classLevel] || [];
        const previousTopic = topicSelect.value;

        topicSelect.innerHTML = topicIds
            .map((topicId) => `<option value="${topicId}">${TOPIC_REGISTRY[topicId].label}</option>`)
            .join("");

        if (topicIds.includes(previousTopic)) {
            topicSelect.value = previousTopic;
        }

        onTopicChange();
    }

    function onTopicChange() {
        rememberStickyFields();
        syncGenerationStateForTopic();
        const topic = TOPIC_REGISTRY[topicSelect.value];
        if (!topic) {
            generationSettingsRoot.innerHTML = "";
            topicSettingsRoot.innerHTML = "";
            return;
        }

        renderGenerationSettings();
        topicSettingsRoot.innerHTML = topic.settings.map(renderField).join("");
        applySmartDefaults(classLevelSelect.value, topicSelect.value, selectedPresetId);
        renderPresetButtons();
        statusBox.textContent = "";
    }

    function onFormInput() {
        rememberStickyFields();
        rememberGenerationSettings();
    }

    function onFormChange(event) {
        rememberStickyFields();
        rememberGenerationSettings();

        if (event.target && event.target.id === "mkg-field-generationType") {
            renderGenerationSettings();
            statusBox.textContent = "";
        }
    }

    function renderGenerationSettings() {
        const topic = TOPIC_REGISTRY[topicSelect.value];
        if (!topic) {
            generationSettingsRoot.innerHTML = "";
            return;
        }

        const generationFields = getGenerationFieldDefinitions(topic);
        const modeField = generationFields[0];
        const packFields = generationFields.slice(1);
        const packFieldsHtml = generationState.generationType === "pack"
            ? `
                <div class="mkg-generation-box">
                    <h3>Paket Ayarları</h3>
                    <p class="mkg-pack-note">Paket modunda her sayfa ayrı etkinlik sayfası gibi üretilir. Cevap anahtarı düzeni bu bölümden yönetilir.</p>
                    ${packFields.map(renderField).join("")}
                </div>
            `
            : "";

        generationSettingsRoot.innerHTML = `
            <div class="mkg-generation-box">
                <h3>Üretim Türü</h3>
                ${renderField(modeField)}
            </div>
            ${packFieldsHtml}
        `;

        generationFields.forEach(function (field) {
            const stateValue = generationState[field.id];
            if (stateValue !== undefined && stateValue !== null && stateValue !== "") {
                setFieldValue(field.id, stateValue);
            }
        });
    }

    function getGenerationFieldDefinitions(topic) {
        return [
            selectField("generationType", "Üretim türü", GENERATION_TYPE_OPTIONS, generationState.generationType || "single"),
            numberField("pageCount", "Kaç sayfa oluşturulsun?", generationState.pageCount || 3, 2, 10),
            numberField("questionsPerPage", "Her sayfada kaç soru olsun?", generationState.questionsPerPage || getDefaultQuestionsPerPage(topic), 6, 60),
            selectField("difficultyFlow", "Zorluk akışı", DIFFICULTY_FLOW_OPTIONS, generationState.difficultyFlow || "sabit"),
            selectField("answerKeyMode", "Cevap anahtarı düzeni", ANSWER_KEY_MODE_OPTIONS, generationState.answerKeyMode || "sonda-toplu")
        ];
    }

    function syncGenerationStateForTopic() {
        const topic = TOPIC_REGISTRY[topicSelect.value];
        const topicDefault = getDefaultQuestionsPerPage(topic);

        if (!Number.isFinite(Number(generationState.questionsPerPage))) {
            generationState.questionsPerPage = topicDefault;
            return;
        }

        generationState.questionsPerPage = clamp(Number(generationState.questionsPerPage) || topicDefault, 6, 60);
    }

    function rememberGenerationSettings() {
        const topic = TOPIC_REGISTRY[topicSelect.value];
        const generationFields = getGenerationFieldDefinitions(topic || { settings: [] });

        generationFields.forEach(function (field) {
            const input = document.getElementById(`mkg-field-${field.id}`);
            if (!input) {
                return;
            }

            if (field.type === "number") {
                const numericValue = Number.parseInt(input.value, 10);
                generationState[field.id] = Number.isFinite(numericValue) ? numericValue : field.default;
                return;
            }

            generationState[field.id] = field.type === "checkbox"
                ? input.checked
                : String(input.value || "").trim();
        });
    }

    function getDefaultQuestionsPerPage(topic) {
        if (!topic || !Array.isArray(topic.settings)) {
            return 24;
        }

        const questionField = topic.settings.find(function (field) {
            return field.id === "questionCount";
        });
        return questionField ? questionField.default : 24;
    }

    function renderPresetButtons() {
        presetRoot.innerHTML = `
            <div class="mkg-preset-head">
                <span>Hızlı Hazır Modlar</span>
                <small>${escapeHtml(getPresetSummaryText(selectedPresetId))}</small>
            </div>
            <div class="mkg-preset-grid">
                ${PRESET_OPTIONS.map((preset) => `
                    <button
                        type="button"
                        class="mkg-preset-btn ${preset.value === selectedPresetId ? "is-active" : ""}"
                        data-preset="${escapeHtml(preset.value)}"
                    >
                        ${escapeHtml(preset.label)}
                    </button>
                `).join("")}
            </div>
        `;
    }

    function onPresetClick(event) {
        const button = event.target.closest("[data-preset]");
        if (!button) {
            return;
        }

        rememberStickyFields();
        const clickedPresetId = button.getAttribute("data-preset") || "";
        if (clickedPresetId === selectedPresetId) {
            selectedPresetId = null;
            renderPresetButtons();
            statusBox.textContent = "Hazır mod kaldırıldı. Mevcut ayarlar korunuyor.";
            return;
        }

        selectedPresetId = clickedPresetId || null;
        applySmartDefaults(classLevelSelect.value, topicSelect.value, selectedPresetId);
        if (stickyFormState.teacherName) {
            setFieldValue("teacherName", stickyFormState.teacherName);
        }
        setFieldValue("showAnswerKey", stickyFormState.showAnswerKey);
        renderPresetButtons();
        statusBox.textContent = `${getPresetLabel(selectedPresetId)} ayarları uygulandı.`;
    }

    function getPresetLabel(presetId) {
        if (!presetId) {
            return "Hazır mod yok";
        }
        const preset = PRESET_OPTIONS.find((entry) => entry.value === presetId);
        return preset ? preset.label : "Orta";
    }

    function getPresetSummaryText(presetId) {
        return presetId ? `${getPresetLabel(presetId)} seçili` : "İsteğe bağlı";
    }

    function applySmartDefaults(classLevel, topicId, presetId) {
        const topic = TOPIC_REGISTRY[topicId];
        if (!topic) {
            return;
        }

        const values = Object.assign(
            getTopicDefaultValues(topic),
            buildPresetValues(classLevel, topicId, presetId)
        );
        if (stickyFormState.teacherName) {
            values.teacherName = stickyFormState.teacherName;
        }
        values.showAnswerKey = stickyFormState.showAnswerKey;

        Object.keys(values).forEach(function (fieldId) {
            setFieldValue(fieldId, values[fieldId]);
        });

        rememberStickyFields();
    }

    function rememberStickyFields() {
        const teacherInput = document.getElementById("mkg-field-teacherName");
        const answerKeyInput = document.getElementById("mkg-field-showAnswerKey");

        if (teacherInput) {
            stickyFormState.teacherName = teacherInput.value;
        }

        if (answerKeyInput) {
            stickyFormState.showAnswerKey = answerKeyInput.checked;
        }
    }

    function getTopicDefaultValues(topic) {
        return topic.settings.reduce(function (acc, field) {
            acc[field.id] = field.default;
            return acc;
        }, {});
    }

    function buildPresetValues(classLevel, topicId, presetId) {
        if (!presetId) {
            return {};
        }

        const profile = getPresetProfile(presetId);
        const difficulty = profile.difficulty;
        const values = {
            questionCount: getSuggestedQuestionCount(topicId, profile)
        };

        if (topicId === "ritmik-sayma") {
            const baseStep = clamp(Number(classLevel) + difficulty + 1, 2, 12);
            values.maxNumber = [60, 120, 250, 500][Math.max(0, Number(classLevel) - 1)] || 120;
            values.maxNumber += difficulty * 40;
            values.step = presetId === "gunluk-tekrar" ? Math.max(2, baseStep - 1) : baseStep;
            values.direction = difficulty >= 2 ? "backward" : "forward";
            return values;
        }

        if (topicId === "onceki-sonraki" || topicId === "aradaki-sayilar") {
            values.maxNumber = [40, 120, 300, 600][Math.max(0, Number(classLevel) - 1)] || 120;
            values.maxNumber += difficulty * 60;
            return values;
        }

        if (topicId === "sayi-karsilastirma") {
            values.digitCount = String(getComparisonDigitCount(classLevel, difficulty));
            return values;
        }

        if (topicId === "toplama") {
            values.digitCount = String(getArithmeticDigitCount(classLevel, difficulty, "addition"));
            values.carryMode = ["eldesiz", "mixed", "eldeli"][difficulty];
            values.layout = "altalta";
            return values;
        }

        if (topicId === "cikarma") {
            values.digitCount = String(getArithmeticDigitCount(classLevel, difficulty, "subtraction"));
            values.borrowMode = ["bozmasiz", "mixed", "bozmali"][difficulty];
            values.layout = "altalta";
            return values;
        }

        if (topicId === "carpma") {
            values.factorMax = getMultiplicationFactorMax(classLevel, difficulty, presetId);
            values.layout = difficulty >= 2 ? "double" : "altalta";
            return values;
        }

        if (topicId === "bolme") {
            const divisionDefaults = getDivisionPresetValues(classLevel, difficulty, presetId);
            values.dividendDigits = divisionDefaults.dividendDigits;
            values.divisorDigits = divisionDefaults.divisorDigits;
            values.remainderMode = divisionDefaults.remainderMode;
            values.divisionStyle = divisionDefaults.divisionStyle;
            values.layout = "altalta";
            return values;
        }

        if (topicId === "kesir-okuma") {
            values.includeMixed = Number(classLevel) >= 4 && difficulty >= 1;
            return values;
        }

        if (topicId === "karisik-islemler") {
            values.layout = difficulty >= 2 ? "double" : "altalta";
            return values;
        }

        return values;
    }

    function getPresetProfile(presetId) {
        if (presetId === "kolay") {
            return { difficulty: 0, volume: "medium" };
        }
        if (presetId === "zor") {
            return { difficulty: 2, volume: "medium" };
        }
        if (presetId === "gunluk-tekrar") {
            return { difficulty: 0, volume: "short" };
        }
        if (presetId === "mini-yoklama") {
            return { difficulty: 1, volume: "short" };
        }
        if (presetId === "odev-kagidi") {
            return { difficulty: 2, volume: "long" };
        }
        return { difficulty: 1, volume: "medium" };
    }

    function getSuggestedQuestionCount(topicId, profile) {
        const isOperationTopic = topicId === "toplama"
            || topicId === "cikarma"
            || topicId === "carpma"
            || topicId === "bolme"
            || topicId === "karisik-islemler";
        const baseCounts = isOperationTopic
            ? { short: 12, medium: 24, long: 32 }
            : { short: 10, medium: 18, long: 24 };
        return baseCounts[profile.volume] || baseCounts.medium;
    }

    function getArithmeticDigitCount(classLevel, difficulty, operationKind) {
        const matrix = operationKind === "subtraction"
            ? {
                "1": [1, 1, 2],
                "2": [2, 2, 3],
                "3": [2, 3, 4],
                "4": [3, 4, 4]
            }
            : {
                "1": [1, 2, 2],
                "2": [2, 2, 3],
                "3": [2, 3, 4],
                "4": [3, 4, 4]
            };
        const digits = matrix[classLevel] || matrix["2"];
        return digits[clamp(difficulty, 0, 2)];
    }

    function getComparisonDigitCount(classLevel, difficulty) {
        const matrix = {
            "1": [1, 1, 2],
            "2": [2, 2, 3],
            "3": [2, 3, 4],
            "4": [3, 4, 4]
        };
        const digits = matrix[classLevel] || matrix["2"];
        return digits[clamp(difficulty, 0, 2)];
    }

    function getMultiplicationFactorMax(classLevel, difficulty, presetId) {
        const matrix = {
            "2": [5, 5, 8],
            "3": [6, 10, 12],
            "4": [10, 12, 20]
        };
        const values = matrix[classLevel] || matrix["3"];
        if (presetId === "gunluk-tekrar") {
            return values[0];
        }
        return values[clamp(difficulty, 0, 2)];
    }

    function getDivisionPresetValues(classLevel, difficulty, presetId) {
        if (classLevel !== "4") {
            return {
                dividendDigits: "2",
                divisorDigits: "1",
                remainderMode: "kalansiz",
                divisionStyle: "short"
            };
        }

        if (presetId === "gunluk-tekrar") {
            return {
                dividendDigits: "2",
                divisorDigits: "1",
                remainderMode: "kalansiz",
                divisionStyle: "short"
            };
        }

        if (presetId === "mini-yoklama") {
            return {
                dividendDigits: "3",
                divisorDigits: "1",
                remainderMode: "kalansiz",
                divisionStyle: "short"
            };
        }

        if (presetId === "odev-kagidi" || difficulty >= 2) {
            return {
                dividendDigits: "3",
                divisorDigits: "2",
                remainderMode: "kalanli",
                divisionStyle: "long"
            };
        }

        return {
            dividendDigits: "3",
            divisorDigits: "1",
            remainderMode: "kalansiz",
            divisionStyle: "short"
        };
    }

    function generateAndRender() {
        const topicId = topicSelect.value;
        const topic = TOPIC_REGISTRY[topicId];
        if (!topic) {
            return;
        }

        const classLevel = classLevelSelect.value;
        rememberGenerationSettings();
        const generationSettings = collectSettings(getActiveGenerationFields());
        const topicSettings = collectSettings(topic.settings);
        const settings = Object.assign({}, generationSettings, topicSettings);

        const context = {
            classLevel,
            topicId,
            topicLabel: topic.label,
            title: topic.title,
            instruction: topic.instruction,
            settings,
            presetId: selectedPresetId
        };
        const result = generateWorksheetBundle(topic, context);
        const requestedQuestionCount = settings.generationType === "pack"
            ? settings.pageCount * settings.questionsPerPage
            : settings.questionCount;

        if (!result.questions.length) {
            statusBox.textContent = "Bu ayarlarla soru üretilemedi. Lütfen seçenekleri değiştirin.";
            return;
        }

        if (result.questions.length < requestedQuestionCount) {
            statusBox.textContent = "Benzersiz soru havuzu sınırlı olduğu için daha az soru üretildi.";
        } else if (result.mode === "pack") {
            statusBox.textContent = `${result.pages.length} sayfalık etkinlik paketi hazır.`;
        } else {
            statusBox.textContent = "Çalışma kağıdı hazır.";
        }

        lastWorksheet = result;
        regenerateButton.disabled = false;
        renderWorksheet(result);
    }

    function getActiveGenerationFields() {
        const topic = TOPIC_REGISTRY[topicSelect.value];
        const generationFields = getGenerationFieldDefinitions(topic);
        if (generationState.generationType === "pack") {
            return generationFields;
        }
        return generationFields.slice(0, 1);
    }

    function generateWorksheetBundle(topic, context) {
        if (context.settings.generationType !== "pack") {
            return ensureWorksheetBundle(topic.generator(context), context);
        }

        return buildWorksheetPack(topic, context);
    }

    function collectSettings(fields) {
        const data = {};
        fields.forEach((field) => {
            const input = document.getElementById(`mkg-field-${field.id}`);
            if (!input) {
                return;
            }

            if (field.type === "checkbox") {
                data[field.id] = input.checked;
                return;
            }

            if (field.type === "number") {
                const numericValue = Number.parseInt(input.value, 10);
                if (Number.isFinite(numericValue)) {
                    const min = field.min != null ? field.min : numericValue;
                    const max = field.max != null ? field.max : numericValue;
                    data[field.id] = clamp(numericValue, min, max);
                } else {
                    data[field.id] = field.default;
                }
                input.value = data[field.id];
                return;
            }

            data[field.id] = String(input.value || "").trim();
        });
        return data;
    }

    function renderWorksheet(worksheet) {
        const bundle = ensureWorksheetBundle(worksheet, {
            classLevel: classLevelSelect.value,
            topicId: worksheet.topicId,
            topicLabel: worksheet.topicLabel,
            title: worksheet.title,
            instruction: worksheet.instruction,
            settings: worksheet.settings,
            presetId: worksheet.presetId
        });
        const previewPages = [];
        const questionSections = Array.isArray(bundle.pages) ? bundle.pages : [];
        const answerSections = Array.isArray(bundle.answerKeyPages) ? bundle.answerKeyPages : [];

        questionSections.forEach(function (page) {
            const questionLayout = createQuestionLayoutModel(page);
            const questionPages = paginateLayout(questionLayout, function (rowsHtml, pageIndex) {
                return renderQuestionPage(bundle, page, questionLayout, rowsHtml, pageIndex);
            });
            previewPages.push.apply(previewPages, questionPages);

            if (bundle.answerKeyMode === "her-sayfadan-sonra") {
                const answerSection = answerSections.find(function (section) {
                    return section.sourcePageNumber === page.logicalPageNumber;
                });
                if (answerSection) {
                    previewPages.push.apply(previewPages, createRenderedAnswerPages(bundle, answerSection));
                }
            }
        });

        if (bundle.answerKeyMode === "sonda-toplu") {
            answerSections.forEach(function (section) {
                previewPages.push.apply(previewPages, createRenderedAnswerPages(bundle, section));
            });
        }

        previewRoot.innerHTML = `
            <div class="mkg-page-stack">
                ${previewPages.map(renderPreviewPageFrame).join("")}
            </div>
        `;
        previewRoot.scrollTop = 0;
        previewRoot.scrollLeft = 0;
        queuePreviewScaleUpdate();
    }

    function createRenderedAnswerPages(bundle, answerSection) {
        const answerLayout = createAnswerLayoutModel(answerSection);
        return paginateLayout(answerLayout, function (rowsHtml, pageIndex) {
            return renderAnswerPage(bundle, answerSection, answerLayout, rowsHtml, pageIndex);
        });
    }

    function renderQuestion(question, index, layout) {
        if (question.type === "operation" && layout === "altalta") {
            const displayOperator = question.operator === "-" ? "−" : question.operator;
            const widthChars = clamp(Math.max(
                String(question.a).length,
                String(question.b).length
            ) + 1, 3, 6);
            return `
                <div class="mkg-question mkg-question-operation">
                    <div class="mkg-question-number">${index})</div>
                    <div class="mkg-op-stack" style="--mkg-op-width:${widthChars}ch">
                        <div class="mkg-op-row">
                            <span class="mkg-op-sign" aria-hidden="true">&nbsp;</span>
                            <span class="mkg-op-value">${escapeHtml(String(question.a))}</span>
                        </div>
                        <div class="mkg-op-row">
                            <span class="mkg-op-sign">${escapeHtml(displayOperator)}</span>
                            <span class="mkg-op-value">${escapeHtml(String(question.b))}</span>
                        </div>
                        <div class="mkg-op-answer-line" aria-hidden="true"></div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="mkg-question">
                <div class="mkg-question-number">${index})</div>
                <div class="mkg-question-text">${escapeHtml(question.text)}</div>
            </div>
        `;
    }

    function createQuestionLayoutModel(worksheet) {
        if (window.MathWorksheetGrid && typeof window.MathWorksheetGrid.createLayoutModel === "function") {
            return window.MathWorksheetGrid.createLayoutModel({
                questions: worksheet.questions,
                questionCount: worksheet.questions.length,
                layout: worksheet.layout,
                topicId: worksheet.topicId,
                escapeHtml
            });
        }

        return {
            sectionClassName: "mkg-question-grid",
            sectionStyle: "",
            rowsHtml: worksheet.questions.map(function (question, index) {
                return renderQuestion(question, index + 1, worksheet.layout);
            })
        };
    }

    function createAnswerLayoutModel(answerSection) {
        const questions = answerSection.questions;
        const rowsHtml = [];
        const columns = getAnswerKeyColumnCount(answerSection.topicId);

        for (let index = 0; index < questions.length; index += columns) {
            const rowItems = questions.slice(index, index + columns);
            const cells = rowItems.map(function (question, offset) {
                return renderAnswerCell(question, index + offset + 1);
            });

            while (cells.length < columns) {
                cells.push('<div class="mkg-answer-cell mkg-answer-cell-empty" aria-hidden="true"></div>');
            }

            rowsHtml.push(`
                <div class="mkg-answer-row">
                    ${cells.join("")}
                </div>
            `);
        }

        return {
            sectionClassName: "mkg-answer-grid",
            sectionStyle: `--mkg-answer-cols:${columns}`,
            rowsHtml
        };
    }

    function renderAnswerCell(question, index) {
        const display = formatAnswerKeyContent(question);
        return `
            <div class="mkg-answer-cell">
                <div class="mkg-answer-item">
                    <span class="mkg-answer-number">${index})</span>
                    <span class="mkg-answer-text">${display}</span>
                </div>
            </div>
        `;
    }

    function getAnswerKeyColumnCount(topicId) {
        if (topicId === "bolme" || topicId === "kesir-okuma" || topicId === "ritmik-sayma") {
            return 2;
        }
        if (topicId === "karisik-islemler") {
            return 2;
        }
        return 3;
    }

    function formatAnswerKeyContent(question) {
        if (!question) {
            return "";
        }

        if (question.type === "comparison") {
            return `${escapeHtml(String(question.left))} ${escapeHtml(question.answer)} ${escapeHtml(String(question.right))}`;
        }

        if (question.type === "fraction-reading") {
            return `${escapeHtml(formatFractionPrompt(question))} = ${escapeHtml(question.answer)}`;
        }

        if (question.type === "rhythmic-sequence") {
            return escapeHtml(question.answer);
        }

        if (question.type === "prev-next-box") {
            return `${escapeHtml(String(question.middleValue))} → ${escapeHtml(question.answer)}`;
        }

        if (question.type === "between-box") {
            return `${escapeHtml(String(question.leftValue))} _ ${escapeHtml(String(question.rightValue))} → ${escapeHtml(question.answer)}`;
        }

        if (question.type === "operation") {
            const operator = question.operator === "-" ? "−" : question.operator;
            return `${escapeHtml(String(question.a))} ${escapeHtml(operator)} ${escapeHtml(String(question.b))} = ${escapeHtml(question.answer)}`;
        }

        return escapeHtml(question.answer);
    }

    function formatFractionPrompt(question) {
        if (!question) {
            return "";
        }
        if (question.whole) {
            return `${question.whole} ${question.numerator}/${question.denominator}`;
        }
        return `${question.numerator}/${question.denominator}`;
    }

    function paginateLayout(layoutModel, buildPageHtml) {
        if (!layoutModel || !Array.isArray(layoutModel.rowsHtml) || !layoutModel.rowsHtml.length) {
            return [];
        }

        const measureRoot = ensureMeasureRoot();
        const pages = [];
        let cursor = 0;
        let pageIndex = 0;

        while (cursor < layoutModel.rowsHtml.length) {
            const measurePage = createElementFromHtml(buildPageHtml([], pageIndex));
            measureRoot.replaceChildren(measurePage);

            const blockContainer = measurePage.querySelector("[data-mkg-block-container]");
            if (!blockContainer) {
                pages.push(buildPageHtml(layoutModel.rowsHtml.slice(cursor), pageIndex));
                break;
            }
            const pageRows = [];

            while (cursor < layoutModel.rowsHtml.length) {
                const blockNode = appendHtmlBlock(blockContainer, layoutModel.rowsHtml[cursor]);
                const overflowed = isPageOverflowing(measurePage);

                if (overflowed && pageRows.length > 0) {
                    blockNode.remove();
                    break;
                }

                pageRows.push(layoutModel.rowsHtml[cursor]);
                cursor += 1;

                if (overflowed) {
                    break;
                }
            }

            pages.push(buildPageHtml(pageRows, pageIndex));
            pageIndex += 1;
        }

        measureRoot.replaceChildren();
        return pages;
    }

    function renderQuestionPage(bundle, page, layoutModel, rowsHtml, pageIndex) {
        const headerHtml = pageIndex === 0 ? renderWorksheetHeader(bundle, page) : renderContinuationHeader(page);

        return `
            <article class="mkg-sheet mkg-sheet--worksheet">
                <div class="mkg-sheet-page" data-mkg-page-inner>
                    <div class="mkg-sheet-main">
                        ${headerHtml}
                        ${renderSection(layoutModel, rowsHtml, 'data-mkg-block-container')}
                    </div>
                    ${renderSheetFooter()}
                </div>
            </article>
        `;
    }

    function renderAnswerPage(bundle, answerSection, answerLayout, rowsHtml, pageIndex) {
        const sourceLabel = answerSection.sourceLabel
            ? `<p class="mkg-answer-source">${escapeHtml(answerSection.sourceLabel)}</p>`
            : "";
        return `
            <article class="mkg-sheet mkg-sheet--answer">
                <div class="mkg-sheet-page" data-mkg-page-inner>
                    <div class="mkg-sheet-main">
                        <header class="mkg-sheet-header mkg-sheet-header--answer">
                            <p class="mkg-sheet-kicker">${bundle.mode === "pack" ? "Etkinlik Paketi" : "Çalışma Kağıdı"}</p>
                            <h2>${pageIndex === 0 ? "Cevap Anahtarı" : "Cevap Anahtarı (Devam)"}</h2>
                            ${sourceLabel}
                        </header>
                        ${renderSection(answerLayout, rowsHtml, 'data-mkg-block-container')}
                    </div>
                    ${renderSheetFooter()}
                </div>
            </article>
        `;
    }

    function renderWorksheetHeader(bundle, page) {
        const teacherLine = bundle.settings.teacherName
            ? `<div class="mkg-meta-line mkg-meta-line--teacher">Öğretmen: ${escapeHtml(bundle.settings.teacherName)}</div>`
            : "";
        const packMetaLine = bundle.mode === "pack"
            ? `
                <div class="mkg-meta-line mkg-meta-line--pack">
                    <span>${escapeHtml(page.pageLabel || `Paket sayfası ${page.logicalPageNumber}`)}</span>
                    <span>${escapeHtml(page.difficultyLabel || "Sabit akış")}</span>
                </div>
            `
            : "";
        const kicker = bundle.mode === "pack"
            ? '<p class="mkg-sheet-kicker">Çoklu Etkinlik Paketi</p>'
            : '<p class="mkg-sheet-kicker">Tek Etkinlik</p>';

        return `
            <header class="mkg-sheet-header">
                ${kicker}
                <h2>${escapeHtml(page.pageTitle || bundle.title)}</h2>
                <div class="mkg-meta-line">
                    <span>Öğrenci Adı: ____________________</span>
                    <span>Tarih: ____ / ____ / ______</span>
                </div>
                ${packMetaLine}
                ${teacherLine}
                <p class="mkg-instruction">${escapeHtml(page.instruction || bundle.instruction)}</p>
            </header>
        `;
    }

    function renderContinuationHeader(page) {
        return `
            <header class="mkg-sheet-header">
                <p class="mkg-sheet-kicker">${escapeHtml(page.pageLabel || "Devam sayfası")}</p>
                <h2>${escapeHtml(page.pageTitle || "Çalışma Kağıdı")} (Devam)</h2>
            </header>
        `;
    }

    function renderSheetFooter() {
        return `<footer class="mkg-sheet-footer">${escapeHtml(WORKSHEET_SITE_LABEL)}</footer>`;
    }

    function renderSection(layoutModel, rowsHtml, extraAttributes) {
        const styleAttr = layoutModel.sectionStyle ? ` style="${layoutModel.sectionStyle}"` : "";
        const attrText = extraAttributes ? ` ${extraAttributes}` : "";

        return `
            <section class="${layoutModel.sectionClassName}"${styleAttr}${attrText}>
                ${rowsHtml.join("")}
            </section>
        `;
    }

    function renderPreviewPageFrame(pageHtml) {
        return `<div class="mkg-page-frame">${pageHtml}</div>`;
    }

    function ensureMeasureRoot() {
        let measureRoot = document.getElementById("mkg-measure-root");
        if (!measureRoot) {
            measureRoot = document.createElement("div");
            measureRoot.id = "mkg-measure-root";
            measureRoot.className = "mkg-measure-root";
            document.body.appendChild(measureRoot);
        }
        return measureRoot;
    }

    function createElementFromHtml(html) {
        const template = document.createElement("template");
        template.innerHTML = String(html || "").trim();
        return template.content.firstElementChild;
    }

    function appendHtmlBlock(container, html) {
        const block = createElementFromHtml(html);
        if (!block) {
            return document.createElement("div");
        }
        container.appendChild(block);
        return block;
    }

    function isPageOverflowing(pageElement) {
        const pageInner = pageElement.querySelector("[data-mkg-page-inner]");
        if (!pageInner) {
            return false;
        }
        return pageInner.scrollHeight > pageInner.clientHeight + 1;
    }

    function queuePreviewScaleUpdate() {
        if (previewScaleFrame) {
            window.cancelAnimationFrame(previewScaleFrame);
        }

        previewScaleFrame = window.requestAnimationFrame(function () {
            previewScaleFrame = 0;
            updatePreviewScale();
        });
    }

    function updatePreviewScale() {
        const sheet = previewRoot.querySelector(".mkg-sheet");
        if (!sheet) {
            previewRoot.style.setProperty("--mkg-preview-scale", "1");
            return;
        }

        const availableWidth = Math.max(previewRoot.clientWidth - 4, 0);
        const pageWidth = sheet.offsetWidth || availableWidth || 1;
        const scale = availableWidth > 0 ? Math.min(1, availableWidth / pageWidth) : 1;
        previewRoot.style.setProperty("--mkg-preview-scale", scale.toFixed(4));
    }

    function renderField(field) {
        const inputId = `mkg-field-${field.id}`;

        if (field.type === "select") {
            const options = field.options
                .map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === field.default ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
                .join("");

            return `
                <div class="mkg-field">
                    <label for="${inputId}">${escapeHtml(field.label)}</label>
                    <select id="${inputId}" name="${escapeHtml(field.id)}">${options}</select>
                </div>
            `;
        }

        if (field.type === "checkbox") {
            return `
                <div class="mkg-field">
                    <label for="${inputId}">${escapeHtml(field.label)}</label>
                    <label class="mkg-checkbox-wrap" for="${inputId}">
                        <input type="checkbox" id="${inputId}" name="${escapeHtml(field.id)}" ${field.default ? "checked" : ""}>
                        <span>Evet</span>
                    </label>
                </div>
            `;
        }

        const inputType = field.type === "number" ? "number" : "text";
        const minAttr = field.min != null ? `min="${field.min}"` : "";
        const maxAttr = field.max != null ? `max="${field.max}"` : "";
        const stepAttr = field.step != null ? `step="${field.step}"` : "";
        const placeholder = field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : "";
        const value = field.default != null ? `value="${escapeHtml(String(field.default))}"` : "";

        return `
            <div class="mkg-field">
                <label for="${inputId}">${escapeHtml(field.label)}</label>
                <input id="${inputId}" name="${escapeHtml(field.id)}" type="${inputType}" ${minAttr} ${maxAttr} ${stepAttr} ${placeholder} ${value}>
            </div>
        `;
    }

    function generateRhythmicCounting(context) {
        const boxCount = 10;
        const givenCount = 3;
        const maxNumber = Math.max(context.settings.maxNumber, 20);
        const step = Math.max(context.settings.step, 1);
        const direction = context.settings.direction === "backward" ? "backward" : "forward";
        const questionCount = context.settings.questionCount;

        const questions = generateUnique(questionCount, function () {
            if (direction === "backward") {
                const minStart = step * (boxCount - 1);
                const maxStart = maxNumber;
                if (maxStart < minStart) {
                    return null;
                }
                const start = randomInt(minStart, maxStart);
                const values = Array.from({ length: boxCount }, function (_, idx) {
                    return start - (idx * step);
                });
                return {
                    type: "rhythmic-sequence",
                    cells: values.map(function (value, idx) {
                        return idx < givenCount ? value : "";
                    }),
                    text: values.map(function (value, idx) {
                        return idx < givenCount ? String(value) : "___";
                    }).join(" | "),
                    answer: values.slice(givenCount).join(", "),
                    key: `b|${start}|${step}`
                };
            }

            const maxStart = maxNumber - (step * (boxCount - 1));
            if (maxStart < 0) {
                return null;
            }
            const start = randomInt(0, maxStart);
            const values = Array.from({ length: boxCount }, function (_, idx) {
                return start + (idx * step);
            });
            return {
                type: "rhythmic-sequence",
                cells: values.map(function (value, idx) {
                    return idx < givenCount ? value : "";
                }),
                text: values.map(function (value, idx) {
                    return idx < givenCount ? String(value) : "___";
                }).join(" | "),
                answer: values.slice(givenCount).join(", "),
                key: `f|${start}|${step}`
            };
        });

        return buildWorksheet(context, questions, "single");
    }

    function generatePreviousNext(context) {
        const maxNumber = Math.max(context.settings.maxNumber, 12);
        const count = context.settings.questionCount;
        const questions = generateUnique(count, function () {
            const value = randomInt(1, maxNumber - 1);
            return {
                type: "prev-next-box",
                middleValue: value,
                text: `___ | ${value} | ___`,
                answer: `${value - 1}, ${value + 1}`,
                key: String(value)
            };
        });

        return buildWorksheet(context, questions, "single");
    }

    function generateBetweenNumbers(context) {
        const maxNumber = Math.max(context.settings.maxNumber, 8);
        const count = context.settings.questionCount;
        const questions = generateUnique(count, function () {
            if (maxNumber < 3) {
                return null;
            }
            const start = randomInt(1, maxNumber - 2);
            const end = start + 2;
            return {
                type: "between-box",
                leftValue: start,
                rightValue: end,
                text: `${start} | ___ | ${end}`,
                answer: `${start + 1}`,
                key: `${start}|${end}`
            };
        });

        return buildWorksheet(context, questions, "single");
    }

    function generateComparison(context) {
        const digits = Number.parseInt(context.settings.digitCount, 10) || 2;
        const count = context.settings.questionCount;
        const range = getDigitRange(digits);
        const signs = buildSignPattern(count);
        const usedKeys = new Set();
        const questions = [];

        for (let i = 0; i < signs.length; i += 1) {
            const sign = signs[i];
            let attempts = 0;
            while (attempts < 150) {
                attempts += 1;
                const pair = createComparisonPair(sign, range.min, range.max);
                const key = `${pair.left}|${pair.right}`;
                if (usedKeys.has(key)) {
                    continue;
                }
                usedKeys.add(key);
                questions.push({
                    type: "comparison",
                    left: pair.left,
                    right: pair.right,
                    text: `${pair.left} ___ ${pair.right}`,
                    answer: sign,
                    key
                });
                break;
            }
        }

        return buildWorksheet(context, questions, "single");
    }

    function generateAddition(context) {
        const digits = Number.parseInt(context.settings.digitCount, 10) || 2;
        const carryMode = normalizeMode(context.settings.carryMode, "eldesiz", "eldeli");
        const count = context.settings.questionCount;
        const range = getDigitRange(digits);
        const mixedPattern = carryMode === "mixed" ? buildMixedPattern(count) : [];
        const seen = new Set();
        const questions = [];

        for (let index = 0; index < count; index += 1) {
            const requireCarry = carryMode === "mixed"
                ? mixedPattern[index]
                : carryMode === "eldeli";

            const question = createAdditionQuestion(range, requireCarry, seen);
            if (!question) {
                break;
            }

            questions.push(question);
        }

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateSubtraction(context) {
        const digits = Number.parseInt(context.settings.digitCount, 10) || 2;
        const borrowMode = normalizeMode(context.settings.borrowMode, "bozmasiz", "bozmali");
        const count = context.settings.questionCount;
        const range = getDigitRange(digits);
        const mixedPattern = borrowMode === "mixed" ? buildMixedPattern(count) : [];
        const seen = new Set();
        const questions = [];

        for (let index = 0; index < count; index += 1) {
            const requireBorrow = borrowMode === "mixed"
                ? mixedPattern[index]
                : borrowMode === "bozmali";

            const question = createSubtractionQuestion(range, requireBorrow, seen);
            if (!question) {
                break;
            }

            questions.push(question);
        }

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateMultiplication(context) {
        const min = 2;
        const max = Math.max(2, context.settings.factorMax);
        const count = context.settings.questionCount;
        const seen = new Set();
        const questions = generateUnique(count, function () {
            return createMultiplicationQuestion(min, max, seen, context.settings.layout === "altalta" ? "stacked" : "inline");
        });

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateDivision(context) {
        const count = context.settings.questionCount;
        const divisionConfig = getDivisionGenerationConfig(context.settings);
        const seen = new Set();
        const questions = generateUnique(count, function () {
            return createDivisionQuestion(divisionConfig, seen);
        }, 12000);

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateMixedOperations(context) {
        const operationKinds = getMixedOperationKinds(context.classLevel);
        const pattern = buildBalancedOperationPattern(context.settings.questionCount, operationKinds);
        const operationConfigs = getMixedOperationConfigs(context.classLevel, context.presetId);
        const seenByKind = operationKinds.reduce(function (acc, kind) {
            acc[kind] = new Set();
            return acc;
        }, {});
        const questions = [];

        for (let index = 0; index < pattern.length; index += 1) {
            const kind = pattern[index];
            const config = operationConfigs[kind];
            let question = null;

            if (kind === "addition") {
                question = createAdditionQuestion(getDigitRange(config.digits), config.requireCarry, seenByKind[kind]);
            } else if (kind === "subtraction") {
                question = createSubtractionQuestion(getDigitRange(config.digits), config.requireBorrow, seenByKind[kind]);
            } else if (kind === "multiplication") {
                question = createMultiplicationQuestion(2, config.factorMax, seenByKind[kind], "inline");
            } else if (kind === "division") {
                question = createDivisionQuestion(config, seenByKind[kind]);
            }

            if (question) {
                questions.push(question);
            }
        }

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateFractionReading(context) {
        const count = context.settings.questionCount;
        const includeMixed = Boolean(context.settings.includeMixed);
        const questions = generateUnique(count, function () {
            const denominator = randomInt(2, 12);
            const numerator = randomInt(1, denominator - 1);

            if (includeMixed && Math.random() < 0.4) {
                const whole = randomInt(1, 9);
                const shown = `${whole} ${numerator}/${denominator}`;
                return {
                    type: "fraction-reading",
                    whole,
                    numerator,
                    denominator,
                    text: `${shown} = ____________________`,
                    answer: `${toTurkishNumber(whole)} tam ${toTurkishDenominator(denominator)} ${toTurkishNumber(numerator)}`,
                    key: `m|${whole}|${numerator}|${denominator}`
                };
            }

            const shown = `${numerator}/${denominator}`;
            return {
                type: "fraction-reading",
                whole: 0,
                numerator,
                denominator,
                text: `${shown} = ____________________`,
                answer: `${toTurkishDenominator(denominator)} ${toTurkishNumber(numerator)}`,
                key: `f|${numerator}|${denominator}`
            };
        });

        return buildWorksheet(context, questions, "single");
    }

    function buildWorksheet(context, rawQuestions, layout) {
        const safePresetId = context.presetId || DEFAULT_PRESET_ID;
        const page = buildWorksheetPage(context, rawQuestions, layout, {
            pageNumber: 1,
            pageTitle: `${context.classLevel}. Sınıf - ${context.title}`,
            pageLabel: "Etkinlik sayfası",
            difficultyLabel: context.presetId ? `${getPresetLabel(context.presetId)} düzeyi` : "Standart düzey"
        });

        return {
            title: `${context.classLevel}. Sınıf - ${context.title}`,
            instruction: context.instruction,
            topicId: context.topicId,
            topicLabel: context.topicLabel,
            layout,
            presetId: safePresetId,
            settings: context.settings,
            mode: "single",
            questions: rawQuestions,
            pages: [page],
            answerKeyMode: context.settings.showAnswerKey ? "sonda-toplu" : "yok",
            answerKeyPages: context.settings.showAnswerKey ? [buildAnswerSection(page, false)] : []
        };
    }

    function buildWorksheetPage(context, questions, layout, options) {
        return {
            topicId: context.topicId,
            topicLabel: context.topicLabel,
            layout,
            instruction: options && options.instruction ? options.instruction : context.instruction,
            pageTitle: options && options.pageTitle ? options.pageTitle : `${context.classLevel}. Sınıf - ${context.title}`,
            pageLabel: options && options.pageLabel ? options.pageLabel : "",
            difficultyLabel: options && options.difficultyLabel ? options.difficultyLabel : "",
            logicalPageNumber: options && options.pageNumber ? options.pageNumber : 1,
            questions: Array.isArray(questions) ? questions : [],
            settings: context.settings,
            presetId: context.presetId || DEFAULT_PRESET_ID
        };
    }

    function buildWorksheetPack(topic, context) {
        const packSettings = normalizePackSettings(context.settings);
        const pages = [];
        const answerSections = [];
        let flatQuestions = [];

        for (let pageIndex = 0; pageIndex < packSettings.pageCount; pageIndex += 1) {
            const pagePresetId = getPackPagePresetId(packSettings.difficultyFlow, pageIndex, packSettings.pageCount, context.presetId);
            const pageSettings = buildPackPageSettings(context, packSettings, pageIndex, pagePresetId);
            const pageContext = Object.assign({}, context, {
                presetId: pagePresetId,
                settings: pageSettings
            });
            const generated = ensureWorksheetBundle(topic.generator(pageContext), pageContext);
            const basePage = generated.pages[0];
            if (!basePage || !basePage.questions.length) {
                continue;
            }

            const page = buildWorksheetPage(pageContext, basePage.questions, basePage.layout || generated.layout, {
                pageNumber: pageIndex + 1,
                pageTitle: `${context.classLevel}. Sınıf - ${context.title}`,
                pageLabel: `${pageIndex + 1}. Sayfa / ${packSettings.pageCount}`,
                difficultyLabel: getPackDifficultyLabel(packSettings.difficultyFlow, pageIndex, packSettings.pageCount, pagePresetId)
            });

            pages.push(page);
            flatQuestions = flatQuestions.concat(page.questions);

            if (packSettings.answerKeyMode !== "yok") {
                answerSections.push(buildAnswerSection(page, true));
            }
        }

        return {
            title: `${context.classLevel}. Sınıf - ${context.title}`,
            instruction: context.instruction,
            topicId: context.topicId,
            topicLabel: context.topicLabel,
            layout: pages[0] ? pages[0].layout : normalizeLayout(context.settings.layout),
            presetId: context.presetId || DEFAULT_PRESET_ID,
            settings: context.settings,
            mode: "pack",
            questions: flatQuestions,
            pages,
            answerKeyMode: packSettings.answerKeyMode,
            answerKeyPages: answerSections
        };
    }

    function ensureWorksheetBundle(result, context) {
        if (!result) {
            return buildWorksheet(context, [], normalizeLayout(context.settings.layout));
        }

        if (Array.isArray(result.pages) && Array.isArray(result.answerKeyPages)) {
            return result;
        }

        const page = buildWorksheetPage(context, result.questions || [], result.layout || normalizeLayout(context.settings.layout), {
            pageNumber: 1,
            pageTitle: result.title || `${context.classLevel}. Sınıf - ${context.title}`,
            pageLabel: "Etkinlik sayfası",
            difficultyLabel: context.presetId ? `${getPresetLabel(context.presetId)} düzeyi` : "Standart düzey"
        });
        const showAnswerKey = result.settings ? result.settings.showAnswerKey : context.settings.showAnswerKey;

        return Object.assign({}, result, {
            mode: result.mode || "single",
            questions: Array.isArray(result.questions) ? result.questions : [],
            pages: [page],
            answerKeyMode: showAnswerKey ? "sonda-toplu" : "yok",
            answerKeyPages: showAnswerKey ? [buildAnswerSection(page, false)] : []
        });
    }

    function buildAnswerSection(page, includeSourceLabel) {
        return {
            topicId: page.topicId,
            sourcePageNumber: page.logicalPageNumber,
            sourceLabel: includeSourceLabel
                ? `${page.pageLabel || `${page.logicalPageNumber}. Sayfa`} - ${page.difficultyLabel || "Cevaplar"}`
                : "",
            questions: page.questions
        };
    }

    function normalizePackSettings(settings) {
        return {
            pageCount: clamp(Number(settings.pageCount) || 3, 2, 10),
            questionsPerPage: clamp(Number(settings.questionsPerPage) || Number(settings.questionCount) || 24, 6, 60),
            difficultyFlow: normalizeDifficultyFlow(settings.difficultyFlow),
            answerKeyMode: normalizeAnswerKeyMode(settings.answerKeyMode)
        };
    }

    function normalizeDifficultyFlow(value) {
        if (value === "kolaydan-zora" || value === "karisik" || value === "tekrar-paketi" || value === "sabit") {
            return value;
        }
        return "sabit";
    }

    function normalizeAnswerKeyMode(value) {
        if (value === "yok" || value === "her-sayfadan-sonra" || value === "sonda-toplu") {
            return value;
        }
        return "sonda-toplu";
    }

    function buildPackPageSettings(context, packSettings, pageIndex, pagePresetId) {
        const pageSettings = Object.assign({}, context.settings, {
            questionCount: packSettings.questionsPerPage,
            showAnswerKey: packSettings.answerKeyMode !== "yok"
        });
        const difficultyStep = getPackDifficultyStep(packSettings.difficultyFlow, pageIndex, packSettings.pageCount);

        applyTopicDifficultyStep(pageSettings, context.classLevel, context.topicId, difficultyStep, pagePresetId);
        return pageSettings;
    }

    function getPackDifficultyStep(flow, pageIndex, pageCount) {
        if (flow === "kolaydan-zora") {
            const ratio = pageCount <= 1 ? 0 : pageIndex / (pageCount - 1);
            return clamp(Math.round(ratio * 2), 0, 2);
        }
        if (flow === "karisik") {
            return [0, 2, 1][pageIndex % 3];
        }
        if (flow === "tekrar-paketi") {
            return [0, 1, 0, 1, 2][pageIndex % 5];
        }
        return 1;
    }

    function getPackPagePresetId(flow, pageIndex, pageCount, activePresetId) {
        if (flow === "sabit") {
            return activePresetId || DEFAULT_PRESET_ID;
        }

        const difficultyStep = getPackDifficultyStep(flow, pageIndex, pageCount);
        return ["kolay", "orta", "zor"][difficultyStep] || DEFAULT_PRESET_ID;
    }

    function getPackDifficultyLabel(flow, pageIndex, pageCount, pagePresetId) {
        if (flow === "tekrar-paketi") {
            return `Tekrar akışı - ${getPresetLabel(pagePresetId)}`;
        }
        if (flow === "karisik") {
            return `Karışık akış - ${getPresetLabel(pagePresetId)}`;
        }
        if (flow === "kolaydan-zora") {
            return `Kolaydan zora - ${getPresetLabel(pagePresetId)}`;
        }
        return pagePresetId ? `${getPresetLabel(pagePresetId)} düzeyi` : "Sabit düzey";
    }

    function applyTopicDifficultyStep(settings, classLevel, topicId, difficultyStep, pagePresetId) {
        if (topicId === "ritmik-sayma") {
            settings.maxNumber = [60, 120, 250, 500][Math.max(0, Number(classLevel) - 1)] || 120;
            settings.maxNumber += difficultyStep * 40;
            settings.step = clamp(Number(settings.step) || (Number(classLevel) + 2), 1, 20) + (difficultyStep === 2 ? 1 : 0);
            settings.direction = difficultyStep >= 2 ? "backward" : "forward";
            return;
        }

        if (topicId === "onceki-sonraki" || topicId === "aradaki-sayilar") {
            settings.maxNumber = [40, 120, 300, 600][Math.max(0, Number(classLevel) - 1)] || 120;
            settings.maxNumber += difficultyStep * 60;
            return;
        }

        if (topicId === "sayi-karsilastirma") {
            settings.digitCount = String(getComparisonDigitCount(classLevel, difficultyStep));
            return;
        }

        if (topicId === "toplama") {
            settings.digitCount = String(getArithmeticDigitCount(classLevel, difficultyStep, "addition"));
            settings.carryMode = ["eldesiz", "mixed", "eldeli"][difficultyStep];
            return;
        }

        if (topicId === "cikarma") {
            settings.digitCount = String(getArithmeticDigitCount(classLevel, difficultyStep, "subtraction"));
            settings.borrowMode = ["bozmasiz", "mixed", "bozmali"][difficultyStep];
            return;
        }

        if (topicId === "carpma") {
            settings.factorMax = getMultiplicationFactorMax(classLevel, difficultyStep, pagePresetId);
            settings.layout = difficultyStep >= 2 ? "double" : settings.layout;
            return;
        }

        if (topicId === "bolme") {
            const divisionDefaults = getDivisionPresetValues(classLevel, difficultyStep, pagePresetId);
            settings.dividendDigits = divisionDefaults.dividendDigits;
            settings.divisorDigits = divisionDefaults.divisorDigits;
            settings.remainderMode = divisionDefaults.remainderMode;
            settings.divisionStyle = divisionDefaults.divisionStyle;
            return;
        }

        if (topicId === "kesir-okuma") {
            settings.includeMixed = Number(classLevel) >= 4 && difficultyStep >= 1;
            return;
        }

        if (topicId === "karisik-islemler") {
            settings.layout = difficultyStep >= 2 ? "double" : "altalta";
        }
    }

    function generateUnique(targetCount, producer, maxAttempts) {
        const attemptsLimit = Number.isFinite(maxAttempts) ? maxAttempts : 6000;
        const seen = new Set();
        const output = [];
        let attempts = 0;

        while (output.length < targetCount && attempts < attemptsLimit) {
            attempts += 1;
            const candidate = producer();
            if (!candidate || !candidate.key) {
                continue;
            }
            if (seen.has(candidate.key)) {
                continue;
            }
            seen.add(candidate.key);
            output.push(candidate);
        }

        return output;
    }

    function buildSignPattern(count) {
        const pool = [">", "<", "="];
        const pattern = [];
        for (let i = 0; i < count; i += 1) {
            pattern.push(pool[i % pool.length]);
        }
        shuffleInPlace(pattern);
        return pattern;
    }

    function buildMixedPattern(count) {
        if (count <= 1) {
            return [Math.random() < 0.5];
        }

        const pattern = [];
        for (let i = 0; i < count; i += 1) {
            pattern.push(i % 2 === 0);
        }

        shuffleInPlace(pattern);
        return pattern;
    }

    function shuffleInPlace(items) {
        for (let index = items.length - 1; index > 0; index -= 1) {
            const swapIndex = randomInt(0, index);
            const temp = items[index];
            items[index] = items[swapIndex];
            items[swapIndex] = temp;
        }
        return items;
    }

    function buildBalancedOperationPattern(count, kinds) {
        const pattern = [];
        for (let index = 0; index < count; index += 1) {
            pattern.push(kinds[index % kinds.length]);
        }
        shuffleInPlace(pattern);
        return pattern;
    }

    function getMixedOperationKinds(classLevel) {
        if (classLevel === "4") {
            return ["addition", "subtraction", "multiplication", "division"];
        }
        if (classLevel === "3") {
            return ["addition", "subtraction", "multiplication"];
        }
        return ["addition", "subtraction"];
    }

    function getMixedOperationConfigs(classLevel, presetId) {
        const profile = getPresetProfile(presetId);
        return {
            addition: {
                digits: getArithmeticDigitCount(classLevel, profile.difficulty, "addition"),
                requireCarry: profile.difficulty >= 1
            },
            subtraction: {
                digits: getArithmeticDigitCount(classLevel, profile.difficulty, "subtraction"),
                requireBorrow: profile.difficulty >= 1
            },
            multiplication: {
                factorMax: getMultiplicationFactorMax(classLevel, profile.difficulty, presetId)
            },
            division: Object.assign(
                getDivisionGenerationConfig(getDivisionPresetValues(classLevel, profile.difficulty, presetId)),
                { renderStyle: profile.difficulty >= 2 ? "long" : "short" }
            )
        };
    }

    function normalizeMode(value, offMode, onMode) {
        if (value === onMode || value === offMode || value === "mixed") {
            return value;
        }
        return offMode;
    }

    function createAdditionQuestion(range, requireCarry, seen) {
        const pair = pickAdditionPair(range, requireCarry, false, seen);
        if (!pair) {
            return null;
        }

        return {
            type: "operation",
            operationKind: "addition",
            renderStyle: "stacked",
            operator: "+",
            a: pair.a,
            b: pair.b,
            text: `${pair.a} + ${pair.b} = ____`,
            answer: String(pair.a + pair.b),
            key: pair.key
        };
    }

    function createSubtractionQuestion(range, requireBorrow, seen) {
        const pair = pickSubtractionPair(range, requireBorrow, false, false, seen);
        if (!pair) {
            return null;
        }

        return {
            type: "operation",
            operationKind: "subtraction",
            renderStyle: "stacked",
            operator: "-",
            a: pair.a,
            b: pair.b,
            text: `${pair.a} - ${pair.b} = ____`,
            answer: String(pair.a - pair.b),
            key: pair.key
        };
    }

    function createMultiplicationQuestion(min, max, seen, renderStyle) {
        for (let attempts = 0; attempts < 1400; attempts += 1) {
            const a = randomInt(min, max);
            const b = randomInt(min, max);
            const canonical = a <= b ? `${a}|${b}` : `${b}|${a}`;
            if (seen.has(canonical)) {
                continue;
            }
            seen.add(canonical);
            return {
                type: "operation",
                operationKind: "multiplication",
                renderStyle: renderStyle || "inline",
                operator: "×",
                a,
                b,
                text: `${a} × ${b} = ____`,
                answer: String(a * b),
                key: canonical
            };
        }

        return null;
    }

    function getDivisionGenerationConfig(settings) {
        return {
            dividendDigits: clamp(Number.parseInt(settings.dividendDigits, 10) || 3, 2, 5),
            divisorDigits: clamp(Number.parseInt(settings.divisorDigits, 10) || 2, 1, 2),
            withRemainder: settings.remainderMode === "kalanli",
            divisionStyle: normalizeDivisionStyle(settings.divisionStyle),
            remainderMode: settings.remainderMode === "kalanli" ? "kalanli" : "kalansiz"
        };
    }

    function createDivisionQuestion(config, seen) {
        const divisorRange = getDigitRange(config.divisorDigits);
        const dividendRange = getDigitRange(config.dividendDigits);
        const divisorMin = Math.max(2, divisorRange.min);
        const divisorMax = Math.max(divisorMin, divisorRange.max);
        const dividendMin = Math.max(2, dividendRange.min);
        const dividendMax = Math.max(dividendMin, dividendRange.max);

        for (let attempts = 0; attempts < 1800; attempts += 1) {
            const divisor = randomInt(divisorMin, divisorMax);
            const quotientMin = Math.max(1, Math.ceil((dividendMin - (config.withRemainder ? divisor - 1 : 0)) / divisor));
            const quotientMax = Math.max(quotientMin, Math.floor(dividendMax / divisor));
            if (quotientMin > quotientMax) {
                continue;
            }

            const quotient = randomInt(quotientMin, quotientMax);
            const remainder = config.withRemainder && divisor > 1
                ? randomInt(1, divisor - 1)
                : 0;
            const dividend = (divisor * quotient) + remainder;

            if (dividend < dividendMin || dividend > dividendMax) {
                continue;
            }

            const key = `${dividend}|${divisor}|${remainder}|${config.divisionStyle}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            return {
                type: "operation",
                operationKind: "division",
                renderStyle: resolveDivisionRenderStyle(config.divisionStyle),
                operator: "÷",
                a: dividend,
                b: divisor,
                quotient,
                remainder,
                remainderPlaceholder: remainder > 0,
                text: remainder > 0
                    ? `${dividend} ÷ ${divisor} = ____ kalan ____`
                    : `${dividend} ÷ ${divisor} = ____`,
                answer: remainder > 0 ? `${quotient} kalan ${remainder}` : String(quotient),
                key
            };
        }

        return null;
    }

    function normalizeDivisionStyle(value) {
        if (value === "long" || value === "mixed" || value === "short") {
            return value;
        }
        return "short";
    }

    function resolveDivisionRenderStyle(style) {
        if (style === "mixed") {
            return Math.random() < 0.5 ? "long" : "short";
        }
        return style === "long" ? "long" : "short";
    }

    function pickAdditionPair(range, requireCarry, allowZeroOperand, seen) {
        for (let attempts = 0; attempts < 1800; attempts += 1) {
            const a = randomInt(range.min, range.max);
            const b = allowZeroOperand && Math.random() < 0.2
                ? 0
                : randomInt(range.min, range.max);

            if (!allowZeroOperand && b === 0) {
                continue;
            }

            const needsCarry = hasCarry(a, b);
            if (requireCarry && !needsCarry) {
                continue;
            }
            if (!requireCarry && needsCarry) {
                continue;
            }

            const left = Math.min(a, b);
            const right = Math.max(a, b);
            const key = `add|${left}|${right}|${requireCarry ? "c" : "n"}|${b === 0 ? "z" : "nz"}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            return { a, b, key };
        }

        return null;
    }

    function pickSubtractionPair(range, requireBorrow, allowZeroOperand, allowEqualOperands, seen) {
        for (let attempts = 0; attempts < 2200; attempts += 1) {
            let a = randomInt(range.min, range.max);
            let b = allowZeroOperand && Math.random() < 0.2
                ? 0
                : randomInt(range.min, range.max);

            if (a < b) {
                const temp = a;
                a = b;
                b = temp;
            }

            if (!allowZeroOperand && b === 0) {
                continue;
            }
            if (!allowEqualOperands && a === b) {
                continue;
            }

            const needsBorrow = hasBorrow(a, b);
            if (requireBorrow && !needsBorrow) {
                continue;
            }
            if (!requireBorrow && needsBorrow) {
                continue;
            }

            const key = `sub|${a}|${b}|${requireBorrow ? "b" : "n"}|${b === 0 ? "z" : "nz"}|${a === b ? "eq" : "ne"}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            return { a, b, key };
        }

        return null;
    }

    function createComparisonPair(sign, min, max) {
        if (sign === "=") {
            const value = randomInt(min, max);
            return { left: value, right: value };
        }

        let left = 0;
        let right = 0;
        while (true) {
            left = randomInt(min, max);
            right = randomInt(min, max);
            if (sign === ">" && left > right) {
                return { left, right };
            }
            if (sign === "<" && left < right) {
                return { left, right };
            }
        }
    }

    function buildCarrylessAddition(digits) {
        const aDigits = [];
        const bDigits = [];
        for (let i = 0; i < digits; i += 1) {
            const minDigit = i === digits - 1 && digits > 1 ? 1 : 0;
            const aDigit = randomInt(minDigit, 9);
            const bDigit = randomInt(0, 9 - aDigit);
            aDigits.push(aDigit);
            bDigits.push(bDigit);
        }
        return {
            a: digitsToNumber(aDigits),
            b: digitsToNumber(bDigits)
        };
    }

    function buildBorrowlessSubtraction(digits) {
        const aDigits = [];
        const bDigits = [];
        for (let i = 0; i < digits; i += 1) {
            const minDigit = i === digits - 1 && digits > 1 ? 1 : 0;
            const aDigit = randomInt(minDigit, 9);
            const bDigit = randomInt(0, aDigit);
            aDigits.push(aDigit);
            bDigits.push(bDigit);
        }
        const a = digitsToNumber(aDigits);
        const b = digitsToNumber(bDigits);
        if (a < b) {
            return { a: b, b: a };
        }
        return { a, b };
    }

    function digitsToNumber(digits) {
        let value = 0;
        for (let i = 0; i < digits.length; i += 1) {
            value += digits[i] * Math.pow(10, i);
        }
        return value;
    }

    function hasCarry(a, b) {
        let carry = 0;
        let left = a;
        let right = b;

        while (left > 0 || right > 0) {
            const leftDigit = left % 10;
            const rightDigit = right % 10;
            if (leftDigit + rightDigit + carry >= 10) {
                return true;
            }
            carry = leftDigit + rightDigit + carry >= 10 ? 1 : 0;
            left = Math.floor(left / 10);
            right = Math.floor(right / 10);
        }

        return false;
    }

    function hasBorrow(a, b) {
        let borrow = 0;
        let minuend = a;
        let subtrahend = b;

        while (minuend > 0 || subtrahend > 0) {
            const mDigit = minuend % 10;
            const sDigit = subtrahend % 10;
            if (mDigit - borrow < sDigit) {
                return true;
            }
            borrow = mDigit - borrow < sDigit ? 1 : 0;
            minuend = Math.floor(minuend / 10);
            subtrahend = Math.floor(subtrahend / 10);
        }

        return false;
    }

    function getDigitRange(digits) {
        const safeDigits = clamp(Number(digits) || 1, 1, 6);
        const min = Math.pow(10, safeDigits - 1);
        const max = Math.pow(10, safeDigits) - 1;
        return { min, max };
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeLayout(layoutValue) {
        if (layoutValue === "double" || layoutValue === "altalta") {
            return layoutValue;
        }
        return "single";
    }

    function setFieldValue(fieldId, value) {
        const input = document.getElementById(`mkg-field-${fieldId}`);
        if (!input) {
            return;
        }

        if (input.type === "checkbox") {
            input.checked = Boolean(value);
            return;
        }

        input.value = String(value);
    }

    function digitOptions(minDigits, maxDigits) {
        const options = [];
        for (let i = minDigits; i <= maxDigits; i += 1) {
            options.push({ value: String(i), label: `${i} basamak` });
        }
        return options;
    }

    function numberField(id, label, defaultValue, min, max, step) {
        return {
            type: "number",
            id,
            label,
            default: defaultValue,
            min,
            max,
            step: step || 1
        };
    }

    function textField(id, label, placeholder) {
        return {
            type: "text",
            id,
            label,
            default: "",
            placeholder: placeholder || ""
        };
    }

    function selectField(id, label, options, defaultValue) {
        return {
            type: "select",
            id,
            label,
            options,
            default: defaultValue
        };
    }

    function checkboxField(id, label, defaultValue) {
        return {
            type: "checkbox",
            id,
            label,
            default: Boolean(defaultValue)
        };
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function toTurkishNumber(value) {
        const ones = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
        const tens = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

        if (value < 10) {
            return ones[value];
        }
        if (value < 100) {
            const tenPart = Math.floor(value / 10);
            const onePart = value % 10;
            return `${tens[tenPart]}${onePart ? " " + ones[onePart] : ""}`.trim();
        }
        if (value === 100) {
            return "yüz";
        }
        return String(value);
    }

    function toTurkishDenominator(value) {
        const map = {
            2: "ikide",
            3: "üçte",
            4: "dörtte",
            5: "beşte",
            6: "altıda",
            7: "yedide",
            8: "sekizde",
            9: "dokuzda",
            10: "onda",
            11: "on birde",
            12: "on ikide"
        };
        return map[value] || `${toTurkishNumber(value)}de`;
    }
}());
