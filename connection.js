var mysql=require('mysql');

// var con=mysql.createConnection({
//     host:"localhost",
//     user:"root",
//     password:"1234",
//     database:"mydb"
// });

// module.exports=con;

const con = mysql.createPool({
    connectionLimit: 10, // Adjust the number of connections as per your requirements
    host: "localhost",
    user: "root",
    password: "1234",
    database: "mydb",
  });
  
  module.exports = con;

  // con.connect(function(err) {
  //   if (err) throw err;
  //   console.log("Connected!");
  //   var sql = "alter table blogs add column id int auto_increment;";
  //   con.query(sql, function (err, result) {
  //     if (err) throw err;
  //     console.log("Table altered");
  //   });
  // });
