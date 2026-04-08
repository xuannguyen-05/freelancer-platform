const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Freelancer Platform API",
            version: "1.0.0",
            description: "Core workflow APIs for project-task-contract management"
        },
        tags: [
            { name: "Project", description: "Project lifecycle and project-task linking" },
            { name: "Task", description: "Task status management" },
            { name: "Contract", description: "Contract lifecycle and payment" },
            { name: "Statistics", description: "Business metrics and progress dashboards" }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        servers: [
            {
                url: "http://localhost:8080"
            }
        ],
        security: [
            {
            bearerAuth: []
            }
        ]
    },
    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;