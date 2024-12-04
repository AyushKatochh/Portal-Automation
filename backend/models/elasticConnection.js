const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'https://f63f58fcc89149f9893a10485538964b.us-east-2.aws.elastic-cloud.com:443', // Elasticsearch endpoint
  auth: {
    apiKey: { // API key ID and secret
      id: 'nmD5jZMBKGiL6aU6AolE',
      api_key: 'CIYmVdMGRj-Z2y18xAfh5w',
    }
  }
  
})
