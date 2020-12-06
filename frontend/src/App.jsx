import React, { Component } from "react"
import "antd/dist/antd.dark.css"
import "./App.css"
import { getWebclient } from "./api/index"
import { Layout, Menu, Typography, Card, Row, Col, Statistic, Divider, Tooltip, Tabs, Button, Input, Form, Popover } from "antd"
import {
	LaptopOutlined,
	PlusOutlined,
	ArrowUpOutlined,
	ArrowDownOutlined,
	DeleteOutlined,
	SaveOutlined,
} from "@ant-design/icons"

const { TabPane } = Tabs
const { SubMenu } = Menu
const { Content, Sider } = Layout
let socket

class App extends Component {
	constructor(props) {
		super(props)
		this.state = {
			editor: true,
			servers: [],
			selectedKeys: ["admin"],
		}
	}
	componentDidMount() {
		socket = getWebclient()
		socket.on("servers", (servers) => this.setState({ servers }))
		socket.on("sensordata", (data) => {
			let servers = this.state.servers
			let server = servers.find((x) => x.name == data.name)
			if (server) {
				server.sensordata = data.sensordata
				this.setState({ servers })
			} else {
				console.error("Couldn't find server for sensordata: ", data, this.state)
			}
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
							onSelect={({ selectedKeys }) => {
								console.log(selectedKeys)
								this.setState({ selectedKeys })
							}}
							onDeselect={({ selectedKeys }) => {
								console.log(selectedKeys)
								this.setState({ selectedKeys })
							}}
						>
							<SubMenu key="servers" icon={<LaptopOutlined />} title="Servers">
								{this.state.servers.map((server) => (
									<Menu.Item key={server.address}>{server.name}</Menu.Item>
								))}
							</SubMenu>
							<Menu.Item key="admin">Admin</Menu.Item>
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
							{this.state.selectedKeys.includes("admin") && (
								<Card title="Admin">
									<Tabs
										tabBarExtraContent={
											<Button
												type="primary"
												onClick={() => {
													socket.emit("addServer", {
														server: {
															name: "New server",
															address: "192.168.0.1",
															username: "root",
															password: "calvin",
														},
													})
												}}
											>
												<PlusOutlined /> Add server
											</Button>
										}
									>
										{this.state.servers.map((server) => (
											<TabPane tab={server.name} key={server.address}>
												<Form
													{...layout}
													name="basic"
													initialValues={server}
													onFinish={(data) => {
														socket.emit("updateServer", {
															address: server.address,
															update: data,
														})
													}}
												>
													<Form.Item
														label="Name"
														name="name"
														rules={[
															{
																required: true,
																message: "Please input a server name",
															},
														]}
													>
														<Input />
													</Form.Item>
													<Form.Item
														label="Address/hostname"
														name="address"
														rules={[
															{
																required: true,
																message: "Please input idrac address/hostname",
															},
														]}
													>
														<Input />
													</Form.Item>
													<Form.Item
														label="Username"
														name="username"
														rules={[
															{
																required: true,
																message: "Please the idrac username (usually root)",
															},
														]}
													>
														<Input />
													</Form.Item>
													<Form.Item
														label="Password"
														name="password"
														rules={[
															{
																required: true,
																message: "Please input the idrac password",
															},
														]}
													>
														<Input />
													</Form.Item>
													<Form.Item {...tailLayout}>
														<Button type="primary" htmlType="submit">
															<SaveOutlined /> Save
														</Button>
														<Popover
															trigger="click"
															content={
																<Button type="primary" danger onClick={() => socket.emit("deleteServer", { address: server.address })}>
																	Delete server
																</Button>
															}
														>
															<Button danger>
																<DeleteOutlined /> Delete
															</Button>
														</Popover>
													</Form.Item>
												</Form>
											</TabPane>
										))}
									</Tabs>
								</Card>
							)}
						</Content>
					</Layout>
				</Layout>
			</Layout>
		)
	}
}

function renderServerOverview(server) {
	return (
		server && (
			<Card>
				<Typography.Title>{server.name}</Typography.Title>
				<Divider orientation="left">Power</Divider>
				<Row>
					{server.sensordata
						.filter((x) => ["Volts", "Amps", "Watts"].includes(x?.unit))
						.map((sensor) => (
							<Tooltip key={sensor.name + sensor.unit} title={`Previous value: ${Math.floor(sensor?.previousValue)}`}>
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
											color: (Number(sensor.value) > Number(sensor.WL) && Number(sensor.value) < 3000 && " ") /*"#3f8600" green */ || "#cf1322",
										}}
									/>
								</Col>
							</Tooltip>
						))}
				</Row>
			</Card>
		)
	)
}
const layout = {
	labelCol: {
		span: 8,
	},
	wrapperCol: {
		span: 16,
	},
}
const tailLayout = {
	wrapperCol: {
		offset: 8,
		span: 16,
	},
}
export default App
