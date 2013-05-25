var undefined = undefined;
var path      = require('path');
var express   = require('express');
var _         = require('underscore');
var solr      = require('solr-client');
var client    = null;
var total     = null;

module.exports = {
  name   : 'pgbot',
  hidden : false,
  rest   : null,
  about  : [],
  init   : initApp
};


// init functions
function initApp(server, pubsub) {
  var config = require('./config')[server.settings.env]||{};
  var rest   = express();
  
  rest.config = config;
  rest.set('env', server.settings.env);
  
  initExpress(config, rest, function(err) {
    initSolr(config, rest, function(err) {});
  });
  
  module.exports.rest = rest;
}
function initExpress(config, rest, cb) {
  var utml = require('utml');
  
  rest.use(express.static(__dirname + '/public'));
  
  // configure views
  rest.set('views', __dirname + '/views');
  rest.set('view engine', 'html');
  rest.engine('html', utml.__express);

  // configure page routes
  rest.get('/', checkConfigured, pageGetIndex);
  
  // configure API routes
  rest.post('/api/v1/line', checkConfigured, api1PostLine);

  cb(null);
}
function initSolr(config, rest, cb) {
  client = solr.createClient(config.solr);

  loadGlobals();

  cb(null);
}



// route middleware
function checkConfigured(req, res, next) {
  if (!req.body) { req.body = {}; }
  
  if (isReady() == false) {
    return renderError(req, res, 500, {
      message:'This application is misconfigured.'
    });
  }
  
  next();
}


// page endpoints
function pageGetIndex(req, res, next) {
  res.render('index', {
    locals : {}
  });
}


// API endpoints
function api1PostLine(req, res, next) {
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
function renderError(req, res, code, data) {
  if (req.url.indexOf('/api') == 0) {
    // JSON response
    renderJSONError(req, res, code, data);
  }
  else {
    // HTML response
    renderHTMLError(req, res, code, data);
  }
}
function renderJSONError(req, res, code, data) {
  res.status(code);
  res.json(_.extend({
    message : '',
    payload : ''
  }, data, {success:false}));
}
function renderHTMLError(req, res, code, data) {
  var viewPath = path.join(req.app.parent.settings.views, '500');
  
  res.status(code);
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
  res.status(200);
  res.json(_.extend({
    message : '',
    payload : ''
  }, data, {success:true}));
}
function renderHTMLSuccess(req, res, data) {
}


// miscellaneous
function isReady() {
  if (client == null || total == null) {
    return false;
  }
  
  return true;
}
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
