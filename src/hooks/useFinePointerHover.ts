import { useEffect, useState } from "react";

/** True on laptop/desktop with mouse — false on touch-first phones. */
export function useFinePointerHover(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return enabled;
}
