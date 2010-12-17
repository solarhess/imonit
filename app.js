require.paths.unshift('vendor/mongoose');
require('./models/models.js');

var http = require('http');
var io = require('socket.io');
var mongoose = require('mongoose').Mongoose;
var db = mongoose.connect('mongodb://localhost/imonit');

var express = require('express');
var jade = require('jade');

var app = express.createServer();
var socket = io.listen(app)

app.configure(function(){
  // app.use(app.router);
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.logger());
  app.use(express.staticProvider(__dirname + '/public'));

  app.set("view engine", "jade");
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  var taskBooks = TaskBook.find().all (function(taskBooks) {
    res.render('index',{
      locals: {
        title: 'Task Books',
        taskBooks: taskBooks
      }
    });
  });
});

app.post('/books', function(req, res) {
  var bookParams = req.body.book;
  var taskBook = new TaskBook();
  taskBook.name = bookParams['name'];
  taskBook.save(function() {
    console.log('saved task book: ' + bookParams['name']);
    message = { type: "book-created", book: taskBook};
    socket.broadcast( JSON.stringify(message) );
  });
  res.redirect('/');
});

app.get('/books/:id', function(req, res) {
  TaskBook.findById(req.params.id, function(taskBook) {
    if (taskBook) {
      res.render('book',{
        locals: {
          title: 'Tasks for ' + taskBook.name,
          tasks: []
        }
      });
    } else {
      res.send('Not Found', 404);
    }
  });
});

app.listen('3000');
