const siege = require('siege');

siege()
    .on(3000)
    // .get('/tests/test/12312').for(3000).times//这个借口测试30000次
    .get('/tests/test/12312').for(20).seconds//这个借口测试20秒
    .attack();
