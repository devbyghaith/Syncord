const Express = require('express');

const TableManager = require('../../database/table-manager');

var Router = Express.Router();

Router.get("/", async function(request, response) {
    return response.redirect("/oauth")
});

module.exports = Router;