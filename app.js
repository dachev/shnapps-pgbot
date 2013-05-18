module.exports = {
  name   : 'pgbot',
  hidden : false,
  rest   : null,
  about  : [],
  init   : init
};

function init(server, pubsub) {
  var undefined
  var express = require('express');
  var rest    = express();
  var utml    = require('utml');
  var path    = require('path');
  var _       = require('underscore');
  var solr    = require('solr-client');
  var config  = require('./config')[server.settings.env] || null;
  var client  = solr.createClient(config.solr);
  var total   = null;

  // configure views
  rest.set('views', __dirname + '/views');
  rest.set('view engine', 'html');
  rest.engine('html', utml.__express);
  
  rest.use(express.static(__dirname + '/public'));
  rest.get('/', getIndex);
  rest.post('/api/line', postLine);
  
  function getIndex(req, res, next) {
    if (isReady() == false) { return showError(req, res, next); }

    res.render('index', {});
  }

  function postLine(req, res, next) {
    if (isReady() == false) { return showError(req, res, next); }

    if (!req.body) {
      return renderError(req, res, 400, {
        message:'Missing arguments'
      });
    }
    if (!req.body.text) {
      return renderError(req, res, 400, {
        message:'Missing argument: text'
      });
    }
    if (_.isString(req.body.text) == false) {
      return renderError(req, res, 400, {
        message:'Invalid argument: text'
      });
    }

    var text  = req.body.text;
    var query = client.createQuery().q(text).start(0).rows(3);

    client.search(query, function(err, json) {
      if (err) {
        return renderError(req, res, 500, {
          message:'search server error'
        });
      }
      if (!json.response || !json.response.docs) {
        return renderError(req, res, 500, {
          message:'search server error'
        });
      }

      var docs = json.response.docs;
      if (docs.length < 1) {
        docs = [{text:'I don\'t know what to tell you'}];
      }
      
      var idx = Math.round(Math.random()*(docs.length-1))
      var doc = docs[idx] || {text:'I don\'t know what to tell you'};

      if (doc.text == text) {
        doc = {text:'I don\'t know what to tell you'};
      }

      return renderSuccess(req, res, {payload:doc.text});
    });
    
    return;
  }

  // render helpers
  function renderError(req, res, data) {
    if (req.url.indexOf('/api') == 0) {
      // JSON response
      renderJSONError(req, res, data);
    }
    else {
      // HTML response
    }
  }
  function renderJSONError(req, res, data) {
    res.send(500, _.extend({
      message : '',
      payload : ''
    }, data, {success:false}));
  }
  function renderHTMLError(req, res, data) {
    var viewPath = path.join(req.app.parent.settings.views, '500');
    
    res.status(500);
    res.render(viewPath, {
      locals : {
        status  : 500,
        request : req,
        msg     : data.message
      }
    });
  }
  function renderSuccess(req, res, data) {
    if (req.url.indexOf('/api') == 0) {
      // JSON response
      renderJSONSuccess(req, res, data);
    }
    else {
      // HTML response
      renderHTMLSuccess(req, res, data);
    }
  }
  function renderJSONSuccess(req, res, data) {
    res.send(200, _.extend({
      message : '',
      payload : ''
    }, data, {success:true}));
  }
  function renderHTMLSuccess(req, res, data) {
  }
  
  function isReady() {
    if (config == null || total == null) {
      return false;
    }
    
    return true;
  }
  
  // loads total number of documents
  function loadGlobals() {
    var query = client.createQuery().
      q('*:*').
      fl(['id']).
      start(0).
      rows(1000000);

    client.search(query, function(err, json) {
      setTimeout(loadGlobals, 5*60*1000);

      if (err) {
        console.log(err);
        return;
      }
      if (!json.response || !json.response.docs) {
        console.log(json);
        return;
      }

      total = json.response.numFound;
    });
  }

  loadGlobals();

  module.exports.rest = rest;
}



