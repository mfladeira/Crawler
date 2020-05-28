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

// variavel para fazer com que a funcao 'crawFirstPage' seja invocada 1 vez
let count = 0;

// Funcao para baixar imagens
function downloadImages(value) {
    const options = {
        url: `${value}`,
        dest: './images'
    }
    download.image(options)
        .then(({ filename }) => { console.log('Imagem salva') })
        .catch((err) => { })
}

// Faz o crawl da pagina
function craw($, urlBase) {
    $('a').each(function () {
        var value = $(this).attr('href')
        if (value !== undefined && value !== null) {
            if (value.toLowerCase().split('.').pop() === 'jpg' || value.toLowerCase().split('.').pop() === 'jpeg') {
                if (value.startsWith('/')) {
                    value = `${urlBase}${value}`
                    downloadImages(value)
                } else if (value.startsWith('https://') || value.startsWith('http://')) {
                    value = value
                    downloadImages(value)
                }
            }
            if (value.startsWith('/')) {
                value = `${urlBase}${value}`
                set.add(value)
            }
        }
    });
    arr = Array.from(set)

    //Coloca todos os sublinks da página principal na fila 
    for (let i of arr) {
        c._pushToQueue({ uri: i })
    }
}

//Cria arquivo Link.txt para armazenar os links
var file = fs.createWriteStream('Links.txt');
console.time()

//instancia um novo crawler 
var c = new Crawler({
    //Número de workers 
    //maxConnections: 10,

    // Tempo que irá fazer cada requisição, se colocar rateLimit o maxConnection é forçado a ser '1'
    // 1000 ms
    rateLimit: 1000,

    // Cada vez que uma página é 'crawled', a função é invocada
    callback: function (error, res, done) {
        if (error) {
            return
        } else {
            var $ = res.$;
            let urlBase = new URL(res.request.uri.href).origin

            //Verificando cada tag <a>
            if (count == 0) {
                craw.call(this,$,urlBase)
            }

            //Verificando cada tag <img> e baixando as imagens
            if (res.$) {
                $('a').each(function () {
                    var value = $(this).attr('href')
                    if (value !== undefined && value !== null) {
                        if (value.toLowerCase().split('.').pop() === 'jpg' || value.toLowerCase().split('.').pop() === 'jpeg') {
                            if (value.startsWith('/')) {
                                value = `${urlBase}${value}`
                                downloadImages(value)
                            } else if (value.startsWith('https://') || value.startsWith('http://')) {
                                value = value
                                downloadImages(value)
                            }
                        }
                        if (value.startsWith('/')) {
                            value = `${urlBase}${value}`
                            setSubLinks.add(value)
                        }
                    }
                });

                $('img').each(function () {
                    var value = $(this).attr('src')
                    if ((value) !== null && (value) !== undefined) {
                        if (value.startsWith('/')) {
                            // caso de link relativo do tipo  /exemplo/....
                            value = `${urlBase}${value}`
                        } else if (value.startsWith('https://') || value.startsWith('http://')) {
                            value = value
                        }
                        downloadImages(value)
                    }
                });
            }
            count++
        }
        //Adiciona os sublinks + os links da primeira pagina no arquivo Links.txt
        if (c.queueSize == 1) {
            subLinks = (Array.from(setSubLinks)).concat(arr)
            file.on('error', function (err) { });
            subLinks.forEach(value => file.write(`${value}\r\n`));
            file.end();
            console.timeEnd()
        }
        done();
    }
});

//URL principal onde irá começar o crawl
c.queue([
    'http://www.ucp.br/index.php?lang=pt'
]);
