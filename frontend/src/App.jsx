import React, { Component } from "react"
import "antd/dist/antd.dark.css"
import logo from "./logo.svg"
import "./App.css"
import api, { getWebclient } from "./api/index"
import { Layout, Menu, Breadcrumb, Typography, Card, Row, Col, Statistic, Divider, Tooltip } from "antd"
import {
	UserOutlined,
	LaptopOutlined,
	NotificationOutlined,
	PlusSquareOutlined,
	ArrowsAltOutlined,
	DragOutlined,
	PlusOutlined,
	ArrowUpOutlined,
	ArrowDownOutlined,
} from "@ant-design/icons"

const { SubMenu } = Menu
const { Header, Content, Sider } = Layout

class App extends Component {
	constructor(props) {
		super(props)
		this.state = {
			editor: true,
			EditTool: [],
			servers: [],
			selectedKeys: [],
		}
	}
	componentDidMount() {
		let socket = getWebclient()
		socket.on("servers", (servers) => this.setState({ servers }))
		socket.on("sensordata", (data) => {
			let servers = this.state.servers
			let server = servers.find((x) => x.name == data.name)
			server.sensordata = data.sensordata
			this.setState({ servers })
		})
	}
	render() {
		let servers = this.state.servers.filter((x) => this.state.selectedKeys.includes(x.address))
		return (
			<Layout style={{ height: "100%" }}>
				<Layout>
					<Sider width={200} className="site-layout-background">
						<Menu
							multiple
							mode="inline"
							defaultSelectedKeys={[this.state.currentServer]}
							defaultOpenKeys={["servers"]}
							style={{ height: "100%", borderRight: 0 }}
							onSelect={({selectedKeys}) => {
								console.log(selectedKeys)
								this.setState({ selectedKeys })
							}}
							onDeselect={({selectedKeys}) => {
								console.log(selectedKeys)
								this.setState({ selectedKeys })
							}}
						>
							<SubMenu key="servers" icon={<LaptopOutlined />} title="Servers">
								{this.state.servers.map((server) => (
									<Menu.Item key={server.address}>{server.name}</Menu.Item>
								))}
							</SubMenu>
						</Menu>
					</Sider>
					<Layout>
						<Content
							className="site-layout-background"
							style={{
								padding: 0,
								margin: 0,
								minHeight: 280,
							}}
						>
							{servers?.map(renderServerOverview)}
						</Content>
					</Layout>
				</Layout>
			</Layout>
		)
	}
}

function renderServerOverview(server){
return server && (
	<Card>
		<Typography.Title>{server.name}</Typography.Title>
		<Divider orientation="left">Power</Divider>
		<Row>
			{server.sensordata
				.filter((x) => ["Volts", "Amps", "Watts"].includes(x?.unit))
				.map((sensor) => (
					<Tooltip title={`Previous value: ${Math.floor(sensor?.previousValue)}`}>
						<Col span={4}>
							<Statistic
								title={sensor?.name}
								value={sensor?.value}
								precision={0}
								// prefix={sensor?.trend > 0 && <ArrowUpOutlined /> || sensor?.trend < 0 && <ArrowDownOutlined />}
								suffix={
									<span>
										{sensor?.unit} {(sensor?.trend > 0 && <ArrowUpOutlined />) || (sensor?.trend < 0 && <ArrowDownOutlined />)}
									</span>
								}
								valueStyle={{
									color:
										(sensor.unit !== "Watts" && " ") ||
										(Number(sensor.value) < Number(200) && "#3f8600") ||
										(Number(sensor.value) < Number(sensor.WH) && " ") ||
										"#cf1322",
								}}
							/>
						</Col>
					</Tooltip>
				))}
		</Row>
		<Divider orientation="left">Temperature</Divider>
		<Row>
			{server.sensordata
				.filter((x) => x?.unit === "degrees C")
				.map((sensor) => (
					<Tooltip title={`Previous value: ${Math.floor(sensor?.previousValue)}`}>
						<Col span={4}>
							<Statistic
								title={sensor?.name}
								value={sensor?.value}
								precision={0}
								suffix={<span>C {(sensor?.trend > 0 && <ArrowUpOutlined />) || (sensor?.trend < 0 && <ArrowDownOutlined />)}</span>}
								valueStyle={{
									color: (Number(sensor.value) > Number(sensor.WL) && Number(sensor.value) < Number(sensor.WH) && " ") || "#cf1322",
								}}
							/>
						</Col>
					</Tooltip>
				))}
		</Row>
		<Divider orientation="left">Fans</Divider>
		<Row>
			{server.sensordata
				.filter((x) => ["RPM"].includes(x?.unit))
				.map((sensor) => (
					<Tooltip title={`Previous value: ${Math.floor(sensor?.previousValue)}`}>
						<Col span={4}>
							<Statistic
								title={sensor?.name}
								value={sensor?.value}
								precision={0}
								suffix={
									<span>
										{sensor?.unit} {(sensor?.trend > 0 && <ArrowUpOutlined />) || (sensor?.trend < 0 && <ArrowDownOutlined />)}
									</span>
								}
								valueStyle={{
									color:
										(Number(sensor.value) > Number(sensor.WL) && Number(sensor.value) < 3000 && " ") /*"#3f8600" green */ ||
										"#cf1322",
								}}
							/>
						</Col>
					</Tooltip>
				))}
		</Row>
	</Card>
)
}

export default App
