const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "admin",
    database: "the_office"
});

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post("/login", (req, res) => {

    console.log("Received Request");

    connection.query(`
        SELECT employee.first_name, employee.middle_name, employee.last_name, branch.name
        FROM user
        JOIN employee
        ON user.employee_id = employee.uid
        LEFT JOIN branch
        ON employee.branch_id = branch.uid
        WHERE user.email = '${req.body.email}' AND user.password = '${req.body.password}';

    `, (err, rows, fields) => {

        if (err) {
            console.log("Error");
            res.status(401);
            res.send(err.message);
        } else {
            res.send(JSON.stringify({
                firstName: rows[0].first_name,
                middleName: rows[0].middle_name,
                lastName: rows[0].last_name,
                branchName: rows[0].branch_name
            }));
        }
    });
});


app.post("/signup", (req, res) => {
    res.send("In development");
});



app.listen(6666, () => {
    console.log("Server Started!");
});