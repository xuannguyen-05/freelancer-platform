const express = require("express")
const routes = require("./routes")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")


const app = express()

//config req.body
app.use(express.json());        // đọc JSON
app.use(express.urlencoded({ extended: true })); // đọc form

app.use("/uploads", express.static("public/uploads"))

app.use("/api", routes)

// swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app