module.exports = data => toString.call(data).replace(/object|\[|]|\s/g, '').toLowerCase();
