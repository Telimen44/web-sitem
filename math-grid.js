(function (global) {
    "use strict";

    const A4_CONTENT_WIDTH_MM = 190;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function defaultEscape(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function styleMapToString(styleMap) {
        return Object.keys(styleMap)
            .filter((key) => styleMap[key] !== undefined && styleMap[key] !== null && styleMap[key] !== "")
            .map((key) => `${key}:${styleMap[key]}`)
            .join("; ");
    }

    function estimatePrintColumns(options) {
        const layout = options.layout || "double";
        const topicId = options.topicId || "";
        const questions = Array.isArray(options.questions) ? options.questions : [];
        const questionCount = Number(options.questionCount) || questions.length || 1;
        const hasArithmetic = questions.some((question) => question && question.type === "operation");

        let minCellWidthMm = hasArithmetic ? 35 : 45;
        if (topicId === "carpma") {
            minCellWidthMm = 32;
        }
        if (topicId === "karisik-islemler") {
            minCellWidthMm = 40;
        }
        if (topicId === "sayi-karsilastirma") {
            minCellWidthMm = 42;
        }
        if (topicId === "kesir-okuma" || topicId === "ritmik-sayma") {
            minCellWidthMm = 50;
        }
        if (topicId === "bolme") {
            minCellWidthMm = 46;
        }

        let columns = Math.floor(A4_CONTENT_WIDTH_MM / minCellWidthMm);
        columns = clamp(columns, 2, 5);

        if (layout === "single") {
            columns = Math.min(columns, 4);
        } else if (layout === "altalta") {
            columns = Math.max(columns, 4);
        }

        if (questionCount < 12) {
            columns = Math.min(columns, 3);
        } else if (questionCount < 18) {
            columns = Math.min(columns, 4);
        } else if (questionCount >= 24) {
            columns = Math.max(columns, 4);
        }

        if (topicId === "bolme") {
            columns = Math.min(columns, 4);
        }

        return clamp(columns, 2, 5);
    }

    function buildQuestionMatrix(items, columns) {
        const safeColumns = Math.max(1, columns);
        const rows = Math.ceil(items.length / safeColumns);
        const matrix = [];
        let index = 0;

        for (let row = 0; row < rows; row += 1) {
            const rowItems = [];
            for (let col = 0; col < safeColumns; col += 1) {
                rowItems.push(items[index] || null);
                index += 1;
            }
            matrix.push(rowItems);
        }

        return matrix;
    }

    function getOperationKind(question) {
        if (question && question.operationKind) {
            return question.operationKind;
        }
        if (question && question.operator === "×") {
            return "multiplication";
        }
        if (question && question.operator === "÷") {
            return "division";
        }
        if (question && question.operator === "-") {
            return "subtraction";
        }
        return "addition";
    }

    function renderStackedOperationCell(item, escapeHtml) {
        const question = item.question;
        const operationKind = getOperationKind(question);
        const sign = question.operator === "-" ? "-" : question.operator;
        const maxDigits = Math.max(String(question.a).length, String(question.b).length);
        const digitWidth = clamp(maxDigits + 1, 3, 7);
        const remainderLine = question.remainderPlaceholder
            ? `
                <div class="mwg-op-remainder">
                    kalan: <span class="mwg-op-remainder-blank" aria-hidden="true"></span>
                </div>
            `
            : "";

        return `
            <article class="mwg-grid-cell mwg-grid-cell--operation mwg-grid-cell--${operationKind}" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-op-block" style="--mwg-digit-width:${digitWidth}ch">
                    <div class="mwg-op-row">
                        <span class="mwg-op-sign" aria-hidden="true">&nbsp;</span>
                        <span class="mwg-op-value">${escapeHtml(String(question.a))}</span>
                    </div>
                    <div class="mwg-op-row">
                        <span class="mwg-op-sign">${sign === "-" ? "&minus;" : escapeHtml(sign)}</span>
                        <span class="mwg-op-value">${escapeHtml(String(question.b))}</span>
                    </div>
                    <div class="mwg-op-answer-line" aria-hidden="true"></div>
                    ${remainderLine}
                </div>
            </article>
        `;
    }

    function renderInlineOperationCell(item, escapeHtml) {
        const question = item.question;
        const operationKind = getOperationKind(question);
        const operator = question.operator === "-" ? "&minus;" : escapeHtml(question.operator);
        const remainderHtml = operationKind === "division" && question.remainderPlaceholder
            ? `
                <div class="mwg-inline-remainder">
                    <span>kalan</span>
                    <span class="mwg-inline-blank" aria-hidden="true"></span>
                </div>
            `
            : "";

        return `
            <article class="mwg-grid-cell mwg-grid-cell--inline-op mwg-grid-cell--${operationKind}" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-inline-op-block">
                    <div class="mwg-inline-op-expression">
                        <span class="mwg-inline-op-value">${escapeHtml(String(question.a))}</span>
                        <span class="mwg-inline-op-sign">${operator}</span>
                        <span class="mwg-inline-op-value">${escapeHtml(String(question.b))}</span>
                        <span class="mwg-inline-op-equals">=</span>
                        <span class="mwg-inline-blank" aria-hidden="true"></span>
                    </div>
                    ${remainderHtml}
                </div>
            </article>
        `;
    }

    function renderLongDivisionCell(item, escapeHtml) {
        const question = item.question;
        const dividend = escapeHtml(String(question.a));
        const divisor = escapeHtml(String(question.b));
        const remainderHint = question.remainderPlaceholder
            ? '<div class="mwg-division-remainder">kalan</div>'
            : "";

        return `
            <article class="mwg-grid-cell mwg-grid-cell--division" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-division-block">
                    <div class="mwg-division-layout">
                        <div class="mwg-division-dividend">${dividend}</div>
                        <div class="mwg-division-divisor-wrap">
                            <span class="mwg-division-divisor">${divisor}</span>
                        </div>
                        <div class="mwg-division-workspace" aria-hidden="true"></div>
                    </div>
                    ${remainderHint}
                </div>
            </article>
        `;
    }

    function renderComparisonCell(item, escapeHtml) {
        const question = item.question;
        return `
            <article class="mwg-grid-cell mwg-grid-cell--comparison" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-compare-block">
                    <span class="mwg-compare-value">${escapeHtml(String(question.left))}</span>
                    <span class="mwg-compare-box" aria-hidden="true"></span>
                    <span class="mwg-compare-value">${escapeHtml(String(question.right))}</span>
                </div>
            </article>
        `;
    }

    function renderFractionCell(item, escapeHtml) {
        const question = item.question;
        const whole = Number(question.whole) || 0;

        return `
            <article class="mwg-grid-cell mwg-grid-cell--fraction" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-fraction-block">
                    <div class="mwg-fraction-problem">
                        ${whole ? `<span class="mwg-fraction-whole">${escapeHtml(String(whole))}</span>` : ""}
                        <span class="mwg-fraction-stack">
                            <span class="mwg-fraction-top">${escapeHtml(String(question.numerator))}</span>
                            <span class="mwg-fraction-bottom">${escapeHtml(String(question.denominator))}</span>
                        </span>
                    </div>
                    <div class="mwg-fraction-write-line" aria-hidden="true"></div>
                </div>
            </article>
        `;
    }

    function renderTextCell(item, escapeHtml) {
        const questionText = String(item.question.text || "").replace(/_{2,}/g, "_____");
        return `
            <article class="mwg-grid-cell mwg-grid-cell--text" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-text-wrap">
                    <div class="mwg-text-question">${escapeHtml(questionText)}</div>
                </div>
            </article>
        `;
    }

    function renderCell(item, escapeHtml) {
        const question = item.question || {};
        if (question.type === "comparison") {
            return renderComparisonCell(item, escapeHtml);
        }
        if (question.type === "fraction-reading") {
            return renderFractionCell(item, escapeHtml);
        }
        if (question.type === "operation") {
            const operationKind = getOperationKind(question);
            if (operationKind === "division") {
                return question.renderStyle === "long"
                    ? renderLongDivisionCell(item, escapeHtml)
                    : renderInlineOperationCell(item, escapeHtml);
            }
            if (operationKind === "multiplication" && question.renderStyle === "inline") {
                return renderInlineOperationCell(item, escapeHtml);
            }
            return renderStackedOperationCell(item, escapeHtml);
        }
        return renderTextCell(item, escapeHtml);
    }

    function renderRhythmicRow(item, escapeHtml) {
        const cells = Array.isArray(item.question.cells) ? item.question.cells : [];
        const cellsHtml = cells.map((value) => {
            const hasValue = value !== null && value !== undefined && value !== "";
            return `
                <span class="mwg-rhythm-cell ${hasValue ? "mwg-rhythm-cell--filled" : ""}">
                    ${hasValue ? escapeHtml(String(value)) : "&nbsp;"}
                </span>
            `;
        }).join("");

        return `
            <article class="mwg-rhythm-row" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-rhythm-track">${cellsHtml}</div>
            </article>
        `;
    }

    function renderTripletCell(item, escapeHtml, mode) {
        const question = item.question || {};
        const isBetween = mode === "between";

        let left = "&nbsp;";
        let middle = "&nbsp;";
        let right = "&nbsp;";

        if (isBetween) {
            const leftValue = Number(question.leftValue);
            const rightValue = Number(question.rightValue);
            left = Number.isFinite(leftValue) ? escapeHtml(String(leftValue)) : "&nbsp;";
            right = Number.isFinite(rightValue) ? escapeHtml(String(rightValue)) : "&nbsp;";
        } else {
            const middleValue = Number(question.middleValue);
            middle = Number.isFinite(middleValue) ? escapeHtml(String(middleValue)) : "&nbsp;";
        }

        return `
            <article class="mwg-prevnext-item" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-prevnext-track">
                    <span class="mwg-prevnext-box ${isBetween ? "mwg-prevnext-box--filled" : ""}">${left}</span>
                    <span class="mwg-prevnext-box ${isBetween ? "" : "mwg-prevnext-box--middle"}">${middle}</span>
                    <span class="mwg-prevnext-box ${isBetween ? "mwg-prevnext-box--filled" : ""}">${right}</span>
                </div>
            </article>
        `;
    }

    function buildNumberedItems(questions) {
        return questions.map((question, index) => ({
            question,
            index: index + 1
        }));
    }

    function createGridRows(numberedItems, columns, escapeHtml) {
        const matrix = buildQuestionMatrix(numberedItems, columns);
        return matrix.map((rowItems) => {
            const cells = rowItems.map((item) => {
                if (!item) {
                    return `<div class="mwg-grid-cell mwg-grid-cell-empty" aria-hidden="true"></div>`;
                }
                return renderCell(item, escapeHtml);
            }).join("");

            return `<div class="mwg-grid-row">${cells}</div>`;
        });
    }

    function createTripletRows(numberedItems, mode, escapeHtml) {
        const matrix = buildQuestionMatrix(numberedItems, 3);
        return matrix.map((rowItems) => {
            const cells = rowItems.map((item) => {
                if (!item) {
                    return `<div class="mwg-prevnext-item mwg-prevnext-item-empty" aria-hidden="true"></div>`;
                }
                return renderTripletCell(item, escapeHtml, mode);
            }).join("");

            return `<div class="mwg-prevnext-row">${cells}</div>`;
        });
    }

    function createLayoutModel(options) {
        const escapeHtml = options.escapeHtml || defaultEscape;
        const questions = Array.isArray(options.questions) ? options.questions : [];
        if (!questions.length) {
            return null;
        }

        const numberedItems = buildNumberedItems(questions);

        if (options.topicId === "ritmik-sayma") {
            return {
                sectionClassName: "mwg-rhythm-sheet",
                sectionStyle: styleMapToString({
                    "--mwg-print-cols": 1
                }),
                rowsHtml: numberedItems.map((item) => renderRhythmicRow(item, escapeHtml))
            };
        }

        if (options.topicId === "onceki-sonraki") {
            return {
                sectionClassName: "mwg-prevnext-sheet",
                sectionStyle: styleMapToString({
                    "--mwg-print-cols": 3
                }),
                rowsHtml: createTripletRows(numberedItems, "prevnext", escapeHtml)
            };
        }

        if (options.topicId === "aradaki-sayilar") {
            return {
                sectionClassName: "mwg-prevnext-sheet",
                sectionStyle: styleMapToString({
                    "--mwg-print-cols": 3
                }),
                rowsHtml: createTripletRows(numberedItems, "between", escapeHtml)
            };
        }

        const printColumns = estimatePrintColumns(options);
        return {
            sectionClassName: "mwg-grid",
            sectionStyle: styleMapToString({
                "--mwg-print-cols": printColumns
            }),
            rowsHtml: createGridRows(numberedItems, printColumns, escapeHtml)
        };
    }

    function renderLayoutSegment(model, rowsHtml) {
        if (!model) {
            return "";
        }

        const rows = Array.isArray(rowsHtml) ? rowsHtml : model.rowsHtml;
        const styleAttr = model.sectionStyle ? ` style="${model.sectionStyle}"` : "";
        return `
            <section class="${model.sectionClassName}"${styleAttr}>
                ${rows.join("")}
            </section>
        `;
    }

    function renderMatrix(options) {
        const model = createLayoutModel(options);
        return renderLayoutSegment(model);
    }

    global.MathWorksheetGrid = {
        estimatePrintColumns,
        buildQuestionMatrix,
        createLayoutModel,
        renderLayoutSegment,
        renderMatrix
    };
}(window));
