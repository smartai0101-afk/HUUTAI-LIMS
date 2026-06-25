let bodyLockCount = 0;

export function lockBodyScroll() {
  bodyLockCount += 1;
  if (bodyLockCount === 1) {
    document.body.style.overflow = "hidden";
  }
}

export function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";
  }
}
