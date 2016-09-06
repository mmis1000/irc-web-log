module.exports = {
  "ip" :  process.env.IP || "0.0.0.0",
  "port" : process.env.PORT || 8080,
  "dbpath" : "mongodb://localhost/test",
  "collectionName" : "Messages",
  "locale" : "en-US",
  "timezone" : "+00:00",
  "indexItems" : [
    {"text" : "Web Chat for #test5566 on freenode.net", "path" : "http://webchat.freenode.net/?channels=%23test5566"},
    {"text" : "Log for #test5566", "path" : "/channel/test5566/today"}
  ],
  "ejs-options": {
    "rmWhitespace": true,
    "cache": true
  },
  "minify-html": false,
  "enable-db-manager": true,
  "db-manager-path": '/mongo_express',
  "db-manager-account": 'root',
  "db-manager-password": "Pa$$$wOr0d"
}