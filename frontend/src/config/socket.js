import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (projectId) => {
    if (socketInstance) {
        socketInstance.disconnect();
    }

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
    if (!socketInstance) return;
    socketInstance.off(event, cb);
    socketInstance.on(event,cb);
}

export const sendMessage = (event,data) => {
    if (!socketInstance) return;
    socketInstance.emit(event,data);
}

export const disconnectSocket = () => {
    if (!socketInstance) return;
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
}
