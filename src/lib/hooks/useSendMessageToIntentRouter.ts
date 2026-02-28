import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SendToIntentRouterParams {
  message: string;
  [key: string]: unknown;
}

export interface UseSendMessageToIntentRouterOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function useSendMessageToIntentRouter(options?: UseSendMessageToIntentRouterOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown>(null);

  const send = useCallback(
    async (params: SendToIntentRouterParams) => {
      const { message, ...rest } = params;
      if (!message || typeof message !== "string") {
        const err = new Error("message is required and must be a string");
        setError(err);
        options?.onError?.(err);
        return { data: null, error: err };
      }

      setLoading(true);
      setError(null);
      setData(null);

      try {
        const { data: result, error: invokeError } = await supabase.functions.invoke("intent-router", {
          body: { message, ...rest },
        });

        if (invokeError) {
          const err = new Error(invokeError.message || "intent-router request failed");
          setError(err);
          options?.onError?.(err);
          return { data: null, error: err };
        }

        setData(result);
        options?.onSuccess?.(result);
        return { data: result, error: null };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        options?.onError?.(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { send, loading, error, data };
}
