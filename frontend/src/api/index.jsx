import openSocket from "socket.io-client"
import { sleep } from "../util"
const socket = openSocket(document.location.host)
const id = Math.floor(Math.random() * 10000000)
socket.on("debug", (x) => console.log("debug", x))

function getWebclient() {
	socket.emit("registerWebclient", { id })
	return socket
}

let tagListeners = []
let screenListeners = []
;(async () => {
	socket.on("reconnect", async (attempts) => {
		getWebclient()
		console.log("Reconnected after", attempts)
	})
})()

export default {
	onTagChange: function (tagname, callback) {
		let id = Math.random()
		tagListeners.push({
			tagname,
			callback,
			id,
		})
		socket.emit("tagListen", {
			tagname,
		})
		return { id }
	},
}
export { getWebclient }
