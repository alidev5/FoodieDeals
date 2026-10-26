import { RealtimeClient } from "@supabase/realtime-js";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

const RealtimeContext = createContext<RealtimeClient | null>(null);

export interface RealtimeProviderProps extends PropsWithChildren {
  /** The Supabase project URL. Without it (e.g. the docker-compose setup) the apps poll instead. */
  url?: string;
  /** The project's public anon / publishable key. */
  apiKey?: string;
}

export function RealtimeProvider({ url, apiKey, children }: RealtimeProviderProps) {
  const [client] = useState(() =>
    url && apiKey
      ? new RealtimeClient(`${url.replace(/^http/, "ws")}/realtime/v1`, {
          params: { apikey: apiKey },
        })
      : null,
  );

  useEffect(() => {
    return () => {
      client?.disconnect();
    };
  }, [client]);

  return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>;
}

export type BroadcastHandlers = Record<string, (payload: unknown) => void>;

/**
 * Subscribes to a broadcast channel while `topic` is set. Returns whether the channel is live;
 * callers poll while it isn't, so updates still arrive without realtime or after a dropped socket.
 * `onLive` runs on every (re)subscribe, which is where callers refetch anything they missed.
 */
export function useBroadcast(
  topic: string | null,
  handlers: BroadcastHandlers,
  onLive?: () => void,
): boolean {
  const client = useContext(RealtimeContext);
  const [isLive, setIsLive] = useState(false);
  const handlersRef = useRef(handlers);
  const onLiveRef = useRef(onLive);
  handlersRef.current = handlers;
  onLiveRef.current = onLive;
  const events = Object.keys(handlers).sort().join("|");

  useEffect(() => {
    if (!client || !topic) {
      setIsLive(false);
      return;
    }

    const channel = client.channel(topic);
    for (const event of events.split("|").filter(Boolean)) {
      channel.on("broadcast", { event }, (message: { payload?: unknown }) =>
        handlersRef.current[event]?.(message.payload),
      );
    }
    channel.subscribe((status) => {
      const live = status === "SUBSCRIBED";
      setIsLive(live);
      if (live) onLiveRef.current?.();
    });

    return () => {
      setIsLive(false);
      void client.removeChannel(channel);
    };
  }, [client, topic, events]);

  return isLive;
}
