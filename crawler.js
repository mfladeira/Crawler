//Biblioteca para trabalhar com crawler
var Crawler = require("crawler");

//Biblioteca para trabalhar com arquivos
const fs = require('fs')

//Biblioteca para baixar imagens
const download = require('image-downloader')

//Array para salvar os links da pagina principal
var arr = new Array();

//Array para salvar os subLinks da pagina principal
var subLinks = new Array();

//Objeto que só permite que seja armazenado valores únicos - "Da primeira página"
var set = new Set()

//Objeto que só permite que seja armazenado valores únicos - "Dos sublinks"
var setSubLinks = new Set()

//Regex para verificar se o link está formato correto
var urlRegex = /(https?:\/\/[^\s]+)/g;

//instancia um novo crawler 
var c = new Crawler({

    //Número de workers 
    maxConnections: 4,

    // Cada vez que uma página é 'crawled', a função é invocada
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;
            //Verificando cada tag <a>
            $('a').each(function () {
                var value = $(this).attr('href')
                if (urlRegex.exec(value) !== null) {
                    set.add(value)
                }
            });
            arr = Array.from(set)

            //Verificando cada tag <img> e baixando as imagens
            $('img').each(function () {
                var value = $(this).attr('src')
                if ((value) !== null && (value) !== undefined) {
                    const options = {
                        url: value,
                        dest: './images'
                    }
                    download.image(options)
                        .then(({ filename }) => {
                            console.log('Saved to', filename)
                        })
                        .catch((err) => console.error(err))
                }
            });

            //instanciando outro crawler para os sublinks
            var d = new Crawler({
                rateLimit: 1000,// Tempo para cada requisição em 'ms'
                maxConnections: 10,
                callback: function (error, res, done) {
                    if (error) {
                        return console.log(error);
                    } else {
                        //Pega a resposta da requisição
                        //Se for HTML entra na condição
                        var $ = res.$;
                        if (res.$) {
                            $('a').each(function () {
                                var value = $(this).attr('href')
                                if (urlRegex.exec(value) !== null) {
                                    setSubLinks.add(value)
                                }
                            });
                            subLinks = (Array.from(setSubLinks)).concat(arr)
                            var file = fs.createWriteStream('Links.txt');
                            file.on('error', function (err) { Console.log(err) });
                            subLinks.forEach(value => file.write(`${value}\r\n`));
                            file.end();
                        }


                        //instanciando outro crawler para baixas imagens dos sublinks
                        var e = new Crawler({
                            rateLimit: 1000,
                            maxConnections: 10,
                            callback: function (error, res, done) {
                                if (error) {
                                    return console.log(error);
                                } else {
                                    var $ = res.$;
                                    if (res.$) {
                                        $('img').each(function () {
                                            var value = $(this).attr('src')
                                            if ((value) !== null && (value) !== undefined) {
                                                const options = {
                                                    url: value,
                                                    dest: './images'
                                                }
                                                download.image(options)
                                                    .then(({ filename }) => {
                                                        console.log('Saved to', filename)
                                                    })
                                                    .catch((err) => console.error(err))
                                            }
                                        });
                                    }

                                    done();
                                }

                            }
                        });
                        //Fila das páginas que serão 'crawled' para baixar imagens
                        e.queue(subLinks);
                    }
                    done();
                }
            });
            //Fila das páginas que serão 'crawled' para obter sublinks
            d.queue(arr);
        }
        done();
    }
});
//URL principal onde irá começar o crawl
c.queue([
    'https://jovemnerd.com.br/bunker/tag/detroid-become-human/'
]);

