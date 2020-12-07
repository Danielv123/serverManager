import React from "react"
import { Switch as AntdSwitch } from "antd"

class Switch extends React.Component {
	render() {
		return <AntdSwitch {...this.props} checked={this.props.value} />
	}
}

export default Switch
