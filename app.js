const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());


const createUnixSocketPool = async () => {
    const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';
  
    return mysql.createPool({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.DATABASE,
      socketPath: `${dbSocketPath}/${process.env.SQL_INSTANCE}`,
    });
};

let pool; 
createUnixSocketPool().then(result => {
    pool = result;
}).catch(e => {
    console.log("Error Creating Pool");
});



app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post("/login", (req, res) => {

    console.log("Received Request");
    
    try {
        pool.getConnection((err, connection) => {

            if (err) {
    
                res.status(500).send(err.message + ": Error connecting to database");
    
            } else {
    
                connection.query(`
                SELECT employee.first_name, employee.middle_name, employee.last_name, branch.name AS branch_name
                FROM user
                JOIN employee
                ON user.employee_id = employee.uid
                LEFT JOIN branch
                ON employee.branch_id = branch.uid
                WHERE user.email = '${req.body.email}' AND user.password = '${req.body.password}';
        
                `, 
                (err, rows, fields) => {
        
                    if (err) {
                        console.log("Error");
                        res.status(422).send(`${err} UH OH`);
                    } else if (rows.length > 0) {
                        res.send(JSON.stringify({
                            firstName: rows[0].first_name,
                            middleName: rows[0].middle_name,
                            lastName: rows[0].last_name,
                            branchName: rows[0].branch_name
                        }));
                    } else {
                        res.status(422).send("Invalid Email or Password");
                    }
                });
    
            }
    
        });
    } catch (e) {
        res.status(500).send(`Error: ${e}`);
    }
});


app.post("/signup", (req, res) => {
    res.send("In development");
});


const port = process.env.PORT || 8080;
console.log(port);
app.listen(port, () => {
    console.log("Server Started!");
});