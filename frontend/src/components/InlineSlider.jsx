import React from "react"
import { Slider } from "antd"

class InlineSlider extends React.PureComponent {
	constructor(props) {
		super(props)
		this.handleWheel = this.handleWheel.bind(this)
	}

	handleWheel(e) {
		e.preventDefault()
		const { value, onChange, min = 0, max = 100 } = this.props
		const currentValue = value || 0
		const delta = e.deltaY > 0 ? -1 : 1
		const newValue = Math.max(min, Math.min(max, currentValue + delta))
		
		if (onChange && newValue !== currentValue) {
			onChange(newValue)
		}
	}

	render() {
		return (
			<div 
				style={{ height: 300, width: 80, display: "inline-block", userSelect: "none" }}
				onWheel={this.handleWheel}
			>
				<Slider {...this.props} />
			</div>
		)
	}
}

export default InlineSlider
