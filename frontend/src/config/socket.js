import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (projectId) => {
    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem("token"),
        },
        query: {
            projectId: projectId,
        },
    });
    return socketInstance;
}

export const receiveMessage = (event,cb) => {
    socketInstance.on(event,cb);
}

export const sendMessage = (event,data) => {
    socketInstance.emit(event,data);
}