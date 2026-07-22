export function useTimezone() {
  const timezone = useState<string>("timezone", () => {
    if (import.meta.client) {
      return localStorage.getItem("timezone") || "local";
    }
    return "local";
  });

  function setTimezone(tz: string) {
    timezone.value = tz;
    if (import.meta.client) {
      localStorage.setItem("timezone", tz);
    }
  }

  function getTimezoneOffset(): string {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? "+" : "-";
    return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const d = new Date(date);
    if (timezone.value === "utc") {
      return d.toLocaleString("zh-CN", { ...options, timeZone: "UTC" });
    }
    return d.toLocaleString("zh-CN", options);
  }

  return {
    timezone: computed(() => timezone.value),
    setTimezone,
    getTimezoneOffset,
    formatDate,
  };
}
