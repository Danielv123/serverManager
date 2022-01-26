import React, { Component } from "react"
import "antd/dist/antd.dark.css"
import "./App.css"
import { getWebclient } from "./api/index"
import Switch from "./components/Switch"
import { Layout, Menu, Typography, Card, Row, Col, Statistic, Divider, Tooltip, Tabs, Button, Input, Form, Popover } from "antd"
import { LaptopOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons"
import InlineSlider from "./components/InlineSlider"

const { TabPane } = Tabs
const { SubMenu } = Menu
const { Content, Sider } = Layout
let socket

let sliderMarks = {
	0: "0%",
	25: "25%",
	50: "50%",
	75: "75%",
	100: {
		style: {
			color: "#f50",
		},
		label: <strong>100%</strong>,
	},
}

function getValue(key) {
	try {
		return JSON.parse(localStorage[key])
	} catch (e) {
		return undefined
	}
}
function setValue(key, value) {
	localStorage[key] = JSON.stringify(value)
}
class App extends Component {
	constructor(props) {
		super(props)
		this.state = {
			editor: true,
			servers: [],
			selectedKeys: getValue("selectedKeys") || [],
		}
	}
	componentDidMount() {
		socket = getWebclient()
		socket.on("servers", (servers) => this.setState({ servers }))
		socket.on("sensordata", (data) => {
			let servers = this.state.servers
			let server = servers.find((x) => x.name === data.name)
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
							defaultSelectedKeys={this.state.selectedKeys}
							defaultOpenKeys={["servers"]}
							style={{ height: "100%", borderRight: 0 }}
							onSelect={({ selectedKeys }) => {
								console.log(selectedKeys)
								this.setState({ selectedKeys })
								setValue("selectedKeys", selectedKeys)
							}}
							onDeselect={({ selectedKeys }) => {
								console.log(selectedKeys)
								this.setState({ selectedKeys })
								setValue("selectedKeys", selectedKeys)
							}}
						>
							<SubMenu key="servers" icon={<LaptopOutlined />} title="Servers">
								{this.state.servers.map((server) => (
									<Menu.Item key={server.address}>{server.name}</Menu.Item>
								))}
							</SubMenu>
							<Menu.Item key="admin" icon={<SettingOutlined />}>
								Admin
							</Menu.Item>
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
															warnspeed: "3000",
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
																message: "Please input idrac username (usually root)",
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
														<Input.Password />
													</Form.Item>
													<Form.Item
														label="Warning Speed"
														name="warnspeed"
														rules={[
															{
																required: true,
																message: "Please input the fan threshold RPM",
															},
														]}
													>
														<Input />
													</Form.Item>
													<Divider>Custom fan control</Divider>
													<Form.Item label="Custom fan control" name="manualFanControl">
														<Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
													</Form.Item>
													<Row>
														<Col span={layout.labelCol.span}></Col>
														<Col span={layout.wrapperCol.span}>
															<Form.List {...tailLayout} name="fancurve">
																{(fields, { add }) => (
																	<>
																		{fields.map((field, index) => (
																			<div
																				style={{
																					...field.style,
																					display: "inline-block",
																				}}
																			>
																				<Form.Item {...field}>
																					<InlineSlider
																						min={0}
																						max={100}
																						vertical
																						defaultValue={20}
																						marks={index === fields.length - 1 && sliderMarks} // Show percentage marks on the rightmost slider
																						// tooltipVisible={true} // Is kinda nice, but cluttered and lags *a lot*
																					/>
																				</Form.Item>
																				<p>{Math.floor((index / (fields.length - 1)) * 100)}°C</p>
																			</div>
																		))}
																		<Form.Item>
																			<Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
																				Add point to curve
																			</Button>
																		</Form.Item>
																	</>
																)}
															</Form.List>
														</Col>
													</Row>
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
					{server.sensordata && server.sensordata
						.filter((x) => ["Volts", "Amps", "Watts"].includes(x?.unit))
						.map((sensor, i) => (
							<Tooltip key={sensor.name + sensor.unit + i} title={`Previous value: ${Math.floor(sensor?.previousValue)}`}>
								<Col span={4}>
									<Statistic
										title={sensor?.name}
										value={sensor?.value}
										precision={sensor.unit.includes("Amps") ? 2 : 0}
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
					{server.sensordata && server.sensordata
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
					{server.sensordata && server.sensordata
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
											color: (Number(sensor.value) > Number(sensor.WL) && Number(sensor.value) < Number(server.warnspeed) && " ") /*"#3f8600" green */ || "#cf1322",
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
