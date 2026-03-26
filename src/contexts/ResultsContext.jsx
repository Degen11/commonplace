import { createContext, useContext } from "react";

const ResultsContext = createContext(null);

export function ResultsProvider({ value, children }) {
  return (
    <ResultsContext.Provider value={value}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResultsContext() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error("useResultsContext must be used within ResultsProvider");
  return ctx;
}
