import io from "socket.io-client"

const socketOrigin = import.meta.env.VITE_SOCKET_ORIGIN ?? window.location.origin
const socket = io(socketOrigin, {
	path: "/socket.io",
	transports: ["websocket", "polling"],
})
const id = Math.floor(Math.random() * 10000000)
socket.on("debug", (x) => console.log("debug", x))

function getWebclient() {
	socket.emit("registerWebclient", { id })
	return socket
}

socket.on("reconnect", async (attempts) => {
	getWebclient()
	console.log("Reconnected after", attempts)
})

export { getWebclient }
