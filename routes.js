/**
 * Created by shruj on 10/28/2016.
 */
var util = require('util'),
    FitbitApiClient = require("fitbit-node"),
    fs = require("fs"),
    https = require('https'),
    Q = require('q'),
    storage = require('node-persist');

var fileName = "./secret-config.json";
var config;

try {
    config = require(fileName);
}
catch (err) {
    config = {};
    console.log("unable to read file '" + fileName + "': ", err);
}

var client = new FitbitApiClient(config.clientId, config.clientSecret);
storage.initSync();

module.exports = {
    configure: function(app) {
        app.get('/auth/fitbit', function (req, res) {
            res.redirect(client.getAuthorizeUrl(config.scope, config.callbackURI));
        });

        app.get('/auth/fitbit/callback', function (req, res) {
            console.log(util.inspect(req.query));
            client.getAccessToken(req.query.code, config.callbackURI).then(function (result) {
                // use the access token to fetch the user's profile information
               // console.log('token : ' +result.access_token);
                storage.setItemSync('auth_token', result.access_token);
                res.redirect(302, '/views/profile-page');

            }).catch(function (error) {
                if(error['errors']['errorType'] == 'expired_token'){
                    refreshAccesstoken('refresh_token',refresh_token, 28800).then(function (results){
                        console.log('refreshed token');
                        console.log(results[0]);
                    }).catch(function (error){
                        res.send(error);
                    });

                }else {
                    res.send(error);
                }
            });
        });

        app.get('/views/profile-page', function (req, res){
            res.render(__dirname+'/views/profile-page', {token:storage.getItemSync('auth_token')});
        });

        app.get('/profile', function (req, res){
            client.get("/profile.json", storage.getItemSync('auth_token')).then(function (results) {
                res.send(results[0]);
            });
        });

        // app.get('/profile', function (req, res){
        //     client.get("/profile.json", req.query.token).then(function (results) {
        //         res.send(results[0]);
        //     });
        // });

        app.get('/steps', function (req, res){
            client.get("/activities/date/2016-10-26.json", storage.getItemSync('auth_token')).then(function (results) {
                res.send(results[0]);
            }).catch(function (error){
                res.send(error);
            });
        });

        app.get('/heart', function (req, res){
            client.get("/activities/heart/date/today/7d.json", storage.getItemSync('auth_token')).then(function (results) {
                res.send(results[0]);
            }).catch(function (error){
                res.send(error);
            });
        });


        app.get('/logout', function (req, res) {
            // var options = {
            //     host: 'api.fitbit.com',
            //     path: '/oauth2/revoke',
            //     method: 'POST',
            //     headers: {
            //         'Authorization':'Basic '+ new Buffer(config.clientID + ':' +config.clientSecret).toString('base64')
            //     },
            //     body: {
            //         'token': req.body.token
            //     }
            // };
            //
            // console.log(util.inspect(options));
            //
            // https.request(options, function(res){
            //     res.setEncoding('utf8');
            //     res.on('data', function (chunk) {
            //         console.log('BODY: ' + chunk);
            //     });
            //     console.log(res.statusCode);
            // })

            //var token = req.body.token;
            var token =  storage.getItemSync('auth_token');
            client.revokeAccessToken(token).then(function (results) {
                res.render(__dirname+'/views/signup-page');
            }).catch(function (error) {
                res.send(error);
            });

        });
    }
};

function refreshAccesstoken(accessToken, refreshToken, expiresIn) {
    if(expiresIn === undefined) expiresIn = -1;

    var deferred = Q.defer();

    this.oauth2 = OAuth2({
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        site: 'https://api.fitbit.com/',
        authorizationPath: 'oauth2/authorize',
        tokenPath: 'oauth2/token',
        useBasicAuthorizationHeader: true
    });

    var token = this.oauth2.accessToken.create({
        grant_type: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn
    });

    token.refresh(function (error, result) {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(result.token);
        }
    });

    return deferred.promise;
}