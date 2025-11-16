import { useCallback, useState, useEffect } from "react";
import {
  searchProcedures,
  getProceduresByCategory,
  getProceduresByBook,
  getAllProcedures,
  storeProcedure,
} from "@/lib/echo-procedures-service";
import type {
  CulinaryProcedure,
  ProcedureSearchResult,
} from "@/lib/echo-procedures-service";

/**
 * Hook for accessing and managing Echo culinary procedures globally
 * Procedures are accessible from R&D, Recipe Editor, and anywhere in the app
 */
export function useEchoProcedures() {
  const [procedures, setProcedures] = useState<CulinaryProcedure[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all procedures on mount
  useEffect(() => {
    setProcedures(getAllProcedures());
  }, []);

  const search = useCallback(async (query: string, limit?: number) => {
    setLoading(true);
    try {
      const results = await searchProcedures(query, limit);
      return results;
    } finally {
      setLoading(false);
    }
  }, []);

  const getByCategory = useCallback(
    (category: CulinaryProcedure["category"]) => {
      return getProceduresByCategory(category);
    },
    [],
  );

  const getByBook = useCallback((bookName: string) => {
    return getProceduresByBook(bookName);
  }, []);

  const add = useCallback(
    async (
      procedure: Omit<CulinaryProcedure, "id" | "created_at" | "embedding">,
    ) => {
      try {
        const newProcedure = await storeProcedure(procedure);
        setProcedures((prev) => [...prev, newProcedure]);
        return newProcedure;
      } catch (error) {
        console.error("Error storing procedure:", error);
        throw error;
      }
    },
    [],
  );

  const refresh = useCallback(() => {
    setProcedures(getAllProcedures());
  }, []);

  return {
    procedures,
    loading,
    search,
    getByCategory,
    getByBook,
    add,
    refresh,
    total: procedures.length,
  };
}
