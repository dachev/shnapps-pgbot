#!/usr/bin/env node

try {
  var Url     = require('url');
  var path    = require('path');
  var fs      = require('fs');
  var _       = require('underscore');
  var colors  = require('colors');
  var request = require('request');
  var solr    = require('solr-client');
  var program = require('commander'); parseArguments(program);
  var config  = require('../config')[program.environment];
  var client  = solr.createClient(config.solr);
}
catch (ex) {
  console.log(ex);
  console.log('Did you install dependencies? Run: npm install.');
  process.exit(1);
}

importSentences(config);

function importSentences(config) {
  var filename  = path.join(__dirname, '../data/sentences.json');
  var text      = fs.readFileSync(filename, {encoding:'utf8'});
  var sentences = JSON.parse(text);
  var documents = _.reduce(sentences, function(memo, item, key) {
    memo.push({
      id   : (key+1).toString(),
      text : item
    });
    
    return memo;
  }, []);

  client.autoCommit = true;
  client.deleteByQuery('*:*', function(err, json) {
    if (err) {
      console.error(err.message.red);
      return process.exit(1);
    }
    if (!json.responseHeader || json.responseHeader.status != 0) {
      console.error('Invalid response from solr server'.red);
      return process.exit(1);
    }
  });

  client.add(documents, function(err, json) {
    if (err) {
      console.error(err.message.red);
      return process.exit(1);
    }

    console.log('done'.green);
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

