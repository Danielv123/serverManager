import React from "react"
import { Form, Button, Tooltip } from "antd"
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined } from "@ant-design/icons"
import InlineSlider from "./InlineSlider"

const FanCurveGraph = ({ form }) => {
	return (
		<Form.List name="fancurve">
			{(fields, { add, remove, move }) => (
				<>
					<Form.Item noStyle shouldUpdate>
						{({ getFieldValue }) => {
							const fancurve = getFieldValue("fancurve") || []
							return (
								<div
									style={{
										position: "relative",
										padding: "40px 40px 60px 60px",
										backgroundColor: "#fafafa",
										border: "1px solid #d9d9d9",
										borderRadius: "4px",
										userSelect: "none",
										WebkitUserSelect: "none",
										MozUserSelect: "none",
										msUserSelect: "none",
									}}
								>
									{/* Y-axis label */}
									<div
										style={{
											position: "absolute",
											left: "10px",
											top: "50%",
											transform: "rotate(-90deg) translateX(-50%)",
											transformOrigin: "left center",
											fontWeight: "bold",
											fontSize: "12px",
											color: "#595959",
										}}
									>
										Fan Speed (%)
									</div>

									{/* X-axis label */}
									<div
										style={{
											position: "absolute",
											bottom: "10px",
											left: "50%",
											transform: "translateX(-50%)",
											fontWeight: "bold",
											fontSize: "12px",
											color: "#595959",
										}}
									>
										Temperature (°C)
									</div>

									{/* Grid background */}
									<div style={{ position: "relative", height: "300px", backgroundColor: "#fff", border: "1px solid #e8e8e8" }}>
										{/* Horizontal grid lines */}
										{[0, 25, 50, 75, 100].map((val) => (
											<div
												key={`h-${val}`}
												style={{
													position: "absolute",
													left: 0,
													right: 0,
													bottom: `${val}%`,
													height: "1px",
													backgroundColor: val === 0 ? "#d9d9d9" : "#f0f0f0",
													zIndex: 1,
												}}
											>
												<span
													style={{
														position: "absolute",
														left: "-35px",
														top: "-8px",
														fontSize: "11px",
														color: "#8c8c8c",
													}}
												>
													{val}%
												</span>
											</div>
										))}

										{/* SVG for connecting lines and curve fill */}
										<svg
											style={{
												position: "absolute",
												top: 0,
												left: 0,
												width: "100%",
												height: "100%",
												zIndex: 2,
												pointerEvents: "none",
											}}
										>
											{fields.length > 1 && (
												<>
													{/* Fill area under curve */}
													<path
														d={
															fields.length > 0
																? `M 0,100% ` +
																  fields
																		.map((field, index) => {
																			const x = (index / (fields.length - 1)) * 100
																			const y = 100 - (fancurve[index] || 0)
																			return `L ${x}%,${y}%`
																		})
																		.join(" ") +
																  ` L 100%,100% Z`
																: ""
														}
														fill="#1890ff"
														fillOpacity="0.1"
													/>
													{/* Connecting lines */}
													{fields.map((field, index) => {
														if (index === fields.length - 1) return null
														const x1 = (index / (fields.length - 1)) * 100
														const x2 = ((index + 1) / (fields.length - 1)) * 100
														const y1 = 100 - (fancurve[index] || 0)
														const y2 = 100 - (fancurve[index + 1] || 0)
														return (
															<line
																key={`line-${field.key}`}
																x1={`${x1}%`}
																y1={`${y1}%`}
																x2={`${x2}%`}
																y2={`${y2}%`}
																stroke="#1890ff"
																strokeWidth="3"
															/>
														)
													})}
													{/* Point markers */}
													{fields.map((field, index) => {
														const x = (index / (fields.length - 1)) * 100
														const y = 100 - (fancurve[index] || 0)
														return (
															<circle
																key={`point-${field.key}`}
																cx={`${x}%`}
																cy={`${y}%`}
																r="5"
																fill="#1890ff"
																stroke="#fff"
																strokeWidth="2"
															/>
														)
													})}
												</>
											)}
										</svg>

										{/* Curve points with sliders */}
										<div style={{ position: "relative", height: "100%", display: "flex", justifyContent: "space-around" }}>
											{fields.map((field, index) => (
												<div
													key={field.key}
													style={{
														position: "absolute",
														left: `calc(${(index / (fields.length - 1)) * 100}% - 15px)`,
														top: "-6px",
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														zIndex: 3,
													}}
												>
													<Form.Item
														{...field}
														style={{
															marginBottom: 0,
															height: "100%",
														}}
													>
														<InlineSlider min={0} max={100} vertical defaultValue={20} style={{ height: "100%" }} />
													</Form.Item>

													{/* Control buttons */}
													<div
														style={{
															position: "absolute",
															top: "-35px",
															display: "flex",
															gap: "2px",
															backgroundColor: "#fff",
															padding: "2px",
															borderRadius: "4px",
															border: "1px solid #d9d9d9",
															boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
														}}
													>
														<Tooltip title="Move left">
															<Button
																size="small"
																icon={<ArrowUpOutlined style={{ transform: "rotate(-90deg)", fontSize: "10px" }} />}
																disabled={index === 0}
																onClick={() => move(index, index - 1)}
																style={{ padding: "0 4px", height: "20px" }}
															/>
														</Tooltip>
														<Tooltip title="Delete">
															<Button
																size="small"
																danger
																icon={<DeleteOutlined style={{ fontSize: "10px" }} />}
																disabled={fields.length <= 2}
																onClick={() => {
																	if (fields.length > 2) remove(field.name)
																}}
																style={{ padding: "0 4px", height: "20px" }}
															/>
														</Tooltip>
														<Tooltip title="Move right">
															<Button
																size="small"
																icon={<ArrowDownOutlined style={{ transform: "rotate(-90deg)", fontSize: "10px" }} />}
																disabled={index === fields.length - 1}
																onClick={() => move(index, index + 1)}
																style={{ padding: "0 4px", height: "20px" }}
															/>
														</Tooltip>
													</div>

													{/* Temperature label */}
													<div
														style={{
															position: "absolute",
															bottom: "-25px",
															left: "50%",
															transform: "translateX(-50%)",
															fontWeight: "bold",
															fontSize: "11px",
															color: "#262626",
															whiteSpace: "nowrap",
														}}
													>
														{Math.floor((index / (fields.length - 1)) * 100)}°C
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							)
						}}
					</Form.Item>

					<Form.Item style={{ marginTop: "16px" }}>
						<Button type="dashed" onClick={() => add(20)} icon={<PlusOutlined />}>
							Add point to curve
						</Button>
						<div style={{ marginTop: "8px", fontSize: "12px", color: "#8c8c8c" }}>
							{fields.length < 2 && <span style={{ color: "#ff4d4f" }}>⚠ At least 2 points required for fan curve</span>}
							{fields.length >= 2 && <span>✓ {fields.length} points defined</span>}
						</div>
					</Form.Item>
				</>
			)}
		</Form.List>
	)
}

export default FanCurveGraph

