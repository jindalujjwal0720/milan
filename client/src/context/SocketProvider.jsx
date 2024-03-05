import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

/**
 * @typedef {import("socket.io-client").Socket} Socket
 */
const SocketContext = createContext();

/**
 * @returns {Socket}
 */
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = (props) => {
  /**
   * @type {Socket}
   */
  const socket = useMemo(() => io(process.env.REACT_APP_SERVER_URL), []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
