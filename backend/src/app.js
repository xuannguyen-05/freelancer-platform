const express = require("express")
const routes = require("./routes")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")


const app = express()

const allowedOrigins = new Set([
	"http://localhost:5173",
	"http://localhost:5174",
	process.env.FRONTEND_ORIGIN
].filter(Boolean))

app.use((req, res, next) => {
	const origin = req.headers.origin

	if (origin && allowedOrigins.has(origin)) {
		res.header("Access-Control-Allow-Origin", origin)
		res.header("Vary", "Origin")
		res.header("Access-Control-Allow-Credentials", "true")
	}

	res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS")
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if (req.method === "OPTIONS") {
		return res.sendStatus(204)
	}

	next()
})

//config req.body
app.use(express.json());        // đọc JSON
app.use(express.urlencoded({ extended: true })); // đọc form

app.use("/uploads", express.static("public/uploads"))

app.use("/api", routes)

// swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global Error Handler
app.use((err, req, res, next) => {
	console.error("[Global Error Handler]", err);
	const statusCode = err.statusCode || err.status || 500;
	const code = err.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
	const message = err.message || "An unexpected error occurred";

	res.status(statusCode).json({
		code,
		message
	});
});

module.exports = app