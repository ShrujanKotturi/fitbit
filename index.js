/**
 * Created by shruj on 10/28/2016.
 */

var express = require('express'),
    bodyparser = require('body-parser'),
    routes = require('./routes'),
    app = express(),
    PORT = process.env.PORT || 3000;

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.use(function(req,res,next){
    res.setHeader('Access-Control-Allow-Origin','*');
    next();
});




app.set('view engine', 'ejs');
app.set('views', './views');
app.use('/views', express.static(__dirname + '/views'));

routes.configure(app);

app.use('/assets', express.static('assets'));

app.get('/views', function (req, res) {
    console.log(__dirname);
    res.render(__dirname+'/views/signup-page');
});



var server = app.listen(PORT, function() {
    console.log('Server listening on port ' + PORT);
});