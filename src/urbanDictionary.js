var http = require('http');

module.exports.getRandomEntry = function (cb) {
  http.get('http://www.urbandictionary.com/random.php', function (res) {
    var body = '';
    
    res.on('data', function (d) {
      body += d;
    });
    
    res.on('end', function () {
      var term = body.match(/define\.php\?term=(.*)"/)[1];

      if (term.match(/(nigg|retard)/i)) {
        module.exports.getRandomEntry(cb);
        return;
      }

      http.get('http://www.wdyl.com/profanity?q=' + term, function (res) {

        var json = '';
        res.on('data', function (d) {
          json += d;
        });

        res.on('end', function () {
          var profanity = JSON.parse(json);

          if (profanity.response === 'true') {
            term = decodeURIComponent(term).replace(/\+/g, ' ');
            cb(null, {
              term: term[0].toUpperCase() + term.substr(1),
              link: body.match(/href="(.*)"/)[1]
            });
          } else {
            module.exports.getRandomEntry(cb);
          }
        });

        res.on('error', function (err) {
          cb(err);
        });

      });

    });

    res.on('error', function (err) {
      cb(err);
    });

  });
};