/** GA4 measurement ID — supports both env var names used across deployments. */
export function getGaMeasurementId(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GA_ID?.trim() ||
    undefined
  );
}
