module.exports = {
  development:{
    services: {
      scrape : {
        url : 'http://dev.shnapps.dachev.com/scrape/api/v1/scrape'
      },
      sentences : {
        url : 'http://dev.shnapps.dachev.com/sentences/api/v1/sentences'
      },
      solr:{
        host:'solr5',
        port:8983,
        core:'pgbot',
        path:'/solr'
      }
    }
  },
  staging:{
    services: {
      scrape : {
        url : 'http://dev.shnapps.dachev.com/scrape/api/v1/scrape'
      },
      sentences : {
        url : 'http://dev.shnapps.dachev.com/sentences/api/v1/sentences'
      },
      solr:{
        host:'solr5',
        port:8983,
        core:'pgbot',
        path:'/solr'
      }
    }
  },
  production : {
    services: {
      scrape : {
        url : 'http://shnapps.dachev.com/scrape/api/v1/scrape'
      },
      sentences : {
        url : 'http://shnapps.dachev.com/sentences/api/v1/sentences'
      },
      solr:{
        host:'solr5',
        port:8983,
        core:'pgbot',
        path:'/solr'
      }
    }
  }
};
