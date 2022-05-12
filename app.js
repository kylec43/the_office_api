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
                        res.status(500).send(`${err} UH OH`);
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

    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (confirmPassword !== password) {
        return res.status(400).send("Password and Confirmation Password do not match.");
    }

    try {
        pool.getConnection((err, connection) => {

            connection.query(
            `
                SELECT * FROM user
                WHERE email = '${email}';
            `,
            (err, rows, fields) => {
                if (err) {
                    res.status(500).send(`UH OH. Error has occurred: ${err}`);
                } else if (rows.length > 0) {
                    res.status(422).send("This email has already been registered!");
                } else {
                    connection.query(
                        `
                            INSERT INTO user(email, password)
                            VALUES(${email}, ${password});
                        `,
                        (err, rows, fields) => {

                            if (err) {
                                res.status(500).send(`UH OH error has occurred: ${err}`);
                            } else {
                               res.send("Successfully registered user!"); 
                            }
                        }
                    );
                }
            });

        });
    } catch (e) {

        res.send(500).send(`UH OH error has occurred ${e}`);
    }
});


const port = process.env.PORT || 8080;
console.log(port);
app.listen(port, () => {
    console.log("Server Started!");
});