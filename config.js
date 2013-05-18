module.exports = {
  development:{
    services: {
      scrape : {
        url : 'http://localhost:8002/scrape/api/v1/scrape'
      },
      sentences : {
        url : 'http://localhost:8002/sentences/api/v1/sentences'
      }
    },
    solr:{
      host:'127.0.0.1',
      port:8080,
      core:'pgbot',
      path:'/solr'
    }
  },
  staging:{
    services: {
      scrape : {
        url : 'http://blago.dachev.com/scrape/api/v1/scrape'
      },
      sentences : {
        url : 'http://blago.dachev.com/sentences/api/v1/sentences'
      }
    },
    solr:{
      host:'127.0.0.1',
      port:8080,
      core:'pgbot',
      path:'/solr'
    }
  }
};