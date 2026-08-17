const generatedAtUtc = "2026-08-17T08:00:00.000Z";

function historyResponse(expenses) {
  return {
    expenses,
    totalAmount: expenses.reduce((sum, item) => sum + item.amount, 0),
    expenseCount: expenses.length,
    generatedAtUtc,
  };
}

function expenseRow(expenseId, expenseDate, amount, notes, version = 1) {
  return {
    expenseId,
    expenseDate,
    amount,
    notes,
    hasReceipt: false,
    version,
    createdAtUtc: generatedAtUtc,
  };
}

export const expenseImportFixtures = {
  validFileSuccess: {
    csv: "Date,Amount,Note\n05/10/2024,12.50,Tube\n05/11/2024,24.99,Chain lube\n05/12/2024,8.00,Parking\n",
    preview: {
      jobId: 101,
      fileName: "valid-expenses.csv",
      totalRows: 3,
      validRows: 3,
      invalidRows: 0,
      duplicateCount: 0,
      errors: [],
      duplicates: [],
      canConfirmImport: true,
    },
    summary: {
      jobId: 101,
      totalRows: 3,
      importedRows: 3,
      skippedRows: 0,
      failedRows: 0,
    },
    historyAfterConfirm: historyResponse([
      expenseRow(3, "2024-05-12", 8.0, "Parking"),
      expenseRow(2, "2024-05-11", 24.99, "Chain lube"),
      expenseRow(1, "2024-05-10", 12.5, "Tube"),
    ]),
  },
  missingDateColumn: {
    csv: "Amount,Note\n45.00,Snack\n",
    preview: {
      jobId: 102,
      fileName: "missing-date.csv",
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 1, field: "Date", message: "Required column missing: Date." }],
      duplicates: [],
      canConfirmImport: false,
    },
  },
  missingAmountColumn: {
    csv: "Date,Note\n2024-05-10,Snack\n",
    preview: {
      jobId: 103,
      fileName: "missing-amount.csv",
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 1, field: "Amount", message: "Required column missing: Amount." }],
      duplicates: [],
      canConfirmImport: false,
    },
  },
  invalidNegativeAmount: {
    csv: "Date,Amount,Note\n2024-05-10,-50.00,Bad row\n",
    preview: {
      jobId: 104,
      fileName: "negative.csv",
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 1, field: "Amount", message: "Amount must be positive." }],
      duplicates: [],
      canConfirmImport: false,
    },
  },
  invalidZeroAmount: {
    csv: "Date,Amount,Note\n2024-05-10,0.00,Bad row\n",
    preview: {
      jobId: 105,
      fileName: "zero.csv",
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 1, field: "Amount", message: "Amount must be greater than zero." }],
      duplicates: [],
      canConfirmImport: false,
    },
  },
  currencySymbolsParsed: {
    csv: "Date,Amount,Note\n2024-05-10,\"$1,250.00\",Wheelset\n",
    preview: {
      jobId: 106,
      fileName: "currency.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 0,
      errors: [],
      duplicates: [],
      canConfirmImport: true,
    },
    summary: { jobId: 106, totalRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0 },
    historyAfterConfirm: historyResponse([expenseRow(10, "2024-05-10", 1250, "Wheelset")]),
  },
  trailingIsoCurrencyParsed: {
    csv: "Date,Amount,Note\n2024-05-10,1250 USD,Wheelset\n",
    preview: {
      jobId: 107,
      fileName: "iso.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 0,
      errors: [],
      duplicates: [],
      canConfirmImport: true,
    },
    summary: { jobId: 107, totalRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0 },
    historyAfterConfirm: historyResponse([expenseRow(11, "2024-05-10", 1250, "Wheelset")]),
  },
  noteTooLong: {
    csv: `Date,Amount,Note\n2024-05-10,12.00,${"x".repeat(501)}\n`,
    preview: {
      jobId: 108,
      fileName: "long-note.csv",
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 1, field: "Note", message: "Note cannot exceed 500 characters." }],
      duplicates: [],
      canConfirmImport: false,
    },
  },
  emptyRowsSkipped: {
    csv: "Date,Amount,Note\n\n05/10/2024,10.00,A\n\n05/11/2024,20.00,B\n05/12/2024,30.00,C\n",
    preview: {
      jobId: 109,
      fileName: "blank-lines.csv",
      totalRows: 3,
      validRows: 3,
      invalidRows: 0,
      duplicateCount: 0,
      errors: [],
      duplicates: [],
      canConfirmImport: true,
    },
  },
  duplicateDetected: {
    csv: "Date,Amount,Note\n2024-05-10,45.00,Incoming note\n",
    preview: {
      jobId: 110,
      fileName: "duplicate.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 1,
      errors: [],
      duplicates: [
        {
          rowNumber: 1,
          expenseDate: "2024-05-10",
          amount: 45,
          note: "Incoming note",
          existingMatches: [
            { expenseId: 20, expenseDate: "2024-05-10", amount: 45, note: "Existing note" },
          ],
        },
      ],
      canConfirmImport: true,
    },
  },
  duplicateReplaceWithNote: {
    csv: "Date,Amount,Note\n2024-05-10,45.00,New note\n",
    preview: {
      jobId: 111,
      fileName: "replace-note.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 1,
      errors: [],
      duplicates: [
        {
          rowNumber: 1,
          expenseDate: "2024-05-10",
          amount: 45,
          note: "New note",
          existingMatches: [
            { expenseId: 21, expenseDate: "2024-05-10", amount: 45, note: "Old note" },
          ],
        },
      ],
      canConfirmImport: true,
    },
    summary: { jobId: 111, totalRows: 1, importedRows: 0, skippedRows: 0, failedRows: 0 },
    historyAfterConfirm: historyResponse([expenseRow(21, "2024-05-10", 45, "New note", 2)]),
  },
  duplicateReplaceEmptyNote: {
    csv: "Date,Amount,Note\n2024-05-10,45.00,\n",
    preview: {
      jobId: 112,
      fileName: "replace-empty-note.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 1,
      errors: [],
      duplicates: [
        {
          rowNumber: 1,
          expenseDate: "2024-05-10",
          amount: 45,
          note: null,
          existingMatches: [
            { expenseId: 22, expenseDate: "2024-05-10", amount: 45, note: "Original note" },
          ],
        },
      ],
      canConfirmImport: true,
    },
    summary: { jobId: 112, totalRows: 1, importedRows: 0, skippedRows: 0, failedRows: 0 },
    historyAfterConfirm: historyResponse([expenseRow(22, "2024-05-10", 45, "Original note", 2)]),
  },
  overrideAllDuplicates: {
    csv: "Date,Amount,Note\n2024-05-10,45.00,Imported duplicate\n",
    preview: {
      jobId: 113,
      fileName: "override-all.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 1,
      errors: [],
      duplicates: [
        {
          rowNumber: 1,
          expenseDate: "2024-05-10",
          amount: 45,
          note: "Imported duplicate",
          existingMatches: [
            { expenseId: 23, expenseDate: "2024-05-10", amount: 45, note: "Existing" },
          ],
        },
      ],
      canConfirmImport: true,
    },
    summary: { jobId: 113, totalRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0 },
    historyAfterConfirm: historyResponse([
      expenseRow(24, "2024-05-10", 45, "Imported duplicate"),
      expenseRow(23, "2024-05-10", 45, "Existing"),
    ]),
  },
  invalidDateFormat: {
    csv: "Date,Amount,Note\n10-May-2024,45.00,Bad date\n",
    preview: {
      jobId: 114,
      fileName: "invalid-date.csv",
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [
        {
          rowNumber: 1,
          field: "Date",
          message: "Date format not recognized. Use MM/DD/YYYY or YYYY-MM-DD.",
        },
      ],
      duplicates: [],
      canConfirmImport: false,
    },
  },
  summaryCounts: {
    csv: "Date,Amount,Note\n2024-05-01,1.00,A\n",
    preview: {
      jobId: 115,
      fileName: "summary.csv",
      totalRows: 10,
      validRows: 7,
      invalidRows: 2,
      duplicateCount: 1,
      errors: [
        { rowNumber: 8, field: "Amount", message: "Amount must be positive." },
        { rowNumber: 9, field: "Date", message: "Date format not recognized. Use MM/DD/YYYY or YYYY-MM-DD." },
      ],
      duplicates: [
        {
          rowNumber: 10,
          expenseDate: "2024-05-10",
          amount: 45,
          note: "Duplicate row",
          existingMatches: [{ expenseId: 30, expenseDate: "2024-05-10", amount: 45, note: "Existing note" }],
        },
      ],
      canConfirmImport: true,
    },
    summary: { jobId: 115, totalRows: 10, importedRows: 7, skippedRows: 1, failedRows: 2 },
  },
  jobCleanupOnNavigation: {
    csv: "Date,Amount,Note\n2024-05-11,12.00,Cleanup\n",
    preview: {
      jobId: 116,
      fileName: "cleanup.csv",
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateCount: 0,
      errors: [],
      duplicates: [],
      canConfirmImport: true,
    },
    summary: { jobId: 116, totalRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0 },
    historyAfterConfirm: historyResponse([expenseRow(31, "2024-05-11", 12, "Cleanup")]),
  },
};
