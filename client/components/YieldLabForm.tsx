import React, { useEffect, useMemo, useState } from "react";

const HISTORY_KEY = "kb:yield";

const recordId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const todayIso = () => {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

type YieldRecord = {
  id: string;
  ts: number;
  recipe: string;
  code: string;
  method?: string;
  tester?: string;
  testDate?: string;
  input: { qty: number; unit: string };
  measured: { qty: number; unit: string };
  yieldPercent: number | null;
  notes: string;
};

const normalizeUnit = (unit: string) => (unit || "").toUpperCase();

const toRecord = (item: any, fallbackName: string): YieldRecord => {
  const ts = Number(item?.ts || Date.now());
  const method = item?.method ? String(item.method) : "";
  const tester = item?.tester ? String(item.tester) : "";
  const testDate = item?.testDate
    ? String(item.testDate)
    : Number.isFinite(ts)
      ? new Date(ts).toISOString().slice(0, 10)
      : "";
  return {
    id: String(item?.id || `${ts}-${item?.code || "test"}`),
    ts,
    recipe: String(item?.recipe || fallbackName || "Untitled"),
    code: String(item?.code || ""),
    method,
    tester,
    testDate,
    input: {
      qty: Number(item?.input?.qty ?? 0),
      unit: normalizeUnit(String(item?.input?.unit || "")),
    },
    measured: {
      qty: Number(item?.measured?.qty ?? 0),
      unit: normalizeUnit(String(item?.measured?.unit || "")),
    },
    yieldPercent:
      item?.yieldPercent == null ? null : Number(item.yieldPercent),
    notes: String(item?.notes || ""),
  };
};

const readHistory = (fallbackName: string): YieldRecord[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => toRecord(item, fallbackName)).sort((a, b) => b.ts - a.ts);
  } catch {
    return [];
  }
};

const writeHistory = (records: YieldRecord[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
};

const volumeToMl = (qty: number, unit: string): number | null => {
  const U: Record<string, number> = {
    ML: 1,
    L: 1000,
    TSP: 4.92892,
    TBSP: 14.7868,
    "FL OZ": 29.5735,
    OZ: 29.5735,
    CUP: 236.588,
    PINT: 473.176,
    PT: 473.176,
    QTS: 946.353,
    QT: 946.353,
    GALLON: 3785.41,
    GAL: 3785.41,
  };
  const key = normalizeUnit(unit);
  if (!Number.isFinite(qty) || qty < 0) return null;
  return U[key] ? qty * U[key] : null;
};

const massToG = (qty: number, unit: string): number | null => {
  const U: Record<string, number> = {
    G: 1,
    GRAM: 1,
    GRAMS: 1,
    KG: 1000,
    LBS: 453.592,
    LB: 453.592,
    OZ: 28.3495,
  };
  const key = normalizeUnit(unit);
  if (!Number.isFinite(qty) || qty < 0) return null;
  return U[key] ? qty * U[key] : null;
};

const sameDimension = (a: string, b: string) => {
  const volUnits = new Set([
    "ML",
    "L",
    "TSP",
    "TBSP",
    "FL OZ",
    "OZ",
    "CUP",
    "PINT",
    "PT",
    "QTS",
    "QT",
    "GALLON",
    "GAL",
  ]);
  const massUnits = new Set(["G", "GRAM", "GRAMS", "KG", "LBS", "LB", "OZ"]);
  const A = normalizeUnit(a);
  const B = normalizeUnit(b);
  return (volUnits.has(A) && volUnits.has(B)) || (massUnits.has(A) && massUnits.has(B));
};

type YieldLabFormProps = {
  defaultInputQty: number;
  defaultInputUnit: string;
  recipeName: string;
  defaultMethod?: string;
  methodOptions?: string[];
  onClose: () => void;
};

const inputClass = "rounded-md border bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40";

const cardClass = "rounded-lg border bg-background/40 p-3";

const YieldLabForm: React.FC<YieldLabFormProps> = ({
  defaultInputQty,
  defaultInputUnit,
  recipeName,
  defaultMethod,
  methodOptions = [],
  onClose,
}) => {
  const [code, setCode] = useState("");
  const [method, setMethod] = useState(defaultMethod || "");
  const [tester, setTester] = useState("");
  const [testDate, setTestDate] = useState(todayIso);
  const [inputQty, setInputQty] = useState<number>(defaultInputQty || 0);
  const [inputUnit, setInputUnit] = useState<string>(normalizeUnit(defaultInputUnit));
  const [measQty, setMeasQty] = useState<number>(0);
  const [measUnit, setMeasUnit] = useState<string>(normalizeUnit(defaultInputUnit));
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [history, setHistory] = useState<YieldRecord[]>(() => readHistory(recipeName));

  useEffect(() => {
    if (defaultMethod) setMethod(defaultMethod);
  }, [defaultMethod]);

  useEffect(() => {
    setMeasUnit((prev) => prev || inputUnit);
  }, [inputUnit]);

  const methodListId = useMemo(
    () => `yield-methods-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const availableMethods = useMemo(
    () =>
      Array.from(
        new Set((methodOptions || []).map((value) => value.trim()).filter(Boolean)),
      ),
    [methodOptions],
  );

  const historyMethods = useMemo(
    () =>
      Array.from(
        new Set(history.map((record) => (record.method || "").trim()).filter(Boolean)),
      ),
    [history],
  );

  const methodSuggestions = useMemo(
    () => Array.from(new Set([...availableMethods, ...historyMethods])),
    [availableMethods, historyMethods],
  );

  const computeYieldPct = () => {
    if (!Number.isFinite(inputQty) || inputQty <= 0) return null;
    if (!Number.isFinite(measQty) || measQty < 0) return null;
    const A = normalizeUnit(inputUnit);
    const B = normalizeUnit(measUnit);
    if (!sameDimension(A, B)) return null;
    const inBase = volumeToMl(inputQty, A) ?? massToG(inputQty, A);
    const outBase = volumeToMl(measQty, B) ?? massToG(measQty, B);
    if (inBase == null || outBase == null || inBase === 0) return null;
    return Math.max(0, Math.min(9999, (outBase / inBase) * 100));
  };

  const pct = computeYieldPct();

  const filteredHistory = useMemo(() => {
    const query = method.trim().toLowerCase();
    if (!query) return history;
    return history.filter(
      (record) => record.method && record.method.toLowerCase() === query,
    );
  }, [history, method]);

  const handleSave = () => {
    const methodName = method.trim();
    if (!methodName) {
      setFormError("Enter the method that was tested before saving.");
      return;
    }
    const percent = computeYieldPct();
    const record: YieldRecord = {
      id: recordId(),
      ts: Date.now(),
      recipe: recipeName || "Untitled",
      code: code.trim(),
      method: methodName,
      tester: tester.trim(),
      testDate: testDate || todayIso(),
      input: { qty: Number(inputQty), unit: normalizeUnit(inputUnit) },
      measured: { qty: Number(measQty), unit: normalizeUnit(measUnit) },
      yieldPercent:
        percent == null || !Number.isFinite(percent)
          ? null
          : Number(percent.toFixed(2)),
      notes: notes.trim(),
    };
    setHistory((prev) => {
      const next = [record, ...prev].slice(0, 200);
      writeHistory(next);
      return next;
    });
    setFormError(null);
    onClose();
  };

  const handleLoadRecord = (record: YieldRecord) => {
    setCode(record.code || "");
    setMethod(record.method || "");
    setTester(record.tester || "");
    setTestDate(record.testDate || todayIso());
    setInputQty(record.input.qty || 0);
    setInputUnit(normalizeUnit(record.input.unit));
    setMeasQty(record.measured.qty || 0);
    setMeasUnit(normalizeUnit(record.measured.unit));
    setNotes(record.notes || "");
  };

  const handleClearFilter = () => setMethod("");

  return (
    <div className="space-y-4 text-sm">
      {formError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600">
          {formError}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Test code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
            placeholder="e.g., YLD-001"
          />
        </label>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs text-muted-foreground">Method name</span>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={inputClass}
            list={methodSuggestions.length ? methodListId : undefined}
            placeholder="Fermenting, sous vide, etc."
          />
          {methodSuggestions.length > 0 && (
            <datalist id={methodListId}>
              {methodSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          )}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Tester</span>
          <input
            value={tester}
            onChange={(e) => setTester(e.target.value)}
            className={inputClass}
            placeholder="Chef's name"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Test date</span>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">Yield %</span>
          <div className="rounded-md border bg-background px-2 py-2 text-sm font-semibold">
            {pct == null ? "—" : pct.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cardClass}>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Input
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <input
                type="number"
                value={inputQty}
                onChange={(e) => setInputQty(Number(e.target.value))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Unit</span>
              <input
                value={inputUnit}
                onChange={(e) => setInputUnit(normalizeUnit(e.target.value))}
                className={inputClass}
                placeholder="QTS"
              />
            </label>
          </div>
        </div>
        <div className={cardClass}>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Measured output
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <input
                type="number"
                value={measQty}
                onChange={(e) => setMeasQty(Number(e.target.value))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Unit</span>
              <input
                value={measUnit}
                onChange={(e) => setMeasUnit(normalizeUnit(e.target.value))}
                className={inputClass}
                placeholder="L"
              />
            </label>
          </div>
        </div>
      </div>

      <label className="grid gap-1">
        <span className="text-xs text-muted-foreground">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-md border bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Observations, prep adjustments, lab commentary"
        />
      </label>

      <div className="flex flex-wrap justify-end gap-3 text-sm">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-muted-foreground hover:bg-muted"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md border border-primary bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:opacity-90"
          onClick={handleSave}
        >
          Save test
        </button>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>
            Recent tests{method.trim() ? ` for ${method.trim()}` : ""}
          </span>
          {method.trim() && (
            <button
              type="button"
              className="text-muted-foreground underline"
              onClick={handleClearFilter}
            >
              Show all
            </button>
          )}
        </div>
        <div className="mt-2 max-h-56 overflow-auto rounded border">
          {filteredHistory.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No tests logged yet.
            </div>
          ) : (
            <table className="min-w-full text-xs">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Method</th>
                  <th className="p-2 text-left">Tester</th>
                  <th className="p-2 text-left">Input</th>
                  <th className="p-2 text-left">Measured</th>
                  <th className="p-2 text-right">Yield %</th>
                  <th className="p-2 text-right">Load</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="p-2">{record.testDate || new Date(record.ts).toLocaleDateString()}</td>
                    <td className="p-2">{record.method || "—"}</td>
                    <td className="p-2">{record.tester || "—"}</td>
                    <td className="p-2">
                      {record.input.qty} {record.input.unit}
                    </td>
                    <td className="p-2">
                      {record.measured.qty} {record.measured.unit}
                    </td>
                    <td className="p-2 text-right">
                      {record.yieldPercent == null
                        ? "—"
                        : record.yieldPercent.toFixed(2)}
                    </td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        className="rounded border px-2 py-1 hover:bg-muted"
                        onClick={() => handleLoadRecord(record)}
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default YieldLabForm;
