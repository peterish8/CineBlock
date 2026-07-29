let lockCount = 0;

/** Hide page scroll + blue glass-theme scrollbar gutter while modals are open. */
export function lockPageScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  lockCount += 1;
  document.documentElement.classList.add("scroll-lock");
  document.body.classList.add("scroll-lock");

  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.documentElement.classList.remove("scroll-lock");
      document.body.classList.remove("scroll-lock");
    }
  };
}
