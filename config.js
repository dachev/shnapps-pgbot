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
  production:{
    services: {
      scrape : {
        url : 'http://localhost/scrape/api/v1/scrape'
      },
      sentences : {
        url : 'http://localhost/sentences/api/v1/sentences'
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