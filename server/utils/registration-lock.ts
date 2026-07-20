/**
 * Global registration lock — ensures "first user = admin" is atomic.
 * Only wraps user creation + admin check, NOT address allocation
 * (which is async and should not block other registrations).
 */

let registrationLock: Promise<void> | null = null;

export async function acquireRegistrationLock(): Promise<() => void> {
  while (registrationLock) {
    await registrationLock;
  }

  let release: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    release = resolve;
  });

  registrationLock = lockPromise;

  return () => {
    registrationLock = null;
    release!();
  };
}
