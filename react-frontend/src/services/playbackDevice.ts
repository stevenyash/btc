const STORAGE_KEY = "btc_playback_device_id";

export function getPlaybackDeviceId(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && /^[a-zA-Z0-9_-]{16,128}$/.test(saved)) {
    return saved;
  }

  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
