var con = require('./connection');
var express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
var app = express();
var bodyparser = require('body-parser');
var bcrypt = require('bcrypt');
var path = require('path')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const oneHour = 1000 * 60 * 60;
app.use(sessions({
  secret: 'req.sessionID',
  saveUninitialized: true,
  cookie: { maxAge: oneHour },
  resave: false
}));

app.use(cookieParser());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/html/home.html');
});

app.get('/register', function (req, res) {
  res.sendFile(__dirname + '/public/html/signup.html');
});

app.get('/login', function (req, res) {
  res.sendFile(__dirname + '/public/html/login.html');
});

app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.redirect('/');
  });
});

// app.get('/check-auth-status', function(req, res) {
//   if (req.session && req.session.userId) {
//     // If the user is authenticated, return a success response (HTTP 200 OK)
//     res.sendStatus(200);
//   } else {
//     // If the user is not authenticated, return an unauthorized response (HTTP 401 Unauthorized)
//     res.sendStatus(401);
//   }
// });

app.post('/register', function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var mobile = req.body.mobile;

  bcrypt.hash(password, 10, function (err, hashedPassword) {
    if (err) throw err;
    con.getConnection(function (err) {
      if (err) throw err;
      var sql =
        "INSERT INTO users (name, email, password, mobile) VALUES ('" +
        name +
        "','" +
        email +
        "','" +
        hashedPassword +
        "','" +
        mobile +
        "')";

      con.query(sql, function (err, result) {
        if (err) throw err;
        res.redirect('/login');
      });
    });
  });
});

app.post('/login', function (req, res) {
  var lemail = req.body.lemail;
  var lpassword = req.body.lpassword;
  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "SELECT email, password FROM users WHERE email = ?";
    con.query(sql, [lemail], function (err, result) {
      //con.release();
      if (err) throw err;

      if (result.length === 0) {
        res.send('User not found please signup first.');
      } else {
        const storedHashedPassword = result[0].password;
        bcrypt.compare(lpassword, storedHashedPassword, function (err, isMatch) {
          if (err) throw err;
          if (isMatch) {
            // Fetch existing blogs from the database
            var blogsSql = "SELECT * FROM blogs";
            con.query(blogsSql, function (err, blogsResult) {
              if (err) throw err;
              // Render the index.html file with existing blogs data
              res.render('index', { blogs: blogsResult });
            });
          } else {
            res.send('Incorrect password');
          }
        });
      }
    });
  });
});

// app.post('/login', function(req, res) {
//   var lemail = req.body.lemail;
//   var lpassword = req.body.lpassword;
//   con.getConnection(function(err) {
//     if (err) throw err;
//     var sql = "SELECT email, password FROM users WHERE email = ?";
//     con.query(sql, [lemail], function(err, result) {
//       //con.release();
//       if (err) throw err;

//       if (result.length === 0) {

//         res.send('User not found please signup first.');
//       } else {
//         const storedHashedPassword = result[0].password;
//         bcrypt.compare(lpassword, storedHashedPassword, function(err, isMatch) {
//           if (err) throw err;
//           if (isMatch) {
//             // res.send('User verification successful');
//             res.sendFile(__dirname +'/public/html/index.html');

//           } else {
//             res.send('Incorrect password');
//           }
//         });
//       }
//     });
//   });
// });


app.post('/create-blog', function (req, res) {
  var name = req.body.name;
  var type = req.body.type;
  var topic = req.body.topic;
  var content = req.body.content;

  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "INSERT INTO blogs (name, type, topic, content) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, type, topic, content], function (err, result) {
      if (err) throw err;
      console.log("Blog created successfully!");

      var blogsSql = "SELECT * FROM blogs";
      con.query(blogsSql, function (err, blogsResult) {
        if (err) throw err;
        // Render the index.html file with the updated list of blogs
        res.render('index', { blogs: blogsResult });
      });
    });
  });
});

// app.get('/', function(req, res) {
//   con.getConnection(function(err) {
//     if (err) throw err;
//     var sql = "SELECT * FROM blogs";
//     con.query(sql, function(err, result) {
//       if (err) throw err;
//       // Pass the result to the index.html file for displaying the existing blogs
//       res.render('index', { blogs: result });
//     });
//   });
// });

app.get('/update-blog/:id', function (req, res) {
  var id = req.params.id;

  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "SELECT * FROM blogs WHERE id = ?";
    con.query(sql, [id], function (err, result) {
      if (err) throw err;
      if (result.length === 0) {
        // Handle the case when the blog with the provided ID does not exist
        console.log("Blog not found!");
        // You can render an error page or redirect the user to another page if needed.
        // For simplicity, let's redirect them to the homepage.
        res.redirect('/');
      } else {
        // Render the update_blog.ejs view with the blog details
        res.render('update_blog', { blog: result[0] });
      }
    });
  });
});


app.post('/update-blog/:id', function (req, res) {
  var id = req.params.id;
  var name = req.body.name;
  var type = req.body.type;
  var topic = req.body.topic;
  var content = req.body.content;

  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "UPDATE blogs SET name=?, type=?, topic=?, content=? WHERE id=?";
    con.query(sql, [name, type, topic, content, id], function (err, result) {
      if (err) throw err;
      console.log("Blog updated successfully!");
      var blogsSql = "SELECT * FROM blogs";
      con.query(blogsSql, function (err, blogsResult) {
        if (err) throw err;
        // Render the index.html file with the updated list of blogs
        res.render('index', { blogs: blogsResult });
      });
    });
  });
});

app.post('/delete-blog/:id', function (req, res) {
  var id = req.params.id;

  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "DELETE FROM blogs WHERE id=?";
    con.query(sql, [id], function (err, result) {
      if (err) throw err;
      console.log("Blog deleted successfully!");
      var blogsSql = "SELECT * FROM blogs";
      con.query(blogsSql, function (err, blogsResult) {
        if (err) throw err;
        // Render the index.html file with the updated list of blogs
        res.render('index', { blogs: blogsResult });
      });
    });
  });
});

app.listen(5000, () => {
  console.log('Server started at port no. 5000');
});
