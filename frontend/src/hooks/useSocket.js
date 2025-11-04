import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(onEvent) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    if (onEvent) socket.on("newEvent", onEvent);
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return socketRef;
}
