import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { io, type Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export interface SocketProviderProps extends PropsWithChildren {
  url: string;
}

export function SocketProvider({ url, children }: SocketProviderProps) {
  const [socket] = useState<Socket>(() =>
    io(url, { transports: ["websocket"], autoConnect: true }),
  );

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const value = useMemo(() => socket, [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
}
