/*
    @description: Encargado de entregar el valor de cambio de dólar para venta y compra
    @port: 3002
*/
var SERVICE_PORT = 3002;
var redis = require('redis');
var express = require('express');
var morgan = require('morgan')
var app = express();
    app .use(morgan('combined'))
let Parser = require('rss-parser');
let parser = new Parser();

// Connect Redis
function initializeRedis(callback) {
    (function createClient(){
        var client;
        try {
            client = redis.createClient();
            console.log("Redis client connected succesfully.")
        } catch (e) {
            console.log("Error trying to connect with Redis. Trying again in 3 seconds.")
            setTimeout(createClient, 3000);
        }
        callback(client);
    })();
};

initializeRedis(function(client) {
    /*
        @response: JSON
        @body:
        [{
            title: "Title",
            body: "Body",
            date: "2020-01-21"
        }]

    */    
    app.get('/dollar/news', async function (req, res) {
        var news = [];

        client.get('news', async function (error, result) {
            if (error) {
                res.send({
                    success: true,
                    msg: "ERROR",
                    data: []
                });
            } else {
                if(!result) {
                    await parser.parseURL('https://www.cooperativa.cl/noticias/site/tax/port/all/rss_6_75_623_1.xml', function(error, feed) {
                        if(!error) {
                            feed.items.forEach(item => {
                                news.push({
                                    title: item.title,
                                    body: item.content,
                                    date: item.isoDate
                                });
                            });

                            // We set the news into the redis
                            client.set('news', JSON.stringify(news));
                            console.log("Storing news for getting this information from cache");
                            
                            // We send the information as jSON
                            res.send({
                                success: false,
                                msg: "ERROR",
                                data: news
                            });
                        } else {
                            res.send({
                                success: true,
                                msg: "ERROR",
                                data: []
                            });
                        }
                    });
                } else {
                    // We send the information as jSON
                    res.send({
                        success: false,
                        msg: "ERROR",
                        data: JSON.parse(result) 
                    });
                }
            }
        });

    });
    
    app.listen(SERVICE_PORT, function () {
    console.log('Ufro: Service News on port ' + SERVICE_PORT);
    });

});