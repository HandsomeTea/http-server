const siege = require('siege');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const port = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../../application-dev-example.yaml'), 'utf8')).PORT;

siege()
    .on(port)
    // .get('/tests/test/12312').for(3000).times//这个借口测试30000次
    .get('/tests/test/12312').for(20).seconds//这个借口测试20秒
    .attack();
