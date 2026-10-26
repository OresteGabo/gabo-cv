export const DEFAULT_PORTFOLIO_API_ORIGIN = "https://gabo-portfolio-api-639858675564.europe-west1.run.app";

export function portfolioApiOrigin(value = process.env.BONDS_API_ORIGIN, production = process.env.NODE_ENV === "production") {
  const configured = value?.trim() || DEFAULT_PORTFOLIO_API_ORIGIN;
  const url = new URL(configured);
  const localHttp = !production && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BONDS_API_ORIGIN must be an HTTPS origin, or a loopback HTTP origin in development.");
  }
  return url.origin;
}
