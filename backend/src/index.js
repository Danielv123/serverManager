const fs = require("fs")
const mkdirp = require("mkdirp")
const express = require("express")
const http = require("http")
const promclient = require("prom-client")
const process = require("process")

console.log(process.argv)
const port = process.argv[2] === "dev" ? 8082 : 8080

var app = express()
var server = http.createServer(app)
var io = require("socket.io").listen(server)
server.listen(port)
console.log("listening on port ", port)

app.use("/", express.static("build"))
app.get("/info", (req, res) => {
	res.send("Dell server monitor express server")
})

// Set up prometheus
app.get("/metrics", (req, res) => {
	res.send(promclient.register.metrics())
})
promclient.collectDefaultMetrics({
	labels: { application: "serverManager" },
})
const gauge = new promclient.Gauge({
	name: "servermanager_statistics_gauge",
	help: "Contains all gauge statistics from the dell server manager labeled by name and type, ex fan speed or temperature",
	labelNames: ["name", "type", "unit", "address", "host_name"],
})

const units = require("./units")
const { getSensors, enableManualFancontrol, enableAutomaticFancontrol, setFanSpeed } = require("./ipmi")
mkdirp.sync("./data")

let serversOnDisk = ""
try {
	let data = fs.readFileSync("./data/servers.json", "utf8")
	if (data) {
		serversOnDisk = data
		servers = JSON.parse(data)
		console.log("Loaded server data from disk")
	}
} catch (e) {}
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
var servers = servers || [
	{
		name: "R720 main",
		address: "192.168.10.170",
		username: "root",
		password: "calvin",
		warnspeed: "3000",
		sensordataRaw: [],
		sensordata: [],
	},
	{
		name: "R720 secondary",
		address: "192.168.10.169",
		username: "root",
		password: "calvin",
		warnspeed: "3000",
		sensordataRaw: [],
		sensordata: [],
	},
]

// Startup tasks
servers.forEach(async (server) => {
	if (server.manualFanControl) {
		await enableManualFancontrol(server)
	} else {
		await enableAutomaticFancontrol(server)
	}
})

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
				previousValue: config.sensordata[i]?.value,
			}
		})
		broadcast("sensordata", {
			name: config.name,
			sensordata: config.sensordata,
		})
		if (config.manualFanControl) {
			let temperature = config.sensordata
				.filter((x) => x.unit === "degrees C")
				.map((x) => x.value)
				.sort((a, b) => b - a)[0]

			// Determine fan speed
			let table = new Array(100).fill(0)
			table = table.map((_, i) => {
				let num1 = Math.max(0, Math.floor(i / (100 / (config.fancurve.length - 1))))
				let num2 = Math.min(config.fancurve.length - 1, Math.ceil((i + 0.1) / (100 / (config.fancurve.length - 1))))
				// Interpolate between the numbers on the graph
				let diff = config.fancurve[num2] - config.fancurve[num1] // Difference in fan % between 20c and 40c
				let perC = diff / (100 / (config.fancurve.length - 1)) // Difference in fan% between 20c and 21c
				let lowerC = config.fancurve[num1] // Wanted fan% at 20c
				return lowerC + perC * (i / (100 / (config.fancurve.length - 1)) - num1) * 20 // Calculate target fan speed for temperature "i"
			})

			let target_fan_speed = Math.round(table[Math.floor(temperature) || 99])
			console.log("Highest temperature is", temperature, "Setting fan speed", target_fan_speed, "%")
			// Set fan speed on iDRAC
			setFanSpeed(config, target_fan_speed || 40)
		}
	}
	// Report metrics to prometheus
	promclient.register.resetMetrics()
	for (let config of servers) {
		config.sensordata
			.filter((x) => !Number.isNaN(Number(x.value)))
			.forEach((sensor) => {
				gauge.set(
					{
						name: sensor.name,
						type: units.unit_to_type[sensor.unit],
						unit: sensor.unit,
						address: config.address,
						host_name: config.name,
					},
					Number(sensor.value)
				)
			})
	}
}
function broadcast(channel, data) {
	clients.forEach((client) => client.socket.emit(channel, data))
}

async function updateServerLoop() {
	let lastUpdateStart = Date.now()
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
		socket.on("updateServer", async ({ address, update }) => {
			console.log("Updating server", address, cleanSensitive(update))
			let server = servers.find((x) => x.address === address)

			// If we toggled the manualFanControl option, run IPMI to toggle fan control mode
			if (server.manualFanControl !== update.manualFanControl) {
				console.time("Changed fan control state")
				if (update.manualFanControl) {
					await enableManualFancontrol(update)
				} else {
					await enableAutomaticFancontrol(update)
				}
				console.timeEnd("Changed fan control state")
			}

			for (let key of Object.keys(update)) {
				server[key] = update[key]
			}
			broadcast("servers", servers)

			// Reset prometheus gauges in case some of the label names were changed
			promclient.register.resetMetrics()
		})
		socket.on("addServer", ({ server }) => {
			if (
				server &&
				!servers.find((x) => x.address == server.address) &&
				!servers.find((x) => x.name == server.name) &&
				server.name &&
				server.address &&
				server.username &&
				server.password
			) {
				servers.push(server)
				broadcast("servers", servers)
			}
		})
		socket.on("deleteServer", ({ address }) => {
			servers = servers.filter((x) => x.address !== address)
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
function cleanSensitive(object) {
	let clean = { ...object }
	if (clean.password) clean.password = "hidden"
	return clean
}
