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

tokenizeArticles(config);

function tokenizeArticles(config) {
  var filename = path.join(__dirname, '../data/articles.json');
  var text     = fs.readFileSync(filename, {encoding:'utf8'});
  var articles = JSON.parse(text);

  async.mapLimit(articles, 1, tokenizeArticle, function(err, results) {
    // error
    if (err) {
      console.error(err.message.red);
      return process.exit(1);
    }
    
    // success
    var sentences = _.flatten(results);
    var text      = JSON.stringify(sentences, null, '  ');
    var filename  = path.join(__dirname, '../data/sentences.json');

    fs.writeFile(filename, text, function(err) {
      // error
      if (err) {
        console.error(err.message.red);
        return process.exit(1);
      }

      console.log('done'.green);
    });
  });
}

function tokenizeArticle(articleText, cb) {
  var form    = {text:articleText};
  var apiUrl  = config.services.sentences.url;
  var options = {url:apiUrl, json:true, form:form};

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
