
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
        "2": ["toplama", "cikarma", "ritmik-sayma", "sayi-karsilastirma", "carpma"],
        "3": ["toplama", "cikarma", "carpma", "ritmik-sayma"],
        "4": ["toplama", "cikarma", "carpma", "bolme"]
    };

    const LAYOUT_OPTIONS = [
        { value: "altalta", label: "Alt alta" },
        { value: "single", label: "Tek sütun" },
        { value: "double", label: "Çift sütun" }
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
                numberField("questionCount", "Soru sayısı", 24, 6, 80),
                selectField("layout", "İşlem düzeni", LAYOUT_OPTIONS, "altalta"),
                textField("teacherName", "Öğretmen adı", "Opsiyonel"),
                checkboxField("showAnswerKey", "Cevap anahtarı olsun mu", true)
            ],
            generator: generateDivision
        }
    };

    const form = document.getElementById("mkg-form");
    const classLevelSelect = document.getElementById("mkg-class-level");
    const topicSelect = document.getElementById("mkg-topic");
    const topicSettingsRoot = document.getElementById("mkg-topic-settings");
    const previewRoot = document.getElementById("mkg-preview-root");
    const statusBox = document.getElementById("mkg-status");
    const regenerateButton = document.getElementById("mkg-regenerate");
    const printButton = document.getElementById("mkg-print");

    let lastWorksheet = null;

    init();

    function init() {
        classLevelSelect.innerHTML = CLASS_LEVELS
            .map((entry) => `<option value="${entry.value}">${entry.label}</option>`)
            .join("");

        classLevelSelect.addEventListener("change", onClassChange);
        topicSelect.addEventListener("change", onTopicChange);

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

        window.addEventListener("resize", function () {
            if (lastWorksheet) {
                renderWorksheet(lastWorksheet);
            }
        });

        onClassChange();
    }

    function onClassChange() {
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
        const topic = TOPIC_REGISTRY[topicSelect.value];
        if (!topic) {
            topicSettingsRoot.innerHTML = "";
            return;
        }

        topicSettingsRoot.innerHTML = topic.settings.map(renderField).join("");
        applyClassTopicDefaults(classLevelSelect.value, topicSelect.value);
        statusBox.textContent = "";
    }

    function generateAndRender() {
        const topicId = topicSelect.value;
        const topic = TOPIC_REGISTRY[topicId];
        if (!topic) {
            return;
        }

        const classLevel = classLevelSelect.value;
        const settings = collectSettings(topic.settings);

        const result = topic.generator({
            classLevel,
            topicId,
            topicLabel: topic.label,
            title: topic.title,
            instruction: topic.instruction,
            settings
        });

        if (!result.questions.length) {
            statusBox.textContent = "Bu ayarlarla soru üretilemedi. Lütfen seçenekleri değiştirin.";
            return;
        }

        if (result.questions.length < settings.questionCount) {
            statusBox.textContent = "Benzersiz soru havuzu sınırlı olduğu için daha az soru üretildi.";
        } else {
            statusBox.textContent = "Çalışma kağıdı hazır.";
        }

        lastWorksheet = result;
        regenerateButton.disabled = false;
        renderWorksheet(result);
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
        const teacherLine = worksheet.settings.teacherName
            ? `<div class="mkg-meta-line mkg-meta-line--teacher">Öğretmen: ${escapeHtml(worksheet.settings.teacherName)}</div>`
            : "";

        const questionsHtml = renderQuestionMatrix(worksheet);
        const siteFooter = `<footer class="mkg-sheet-footer">${escapeHtml(WORKSHEET_SITE_LABEL)}</footer>`;

        const answerHtml = worksheet.settings.showAnswerKey
            ? `
                <section class="mkg-answer-page">
                    <h3>Cevap Anahtarı</h3>
                    <ol class="mkg-answer-list">
                        ${worksheet.questions.map((q, i) => `<li><strong>${i + 1})</strong> ${escapeHtml(q.answer)}</li>`).join("")}
                    </ol>
                    <footer class="mkg-sheet-footer mkg-sheet-footer-answer">${escapeHtml(WORKSHEET_SITE_LABEL)}</footer>
                </section>
            `
            : "";

        previewRoot.innerHTML = `
            <article class="mkg-sheet">
                <header class="mkg-sheet-header">
                    <h2>${escapeHtml(worksheet.title)}</h2>
                    <div class="mkg-meta-line">
                        <span>Öğrenci Adı: ____________________</span>
                        <span>Tarih: ____ / ____ / ______</span>
                    </div>
                    ${teacherLine}
                    <p class="mkg-instruction">${escapeHtml(worksheet.instruction)}</p>
                </header>

                <section class="mkg-question-grid mkg-layout-${escapeHtml(worksheet.layout)}">
                    ${questionsHtml}
                </section>
                ${siteFooter}
                ${answerHtml}
            </article>
        `;
    }

    function renderQuestionMatrix(worksheet) {
        if (window.MathWorksheetGrid && typeof window.MathWorksheetGrid.renderMatrix === "function") {
            return window.MathWorksheetGrid.renderMatrix({
                questions: worksheet.questions,
                questionCount: worksheet.questions.length,
                layout: worksheet.layout,
                topicId: worksheet.topicId,
                escapeHtml
            });
        }

        return worksheet.questions.map(function (question, index) {
            return renderQuestion(question, index + 1, worksheet.layout);
        }).join("");
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
                    type: "text",
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

            const pair = pickAdditionPair(range, requireCarry, false, seen);
            if (!pair) {
                break;
            }

            questions.push({
                type: "operation",
                operator: "+",
                a: pair.a,
                b: pair.b,
                text: `${pair.a} + ${pair.b} = ____`,
                answer: String(pair.a + pair.b),
                key: pair.key
            });
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

            const pair = pickSubtractionPair(range, requireBorrow, false, false, seen);
            if (!pair) {
                break;
            }

            questions.push({
                type: "operation",
                operator: "-",
                a: pair.a,
                b: pair.b,
                text: `${pair.a} - ${pair.b} = ____`,
                answer: String(pair.a - pair.b),
                key: pair.key
            });
        }

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateMultiplication(context) {
        const min = 2;
        let max = context.settings.factorMax;
        max = Math.max(2, max);

        const count = context.settings.questionCount;
        const questions = generateUnique(count, function () {
            const a = randomInt(min, max);
            const b = randomInt(min, max);
            const canonical = a <= b ? `${a}|${b}` : `${b}|${a}`;
            return {
                type: "operation",
                operator: "×",
                a,
                b,
                text: `${a} × ${b} = ____`,
                answer: String(a * b),
                key: canonical
            };
        });

        return buildWorksheet(context, questions, normalizeLayout(context.settings.layout));
    }

    function generateDivision(context) {
        const divisorDigits = clamp(Number.parseInt(context.settings.divisorDigits, 10) || 2, 1, 2);
        const dividendDigits = clamp(Number.parseInt(context.settings.dividendDigits, 10) || 3, 2, 5);
        const divisorRange = getDigitRange(divisorDigits);
        const dividendRange = getDigitRange(dividendDigits);
        const divisorMin = Math.max(2, divisorRange.min);
        const divisorMax = Math.max(divisorMin, divisorRange.max);
        const dividendMin = Math.max(2, dividendRange.min);
        const dividendMax = Math.max(dividendMin, dividendRange.max);

        const count = context.settings.questionCount;
        const withRemainder = context.settings.remainderMode === "kalanli";

        const questions = generateUnique(count, function () {
            const divisor = randomInt(divisorMin, divisorMax);
            const quotientMin = Math.max(1, Math.ceil((dividendMin - (withRemainder ? divisor - 1 : 0)) / divisor));
            const quotientMax = Math.max(quotientMin, Math.floor(dividendMax / divisor));
            if (quotientMin > quotientMax) {
                return null;
            }

            const quotient = randomInt(quotientMin, quotientMax);
            if (!withRemainder) {
                const dividend = divisor * quotient;
                if (dividend < dividendMin || dividend > dividendMax) {
                    return null;
                }
                return {
                    type: "operation",
                    operator: "÷",
                    a: dividend,
                    b: divisor,
                    text: `${dividend} ÷ ${divisor} = ____`,
                    answer: String(quotient),
                    key: `${dividend}|${divisor}|0`
                };
            }

            if (divisor <= 1) {
                return null;
            }

            const remainder = randomInt(1, divisor - 1);
            const dividend = (divisor * quotient) + remainder;
            if (dividend < dividendMin || dividend > dividendMax) {
                return null;
            }

            return {
                type: "operation",
                operator: "÷",
                a: dividend,
                b: divisor,
                remainderPlaceholder: true,
                text: `${dividend} ÷ ${divisor} = ____ kalan ____`,
                answer: `${quotient} kalan ${remainder}`,
                key: `${dividend}|${divisor}|${remainder}`
            };
        }, 12000);

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
                    type: "text",
                    text: `${shown} = ____________________`,
                    answer: `${toTurkishNumber(whole)} tam ${toTurkishDenominator(denominator)} ${toTurkishNumber(numerator)}`,
                    key: `m|${whole}|${numerator}|${denominator}`
                };
            }

            const shown = `${numerator}/${denominator}`;
            return {
                type: "text",
                text: `${shown} = ____________________`,
                answer: `${toTurkishDenominator(denominator)} ${toTurkishNumber(numerator)}`,
                key: `f|${numerator}|${denominator}`
            };
        });

        return buildWorksheet(context, questions, "single");
    }

    function buildWorksheet(context, rawQuestions, layout) {
        return {
            title: `${context.classLevel}. Sınıf - ${context.title}`,
            instruction: context.instruction,
            topicId: context.topicId,
            topicLabel: context.topicLabel,
            layout,
            settings: context.settings,
            questions: rawQuestions
        };
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
        for (let i = pattern.length - 1; i > 0; i -= 1) {
            const j = randomInt(0, i);
            const temp = pattern[i];
            pattern[i] = pattern[j];
            pattern[j] = temp;
        }
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

        for (let i = pattern.length - 1; i > 0; i -= 1) {
            const j = randomInt(0, i);
            const temp = pattern[i];
            pattern[i] = pattern[j];
            pattern[j] = temp;
        }
        return pattern;
    }

    function normalizeMode(value, offMode, onMode) {
        if (value === onMode || value === offMode || value === "mixed") {
            return value;
        }
        return offMode;
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

    function applyClassTopicDefaults(classLevel, topicId) {
        if (topicId === "carpma") {
            const multiplicationDefaults = getMultiplicationDefaultsByClass(classLevel);
            setFieldValue("factorMax", multiplicationDefaults.factorMax);
            setFieldValue("layout", "altalta");
            return;
        }

        if (topicId === "bolme") {
            const divisionDefaults = getDivisionDefaultsByClass(classLevel);
            setFieldValue("dividendDigits", divisionDefaults.dividendDigits);
            setFieldValue("divisorDigits", divisionDefaults.divisorDigits);
            setFieldValue("layout", "altalta");
        }
    }

    function getMultiplicationDefaultsByClass(classLevel) {
        if (classLevel === "2") {
            return { factorMax: 5 };
        }
        if (classLevel === "4") {
            return { factorMax: 20 };
        }
        return { factorMax: 10 };
    }

    function getDivisionDefaultsByClass(classLevel) {
        if (classLevel === "4") {
            return { dividendDigits: 3, divisorDigits: 2 };
        }
        return { dividendDigits: 2, divisorDigits: 1 };
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
