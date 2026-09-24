import { useEffect } from "react";

const productTitle = "Reins — One job. One budget. Across every agent.";

export function useDocumentTitle(page: string | null): void {
  useEffect(() => {
    document.title = page === null ? productTitle : `${page} · Reins`;
  }, [page]);
}
