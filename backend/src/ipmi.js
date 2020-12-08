var exec = require("child_process").exec

function getSensors(config) {
	return new Promise((resolve) => {
		let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P ${config.password} sensor`
		exec(command, (error, out, err) => {
			if (error) console.error(error)
			if (err) console.error(err)
			let data = out
				.split("\n")
				.map((x) => x.split("|").map((y) => y.trim()))
				.filter((x) => x[1] !== "na" && x[0])
			// console.log(data)
			resolve(data)
		})
	})
}
function enableManualFancontrol(config) {
	return new Promise((resolve) => {
		let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P ${config.password} raw 0x30 0x30 0x01 0x00`
		exec(command, (error, out, err) => {
			// console.log(error, out, err)
			// console.log(data)
			resolve(out)
		})
	})
}
function enableAutomaticFancontrol(config) {
	return new Promise((resolve) => {
		let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P ${config.password} raw 0x30 0x30 0x01 0x01`
		exec(command, (error, out, err) => {
			// console.log(error, out, err)
			// console.log(data)
			resolve(out)
		})
	})
}
function setFanSpeed(config, speed) {
	return new Promise((resolve) => {
		if (process.argv[2] !== "dev") {
			var command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P ${config.password} raw 0x30 0x30 0x02 0xff 0x${speed.toString(16).padStart(2, "0")}`
		} else {
			var command = "ls"
		}
		exec(command, (error, out, err) => {
			// console.log(error, out, err)
			// console.log(data)
			resolve(out)
		})
	})
}

module.exports = {
	getSensors,
	enableManualFancontrol,
	enableAutomaticFancontrol,
	setFanSpeed,
}
