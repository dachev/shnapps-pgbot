#!/usr/bin/env node

try {
  var Url     = require('url');
  var path    = require('path');
  var fs      = require('fs');
  var _       = require('underscore');
  var colors  = require('colors');
  var request = require('request');
  var async   = require('async');
  var program = require('commander'); parseArguments(program);
  var config  = require('../config')[program.environment];
}
catch (ex) {
  console.log(ex);
  console.log('Did you install dependencies? Run: npm install.');
  process.exit(1);
}

scrapeIndex(config);

function scrapeIndex(config) {
  var indexUrl = Url.format({
    protocol : 'http',
    hostname : 'www.paulgraham.com',
    pathname : '/articles.html',
    query    : {}
  });

  var include = [
    'https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js'
  ];

  var script  = extractLinks.toString();
  var form    = {url:indexUrl, script:script, include:include};
  var apiUrl  = config.services.scrape.url;
  var options = {url:apiUrl, json:true, form:form};

  request.post(options, function(err, res, json) {
    // error
    if (err) {
      console.error(err.message.red);
      return process.exit(1);
    }
    if (json == null) {
      var message = 'Error loading: ' + indexUrl;
      console.error(message.red);
      return process.exit(1);
    }
    if (!json.success) {
      console.error(json.message.red);
      return process.exit(1);
    }

    // success
    async.mapLimit(json.payload, 1, scrapePage, function(err, results) {
      // error
      if (err) {
        console.error(err.message.red);
        return process.exit(1);
      }

      // success
      var text     = JSON.stringify(results, null, '  ');
      var filename = path.join(__dirname, '../data/articles.json');

      fs.writeFile(filename, text, function(err) {
        // error
        if (err) {
          console.error(err.message.red);
          return process.exit(1);
        }

        console.log('done'.green);
      });
    });
  });
}

function scrapePage(articleUrl, cb) {
  var include = [
    'https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js'
  ];

  var script  = extractContent.toString();
  var form    = {url:articleUrl, script:script, include:include};
  var apiUrl  = config.services.scrape.url;
  var options = {url:apiUrl, json:true, form:form};

  console.log(articleUrl.yellow);

  request.post(options, function(err, res, json) {
    // error
    if (err) {
      return cb(err);
    }
    if (json == null) {
      return cb({message:'Unknown error loading: ' + articleUrl + ': unknown'});
    }
    if (!json.success) {
      return cb({message:json.message});
    }

    //success
    cb(null, json.payload);
  });
}

function extractLinks() {
  var links = $('table').eq(2).find('a').toArray();
  var hrefs = _.reduce(links, function(memo, item, key) {
      var $item = $(item);
      var href  = $item.attr('href')||'';
      
      if (href.match(/\.html$/)) {
          memo.push('http://www.paulgraham.com/' + href);
      }
      
      return memo;
  }, []);

  return hrefs;
}

function extractContent() {
  var $body = $('body');

  $body.eq(0).find('script').remove();
  $body.eq(0).find('script').remove();

  return $body.find('table').eq(0).text().replace(/\n/g, ' ').replace(/\s+/m, ' ');
}

function parseArguments(program) {
  program
    .version('0.0.1')
    .usage('[options]')
    .option('-e, --environment <name>', 'Environment', String, process.env.NODE_ENV)
    .parse(process.argv);

  if (!program.environment) {
    console.error('No environment specified.'.red)
    process.exit(1);
  }
}
