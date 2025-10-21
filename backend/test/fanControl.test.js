import { describe, it, expect } from "vitest"
import { calculateManualFanSpeed, DEFAULT_FAN_SPEED } from "../src/fanControl"

describe("calculateManualFanSpeed", () => {
	it("falls back to default speed when fan curve is missing", () => {
		const result = calculateManualFanSpeed({
			manualFanControl: true,
			sensordata: [
				{ unit: "degrees C", value: 45 },
			],
		})

		expect(result).toEqual(
			expect.objectContaining({
				targetFanSpeed: DEFAULT_FAN_SPEED,
				reason: "missing_fancurve",
			})
		)
	})
})
