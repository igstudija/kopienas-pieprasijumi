"use client";

import { ChangeEvent, useState } from "react";
import { useLanguage } from "./language-provider";
import { adminCopy } from "@/lib/admin-i18n";
import { fetchJson, jsonRequest } from "@/lib/client-api";

type ImportField = "firstName" | "lastName" | "company" | "phone" | "category" | "email";
type Mapping = Record<ImportField, string>;
type SpreadsheetRow = { rowNumber: number; cells: string[] };
type ImportResult = { imported: number; errors: Array<{ row: number; message: string }> };

const fields: Array<{ key: ImportField; required: boolean }> = [
  { key: "firstName", required: true },
  { key: "lastName", required: true },
  { key: "company", required: true },
  { key: "phone", required: true },
  { key: "category", required: false },
  { key: "email", required: false },
];

const emptyMapping: Mapping = { firstName: "", lastName: "", company: "", phone: "", category: "", email: "" };

export function ExcelUserImport({ onImported, onCancel }: {
  onImported: (result: ImportResult) => Promise<void>;
  onCancel: () => void;
}) {
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const fieldLabels: Record<ImportField, string> = { firstName: copy.firstName, lastName: copy.lastName, company: copy.company, phone: copy.phone, category: copy.category, email: copy.email };
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [mapping, setMapping] = useState<Mapping>(emptyMapping);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setHeaders([]);
    setRows([]);
    if (file.size > 5 * 1024 * 1024) {
      setError(copy.excelFileTooLarge);
      return;
    }
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", sheetRows: 502 });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
      if (!sheet) throw new Error(copy.excelNoSheet);
      const rawRows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(sheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false,
      });
      if (rawRows.length < 2) throw new Error(copy.excelNeedRows);
      const parsedHeaders = uniqueHeaders(rawRows[0].map((value, index) => String(value).trim() || `Kolonna ${index + 1}`));
      const parsedRows = rawRows.slice(1)
        .map((cells, index) => ({ rowNumber: index + 2, cells: cells.map((value) => String(value).trim()) }))
        .filter((row) => row.cells.some(Boolean));
      if (!parsedRows.length) throw new Error(copy.excelNoRows);
      if (parsedRows.length > 500) throw new Error(copy.excelTooManyRows);
      setFileName(file.name);
      setSheetName(firstSheetName);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setMapping(autoMatch(parsedHeaders));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.excelReadError);
    } finally {
      setLoading(false);
    }
  }

  async function importRows() {
    setError("");
    setResult(null);
    const missing = fields.filter((field) => field.required && !mapping[field.key]);
    if (missing.length) {
      setError(`${copy.excelChooseFields}: ${missing.map((field) => fieldLabels[field.key]).join(", ")}.`);
      return;
    }
    const selected = Object.values(mapping).filter(Boolean);
    if (new Set(selected).size !== selected.length) {
      setError(copy.excelDuplicateColumn);
      return;
    }
    setLoading(true);
    try {
      const payload = rows.map((row) => ({
        rowNumber: row.rowNumber,
        firstName: mappedValue(row, mapping.firstName),
        lastName: mappedValue(row, mapping.lastName),
        company: mappedValue(row, mapping.company),
        phone: mappedValue(row, mapping.phone),
        category: mappedValue(row, mapping.category),
        email: mappedValue(row, mapping.email),
      }));
      const nextResult = await fetchJson<ImportResult>("/api/v1/admin/users/import", jsonRequest("POST", { rows: payload }));
      setResult(nextResult);
      await onImported(nextResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.excelImportError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="excel-import">
      <label className="excel-dropzone">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={readFile} disabled={loading} />
        <b>{fileName || copy.excelChooseFile}</b>
        <span>{fileName ? `${copy.excelSheet}: ${sheetName} · ${rows.length} ${copy.excelRows}` : copy.excelFileHelp}</span>
      </label>

      {headers.length > 0 && (
        <>
          <section className="column-matcher">
            <header><div><b>{copy.excelMatcher}</b><span>{copy.excelMatcherHelp}</span></div><small>* {copy.excelRequired}</small></header>
            <div className="matcher-grid">
              {fields.map((field) => (
                <label key={field.key}>{fieldLabels[field.key]}{field.required ? " *" : ""}
                  <select className="field" value={mapping[field.key]} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}>
                    <option value="">{field.required ? copy.excelChooseColumn : copy.excelSkip}</option>
                    {headers.map((header, index) => <option value={String(index)} key={`${header}-${index}`}>{header}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section className="import-preview">
            <header><b>{copy.excelPreview}</b><span>{copy.excelPreviewHelp} ({Math.min(5, rows.length)})</span></header>
            <div className="preview-table-wrap"><table><thead><tr>{fields.slice(0, 4).map((field) => <th key={field.key}>{fieldLabels[field.key]}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row) => <tr key={row.rowNumber}>{fields.slice(0, 4).map((field) => <td key={field.key}>{mappedValue(row, mapping[field.key]) || "—"}</td>)}</tr>)}</tbody></table></div>
          </section>
        </>
      )}

      {error && <div className="form-error">{error}</div>}
      {result && <div className={result.errors.length ? "import-result has-errors" : "import-result"}><b>{copy.excelImported}: {result.imported}</b><span>{copy.excelSkipped}: {result.errors.length}</span>{result.errors.length > 0 && <ul>{result.errors.slice(0, 50).map((item) => <li key={`${item.row}-${item.message}`}>{copy.excelRow} {item.row}: {item.message}</li>)}</ul>}</div>}
      <div className="modal-actions">
        <button className="button button-ghost" type="button" onClick={onCancel} disabled={loading}>{copy.close}</button>
        <button className="button button-accent" type="button" onClick={importRows} disabled={loading || !rows.length || Boolean(result)}>{loading ? copy.excelProcessing : `${copy.excelImport} ${rows.length || ""}`}</button>
      </div>
    </div>
  );
}

function mappedValue(row: SpreadsheetRow, column: string) {
  if (column === "") return "";
  return row.cells[Number(column)] ?? "";
}

function uniqueHeaders(headers: string[]) {
  const counts = new Map<string, number>();
  return headers.map((header) => {
    const count = (counts.get(header) ?? 0) + 1;
    counts.set(header, count);
    return count === 1 ? header : `${header} (${count})`;
  });
}

function autoMatch(headers: string[]): Mapping {
  const normalized = headers.map(normalizeHeader);
  const aliases: Record<ImportField, string[]> = {
    firstName: ["vards", "firstname", "firstnamegiven", "givenname"],
    lastName: ["uzvards", "lastname", "surname", "familyname"],
    company: ["uznemums", "company", "organization", "organisation", "firma"],
    phone: ["talrunis", "telefons", "phone", "mobile", "mobilais", "whatsapp", "phonenumber"],
    category: ["nozare", "kategorija", "category", "industry", "specializacija"],
    email: ["epasts", "email", "emailaddress", "mail"],
  };
  return Object.fromEntries(fields.map((field) => {
    const index = normalized.findIndex((header) => aliases[field.key].includes(header));
    return [field.key, index >= 0 ? String(index) : ""];
  })) as Mapping;
}

function normalizeHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
