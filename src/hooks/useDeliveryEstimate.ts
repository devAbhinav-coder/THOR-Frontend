import { useEffect, useState } from "react";
import { storefrontApi } from "@/lib/api";
import type { DeliveryEstimate } from "@/lib/deliveryEstimate";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function useDeliveryEstimate(pincode: string | null | undefined) {
  const normalized =
    pincode?.replace(/\D/g, "").slice(0, 6) ?? "";
  const debouncedPin = useDebouncedValue(
    normalized.length === 6 ? normalized : "",
    400,
  );

  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedPin) {
      setEstimate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setEstimate((prev) => (prev?.pincode === debouncedPin ? prev : null));
    setIsLoading(true);
    setError(null);

    storefrontApi
      .getShippingEstimate(debouncedPin)
      .then((res) => {
        if (!cancelled) setEstimate(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setEstimate(null);
          setError(
            err instanceof Error ?
              err.message
            : "Could not check delivery for this pincode.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedPin]);

  return {
    estimate,
    isLoading,
    error,
    hasValidPincode: debouncedPin.length === 6,
  };
}
