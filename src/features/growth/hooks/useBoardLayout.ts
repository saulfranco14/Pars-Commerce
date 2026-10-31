import { useEffect, useState } from "react";

import type { BoardLayout } from "@/features/growth/interfaces/pipeline";

const STORAGE_KEY = "tlaco_growth_board_layout";

/** Board or list on wide screens, remembered per browser; phones always get the list. */
export function useBoardLayout(): [BoardLayout, (layout: BoardLayout) => void] {
  const [layout, setLayout] = useState<BoardLayout>("tablero");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "lista") setLayout("lista");
    } catch {
      // Private mode: start on the board.
    }
  }, []);

  function choose(next: BoardLayout) {
    setLayout(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice lasts until the page reloads.
    }
  }

  return [layout, choose];
}
