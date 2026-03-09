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

    function estimatePrintColumns(options) {
        const layout = options.layout || "double";
        const topicId = options.topicId || "";
        const questions = Array.isArray(options.questions) ? options.questions : [];
        const questionCount = Number(options.questionCount) || questions.length || 1;
        const hasArithmetic = questions.some((q) => q && q.type === "operation");

        let minCellWidthMm = hasArithmetic ? 35 : 45;
        if (topicId === "kesir-okuma" || topicId === "ritmik-sayma") {
            minCellWidthMm = 50;
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

        return clamp(columns, 2, 5);
    }

    function estimateScreenColumns(printColumns) {
        const width = global.innerWidth || 1200;

        if (width < 560) {
            return 1;
        }
        if (width < 900) {
            return Math.min(2, printColumns);
        }
        if (width < 1180) {
            return Math.min(3, printColumns);
        }
        return printColumns;
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

    function renderOperationCell(item, escapeHtml) {
        const question = item.question;
        const sign = question.operator === "-" ? "−" : question.operator;
        const maxDigits = Math.max(String(question.a).length, String(question.b).length);
        const digitWidth = clamp(maxDigits + 1, 3, 7);

        return `
            <article class="mwg-grid-cell mwg-grid-cell--operation" data-question-index="${item.index}">
                <div class="mwg-item-number">${item.index})</div>
                <div class="mwg-op-block" style="--mwg-digit-width:${digitWidth}ch">
                    <div class="mwg-op-row">
                        <span class="mwg-op-sign" aria-hidden="true">&nbsp;</span>
                        <span class="mwg-op-value">${escapeHtml(String(question.a))}</span>
                    </div>
                    <div class="mwg-op-row">
                        <span class="mwg-op-sign">${escapeHtml(sign)}</span>
                        <span class="mwg-op-value">${escapeHtml(String(question.b))}</span>
                    </div>
                    <div class="mwg-op-answer-line" aria-hidden="true"></div>
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
        if (item.question && item.question.type === "operation") {
            return renderOperationCell(item, escapeHtml);
        }
        return renderTextCell(item, escapeHtml);
    }

    function renderMatrix(options) {
        const escapeHtml = options.escapeHtml || defaultEscape;
        const questions = Array.isArray(options.questions) ? options.questions : [];
        if (!questions.length) {
            return "";
        }

        const printColumns = estimatePrintColumns(options);
        const screenColumns = estimateScreenColumns(printColumns);

        const numberedItems = questions.map((question, index) => ({
            question,
            index: index + 1
        }));
        const matrix = buildQuestionMatrix(numberedItems, printColumns);

        const rowsHtml = matrix.map((rowItems) => {
            const cells = rowItems.map((item) => {
                if (!item) {
                    return `<div class="mwg-grid-cell mwg-grid-cell-empty" aria-hidden="true"></div>`;
                }
                return renderCell(item, escapeHtml);
            }).join("");
            return `<div class="mwg-grid-row">${cells}</div>`;
        }).join("");

        return `
            <section class="mwg-grid" style="--mwg-screen-cols:${screenColumns}; --mwg-print-cols:${printColumns};">
                ${rowsHtml}
            </section>
        `;
    }

    global.MathWorksheetGrid = {
        estimatePrintColumns,
        estimateScreenColumns,
        buildQuestionMatrix,
        renderMatrix
    };
}(window));
