const DEFAULT_FAN_SPEED = 40

function normalizeFanCurve(fancurve) {
	if (!Array.isArray(fancurve)) return null
	const normalized = fancurve
		.map((value) => {
			const numeric = Number(value)
			return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : null
		})
		.filter((value) => value !== null)
	if (normalized.length < 2) return null
	return normalized
}

function buildFanTable(fancurve, tableSize = 100) {
	const segments = fancurve.length - 1
	if (segments <= 0) return new Array(tableSize).fill(fancurve[0] ?? DEFAULT_FAN_SPEED)
	const maxIndex = tableSize - 1
	return new Array(tableSize).fill(0).map((_, i) => {
		const position = (i / maxIndex) * segments
		const lowerIndex = Math.floor(position)
		const upperIndex = Math.min(fancurve.length - 1, Math.ceil(position))
		const fraction = position - lowerIndex
		const lowerValue = fancurve[lowerIndex]
		const upperValue = fancurve[upperIndex]
		return lowerValue + (upperValue - lowerValue) * fraction
	})
}

function getHighestTemperature(sensordata = []) {
	const temperatures = sensordata
		.filter((sensor) => sensor && sensor.unit === "degrees C")
		.map((sensor) => Number(sensor.value))
		.filter((value) => Number.isFinite(value))
	if (!temperatures.length) return null
	return Math.max(...temperatures)
}

function calculateManualFanSpeed(config = {}) {
	const highestTemperature = getHighestTemperature(config.sensordata)
	const fallbackSpeed = Number.isFinite(config.defaultFanSpeed) ? config.defaultFanSpeed : DEFAULT_FAN_SPEED
	const fanCurve = normalizeFanCurve(config.fancurve)
	if (!fanCurve) {
		return {
			targetFanSpeed: fallbackSpeed,
			highestTemperature,
			reason: "missing_fancurve",
		}
	}
	const table = buildFanTable(fanCurve)
	if (!Number.isFinite(highestTemperature)) {
		return {
			targetFanSpeed: fallbackSpeed,
			highestTemperature,
			reason: "missing_temperature",
		}
	}
	const tableIndex = Math.max(0, Math.min(table.length - 1, Math.floor(highestTemperature)))
	const target = Math.round(table[tableIndex])
	return {
		targetFanSpeed: Number.isFinite(target) ? target : fallbackSpeed,
		highestTemperature,
		curveSize: fanCurve.length,
	}
}

module.exports = {
	DEFAULT_FAN_SPEED,
	calculateManualFanSpeed,
	getHighestTemperature,
	normalizeFanCurve,
	buildFanTable,
}
