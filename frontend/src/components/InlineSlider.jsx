import React from "react"
import { Slider } from "antd"

class InlineSlider extends React.Component {
	constructor(props) {
		super(props)
	}
	render() {
		return (
			<div style={{ height: 300, width: 80, display: "inline-block" }}>
				<Slider {...this.props} />
			</div>
		)
	}
}

export default InlineSlider
