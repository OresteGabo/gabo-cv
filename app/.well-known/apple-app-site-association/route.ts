// Must match the signing Team ID and bundle identifier of the iOS app.
export function GET() {
  return Response.json(
    { webcredentials: { apps: ["X5HS2K2N42.dev.orestegabo.portfolio.Portfolio"] } },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
