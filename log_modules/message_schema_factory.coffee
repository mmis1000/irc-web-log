cache = null
moment = require 'moment'

getMessageSchema = (mongoose, mediaCollectionName = "Media", collectionName = "Messages")->
  MessageSchema = mongoose.Schema {
    from : String
    to : String
    message : String
    isOnChannel : Boolean
    medias: [{ type: String, ref: mediaCollectionName }]
    time : { type : Date, index : true }
  }, { collection : collectionName }
  
  MessageSchema
  
module.exports = getMessageSchema;