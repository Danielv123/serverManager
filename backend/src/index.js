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

// try {
// 	let data = fs.readFileSync("./data/screens.json", "utf8")
// 	if (data) {
// 		screensOnDisk = data
// 		screens = JSON.parse(data)
// 		console.log("Loaded screen data from disk")
// 	}
// } catch (e) {}
// function save() {
// 	if (JSON.stringify(screens, null, 4) !== screensOnDisk) {
// 		screensOnDisk = JSON.stringify(screens, null, 4)
// 		fs.writeFileSync("./data/screens.json", JSON.stringify(screens, null, 4))
// 		console.log("Saved screens")
// 	}
// }
// setInterval(save, 10000)
const clients = [
	//     {
	//     id: 1234,
	//     tagListeners: [{tagname: "testTag"}],
	//     socket: {},
	// }
]
const servers = [{
	name: "R720 main",
	address: "192.168.10.170",
	username: "root",
	password: "Monster123",
	sensordataRaw: [],
	sensordata: []
},{
	name: "R720 secondary",
	address: "192.168.10.169",
	username: "root",
	password: "Monster123",
	sensordataRaw: [],
	sensordata: []
}]

async function updateServers() {
	for (let i in servers) {
		let config = servers[i]
		config.sensorDataRaw = await getSensors(config)
		// Transform sensor data into easier to use format
		config.sensordata = config.sensorDataRaw.map((sensor, i) => {
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
