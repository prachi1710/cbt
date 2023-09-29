let con = require('./connection');
let express = require('express');
const cookieParser = require('cookie-parser');
let app = express();
let bodyparser = require('body-parser');
let bcrypt = require('bcrypt');
let path = require('path')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const flash = require('connect-flash');
var toastr = require('express-toastr');
const session = require('express-session');
app.use(flash());

// const crypto = require('crypto');
// var token = crypto.randomBytes(128).toString('hex');

// const oneHour = 1000 * 60 * 60;
app.use(session({
  secret: 'bhsgsdgydgshoisjxbhcftydsudhhsj',
  saveUninitialized: true,
  // cookie: { maxAge: oneHour },
  resave: false
}));

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  const existingUser = User.findUser(req.session.user.lemail);

  if (existingUser === undefined) {
    console.log('User doesn\'t exist');
    req.user = req.session.user;
  }
  next();
});

app.use(require('express-toastr')());
// app.use(toastr());
// app.use(function (req, res, next)
// {
//     res.locals.toasts = req.toastr.render()
//     next()
// });
app.use(cookieParser());
app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/toaster-js')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/html/home.html');
});

app.get('/register', function (req, res) {
  res.sendFile(__dirname + '/public/html/signup.html');
});

app.get('/login', function (req, res) {
  res.sendFile(__dirname + '/public/html/login.html');
});
app.get('/forget',function(req,res){
  res.sendFile(__dirname+'/public/html/forget.html');
});
app.get('/node_modules/toaster-js/default.scss', (req, res) => {
  res.header('Content-Type', 'text/css');
  res.sendFile(__dirname + '/node_modules/toaster-js/default.scss');
});

function isAuthenticated(req, res, next) {
  if (req.session.userID) { // Check if the user is logged in
      next();
  } else {
      res.redirect('/login');
  }
}

app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
      if (err) {
          console.error(err);
      } else {
          res.send(`
              <script>
                  window.location.href = '/'; 
                  window.history.forward(); 
              </script>
          `);
      }
  });
});

app.post('/register', function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var mobile = req.body.mobile;
  // if (!emailRegex.test(email)) {
  //   return res.status(400).send('Invalid email address.');
  // }

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

function validate(email, password) {
  if (email == '' || password == '') {
      return false;
  }
  else {
      return true;
  }
}
app.post('/login', function (req, res) {
  var lemail = req.body.lemail;
  var lpassword = req.body.lpassword;
  if(!validate(lemail,lpassword))
  {
    return res.status(401).json({ error: 'Email or password cannot be blank' });
  }
  con.getConnection(function (err) {
    if (err) throw err;

    var sql = "SELECT id, email, password FROM users WHERE email = ?";
    con.query(sql, [lemail], function (err, result) {
      if (err) throw err;

      if (result.length === 0) {
        return res.status(401).json({ error: 'User not found. Please sign up first.' });
      } else {
        const storedHashedPassword = result[0].password;

        bcrypt.compare(lpassword, storedHashedPassword, function (err, isMatch) {
          if (err) throw err;

          if (isMatch) {
            // res.redirect('/index');
            req.session.userID = result[0].id;
            req.session.lemail = lemail;
            res.status(200).json({ success: 'Logged in successfully' });
          } else {
            return res.status(400).json({ error: 'Incorrect Password' });
          }
        });
      }
    });
  });
});

app.get('/index', function (req, res) {
  var blogsSql = "SELECT * FROM blogs";
  con.query(blogsSql, function (err, blogsResult) {
    if (err) throw err;
    // Render the index.html file with existing blogs data
    res.render('index', { blogs: blogsResult });
  });
})

app.post('/create-blog', isAuthenticated, function (req, res) {
  var name = req.body.name;
  var type = req.body.type;
  var topic = req.body.topic;
  var content = req.body.content;
  var user_id=req.session.userID;

  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "INSERT INTO blogs (name, type, topic, content,user_id) VALUES (?, ?, ?, ?,?)";
    con.query(sql, [name, type, topic, content,user_id], function (err, result) {
      if (err) throw err;
      console.log("Blog created successfully!");

      var blogsSql = "SELECT * FROM blogs ORDER BY likes DESC";
      con.query(blogsSql, function (err, blogsResult) {
        if (err) throw err;
        // Render the index.html file with the updated list of blogs
        res.render('index', { blogs: blogsResult });
      });
    });
  });
});

app.get('/dashboard', isAuthenticated, function (req, res) {
  var lemail = req.session.lemail;
  // console.log(lemail);
  var info = "select name,email,mobile from users where email=?";
  con.query(info, [lemail], function (err, result) {
    if (err) throw err;
    if (res.length == 0) {
      res.status(404).send('user not found');
    }
    else {
      res.render('dashboard', { users: result });
    }

  })
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

app.get('/update-blog/:id',isAuthenticated, function (req, res) {
  var id = req.params.id;
  var user_id=req.session.userID;

  con.getConnection(function (err) {
    if (err) throw err;
    var sql = "SELECT * FROM blogs WHERE id = ? and user_id=?";
    con.query(sql, [id,user_id], function (err, result) {
      if (err) throw err;
      if (result.length === 0) {
        // Handle the case when the blog with the provided ID does not exist
        res.status(404).send('You dont have permission to update this blog');
        console.log("you dont have permission to update this blog!");
        // You can render an error page or redirect the user to another page if needed.
        // For simplicity, let's redirect them to the homepage.
        // res.redirect('/');
      } else {
        // Render the update_blog.ejs view with the blog details
        res.render('update_blog', { blog: result[0] });
      }
    });
  });
});


app.post('/update-blog/:id',isAuthenticated, function (req, res) {
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

// app.get('/delete-blog/:id', isAuthenticated,function (req, res) {
//   var id = req.params.id;

//   con.getConnection(function (err) {
//     if (err) throw err;
//     var sql = "DELETE FROM blogs WHERE id=?";
//     con.query(sql, [id], function (err, result) {
//       if (err) throw err;
//       if(result.length===0)
//       {
//         res.status(404).send("You dont have permission to delete this blog");
//       }
//       else
//       {
//         console.log("Blog deleted successfully!");
//       var blogsSql = "SELECT * FROM blogs";
//       con.query(blogsSql, function (err, blogsResult) {
//         if (err) throw err;
//         // Render the index.html file with the updated list of blogs
//         res.render('index', { blogs: blogsResult });
//       });
//       }
      
//     });
//   });
// });
app.get('/delete-blog/:id', isAuthenticated, function (req, res) {
  var id = req.params.id;
  var userId = req.session.userID; // Assuming you have a way to get the logged-in user's ID

  con.getConnection(function (err) {
    if (err) throw err;

    // Check if the user is authorized to delete this blog
    var authorizationSql = "SELECT id FROM blogs WHERE id=? AND user_id=?";
    con.query(authorizationSql, [id, userId], function (err, authResult) {
      if (err) throw err;

      if (authResult.length === 0) {
        res.status(403).send("You don't have permission to delete this blog");
      } else {
        // The user is authorized, proceed with deletion
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
      }
    });
  });
});

app.post('/like-blog/:id', isAuthenticated,function (req, res) {
  var blogId = req.params.id;
  // var userId = req.session.userId;
  var lemail = req.session.lemail;
  console.log(lemail);
  con.getConnection(function (err) {
    if (err) throw err;
    var getid = "SELECT id FROM users WHERE email=?";
    con.query(getid, [lemail], function (err, result) {
      if (err) throw err;
      if (result.length == 0) {
        res.status(404).send("User not found");
      } else {
        const userID = result[0].id;
        req.session.userID=userID;
        console.log(userID);
        console.log(blogId);
        var checkLikeSql = "SELECT * FROM likes WHERE userID=? AND blogID=?";
        con.query(checkLikeSql, [userID, blogId], function (err, result) {
          if (err) throw err;

          if (result.length === 0) {
            // User has not liked this blog, add the like
            var insertLikeSql = "INSERT INTO likes (userID, blogID) VALUES (?, ?)";
            con.query(insertLikeSql, [userID, blogId], function (err, result) {
              if (err) throw err;

              // Increment the likes count for the blog in the blogs table
              var updateLikesSql = "UPDATE blogs SET likes = likes + 1 WHERE id = ?";
              con.query(updateLikesSql, [blogId], function (err, result) {
                if (err) throw err;
                res.send('Liked');
                // console.log(result);
              });
            });
          } else {
            // User has already liked this blog, remove the like
            var deleteLikeSql = "DELETE FROM likes WHERE userID=? AND blogID=?";
            con.query(deleteLikeSql, [userID, blogId], function (err, result) {
              if (err) throw err;

              // Decrement the likes count for the blog in the blogs table
              var updateLikesSql = "UPDATE blogs SET likes = likes - 1 WHERE id = ?";
              con.query(updateLikesSql, [blogId], function (err, result) {
                if (err) throw err;
                res.send('Unliked');
              });
            });
          }
        });
      }
    });
  });
});

app.post('/api/comments/:blogId', isAuthenticated,function (req, res) {
  const blogId = req.params.blogId;
  const { commenterName, commentText } = req.body;

  if (!commenterName || !commentText) {
    return res.status(400).json({ error: 'Commenter name and comment text are required.' });
  }

  con.getConnection(function (err, connection) {
    if (err) {
      console.error('Error connecting to the database:', err);
      return res.status(500).json({ error: 'Failed to connect to the database.' });
    }

    const comment = {
      blog_id: blogId,
      commenter_name: commenterName,
      comment_text: commentText,
      comment_date: new Date(),
    };

    const insertCommentSql = 'INSERT INTO comments SET ?';
    connection.query(insertCommentSql, comment, function (err, result) {
      connection.release();

      if (err) {
        console.error('Error inserting comment into the database:', err);
        return res.status(500).json({ error: 'Failed to save comment to the database.' });
      }

      return res.status(200).json({ message: 'Comment submitted successfully!' });
    });
  });
});

// API endpoint for fetching comments for a specific blog post
app.get('/api/comments/:blogId', isAuthenticated,function (req, res) {
  const blogId = req.params.blogId;

  con.getConnection(function (err, connection) {
    if (err) {
      console.error('Error connecting to the database:', err);
      return res.status(500).json({ error: 'Failed to connect to the database.' });
    }

    const fetchCommentsSql = 'SELECT * FROM comments WHERE blog_id = ?';
    connection.query(fetchCommentsSql, [blogId], function (err, results) {
      connection.release();

      if (err) {
        console.error('Error fetching comments from the database:', err);
        return res.status(500).json({ error: 'Failed to fetch comments from the database.' });
      }

      return res.status(200).json({ comments: results });
    });
  });
});

app.get('/search', function (req, res) {
  const search = req.query.search;
  console.log(req.query);
  con.getConnection(function (err) {
    if (err) throw err;
    var fetchsearch = "SELECT * FROM blogs WHERE topic LIKE '%" + search + "%' OR type LIKE '%" + search + "%' ORDER BY likes DESC";
    con.query(fetchsearch, function (err, blogsres) {
      if (err) throw err;
      res.render('index', { blogs: blogsres });
    })
  })
})

// app.get('/dashboard', function (req, res) {
//   // Check if the user is logged in and has a valid session
//   if (req.session.userId) {
//     con.query("SELECT name, email FROM users WHERE id = ?", [req.session.userId], function (err, result) {
//       if (err) throw err;
//       // Assuming you get a single user result with the given id
//       const user = result[0];
//       // Render the dashboard view with the user data
//       res.render('dashboard', { user: user });
//     });
//   } else {
//     // If the user is not logged in, redirect to the login page or display an error message
//     res.redirect('/login');
//   }
// });
app.post('/update_password', isAuthenticated,function (req, res) {
  const newpass = req.body.newpass;
  const confirmpass = req.body.confirmpass;

  if (newpass !== confirmpass) {
    console.log("Not equal");
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  bcrypt.hash(newpass, 10, function (err, hashedpass) {
    if (err) {
      return res.status(500).json({ error: 'An error occurred while updating the password.' });
    }

    const lemail = req.session.lemail; // Assuming you have the user's email in the session
    const updatepass = 'UPDATE users SET password=? WHERE email=?';
    con.query(updatepass, [hashedpass, lemail], function (err, result) {
      if (err) {
        return res.status(500).json({ error: 'An error occurred while updating the password.' });
      }

      return res.status(200).json({ success: 'Password updated successfully!' });
    });
  });
});


app.get('/dashboard', isAuthenticated,function (req, res) {
  var lemail = req.session.lemail;

  var query = `
    SELECT u.name, u.email, u.mobile, ui.dob, ui.gender
    FROM users u
    LEFT JOIN user_info ui ON u.id = ui.user_id
    WHERE u.email = ?
  `;

  con.query(query, [lemail], function (err, result) {
    if (err) throw err;

    if (result.length === 0) {
      res.status(404).send('User not found');
    } else {
      res.render('dashboard', { users: result }); // Pass the user data to the template
    }
  });
});

// app.post('/update_info', function(req, res) {
//   var lemail = req.session.lemail;
//   var dob = req.body.dob;
//   var gender = req.body.gender;
//   var getid = "select id from users where email=?";

//   con.query(getid, [lemail], function(err, result) { // Changed "req" to "err"
//     if (err) throw err;
//     if (result.length == 0) {
//       console.log("not found");
//     } else {
//       const userid = result[0].id;
//       console.log(userid);
//       var updatequery = "update user_info set dob=?,gender=? where user_id=?";

//       con.query(updatequery, [dob, gender, userid], function(err, result) { // Changed "res" to "result"
//         if (err) throw err;
//         console.log("user info updated successfully");
//         res.redirect('/dashboard');
//       });
//     }
//   });
// });

app.post('/update_info', isAuthenticated,function (req, res) {
  var lemail = req.session.lemail;
  var dob = req.body.dob;
  var gender = req.body.gender;
  console.log(dob);
  console.log(gender);
  var getid = "select id from users where email=?";
  con.query(getid, [lemail], function (err, result) {
    if (err) throw err;
    if (result.length == 0) {
      console.log("User not found");
    } else {
      const userid = result[0].id;
      console.log("User ID:", userid);
      var updateQuery = "UPDATE user_info SET dob = ?, gender = ? WHERE user_id = ?";
      con.query(insertQuery, [dob, gender,userid], function (err, result) {
        if (err) throw err;
        console.log("User info updated successfully");
        res.redirect('/dashboard');
      });
    }
  });
});


app.listen(5000, () => {
  console.log('Server started at http://127.0.0.1:5000/');
});
