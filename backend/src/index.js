const fs = require("fs")
const mkdirp = require("mkdirp")
const express = require("express")
const http = require("http")

const port = 8080

var app = express()
var server = http.createServer(app)
var io = require("socket.io").listen(server)
server.listen(port)
console.log("listening on port ", port)

app.use("/", express.static("build"))
app.get("/info", (req, res) => {
	res.send("Dell server monitor express server")
})

const { getSensors } = require("./ipmi")
mkdirp.sync("./data")

let serversOnDisk = ""
try {
	let data = fs.readFileSync("./data/servers.json", "utf8")
	if (data) {
		serversOnDisk = data
		servers = JSON.parse(data)
		console.log("Loaded server data from disk")
	}
} catch (e) { }
function save() {
	if (JSON.stringify(servers, null, 4) !== serversOnDisk) {
		serversOnDisk = JSON.stringify(servers, null, 4)
		fs.writeFileSync("./data/servers.json", JSON.stringify(servers, null, 4))
		// console.log(Date.now() + "Saved servers")
	}
}
setInterval(save, 60 * 1000) // Autosave once a minute if there are changes
const clients = [
	//     {
	//     id: 1234,
	//     tagListeners: [{tagname: "testTag"}],
	//     socket: {},
	// }
]
var servers = servers || [{
	name: "R720 main",
	address: "192.168.10.170",
	username: "root",
	password: "calvin",
	sensordataRaw: [],
	sensordata: []
}, {
	name: "R720 secondary",
	address: "192.168.10.169",
	username: "root",
	password: "calvin",
	sensordataRaw: [],
	sensordata: []
}]

async function updateServers() {
	for (let i in servers) {
		let config = servers[i]
		config.sensordataRaw = await getSensors(config)
		// Transform sensor data into easier to use format
		config.sensordata = config.sensordataRaw.map((sensor, i) => {
			return {
				name: sensor[0],
				value: sensor[1],
				unit: sensor[2],
				status: sensor[3],
				x: sensor[4],
				ALL: sensor[5],
				WL: sensor[6],
				WH: sensor[7],
				AHH: sensor[8],
				y: sensor[9],
				trend: Number(sensor[1]) - Number(config.sensordata[i]?.previousValue) || undefined,
				previousValue: config.sensordata[i]?.value
			}
		})
		broadcast("sensordata", {
			name: config.name,
			sensordata: config.sensordata,
		})
	}
}
function broadcast(channel, data) {
	clients.forEach(client => client.socket.emit(channel, data))
}

let lastUpdateStart = Date.now()
async function updateServerLoop() {
	console.time("updateServers")
	await updateServers()
	console.timeEnd("updateServers")
	setTimeout(updateServerLoop, lastUpdateStart - Date.now() + 30000)
}
updateServerLoop()

io.on("connection", (socket) => {
	socket.on("registerWebclient", ({ id }) => {
		console.log("client is subscribing to timer with interval ")
		let client = {
			socket,
			id,
			tagListeners: [],
			screenListeners: [],
		}
		clients.push(client)
		socket.emit("servers", servers)
		socket.on("updateServer", ({ address, update }) => {
			console.log("Updating server", address, update)
			let server = servers.find(x => x.address === address)
			for (let key of Object.keys(update)) {
				server[key] = update[key]
			}
			broadcast("servers", servers)
		})
		socket.on("addServer", ({ server }) => {
			if (
				server
				&& !servers.find(x => x.address == server.address)
				&& !servers.find(x => x.name == server.name)
				&& server.name
				&& server.address
				&& server.username
				&& server.password
				&& Object.keys(server).length === 4
			) {
				servers.push(server)
				broadcast("servers", servers)
			}
		})
		socket.on("deleteServer", ({ address }) => {
			servers = servers.filter(x => x.address !== address)
			broadcast("servers", servers)
		})
		// socket.on("tagListen", ({ tagname, interval }) => {
		// 	console.log("Adding listener for", tagname)
		// 	client.tagListeners.push({ tagname })
		// 	let tag = getTag(tagname)
		// 	if (tag) socket.emit("tagValue", [tag])
		// })

		// setInterval(() => {
		//     socket.emit('debug', new Date());
		//     //   socket.emit("tagValue", tags)
		// }, 1000);
	})
})
