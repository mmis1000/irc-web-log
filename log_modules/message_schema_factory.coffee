cache = null
moment = require 'moment'

getMessageSchema = (mongoose, mediaCollectionName = "Media", collectionName = "Messages")->
  MessageSchema = mongoose.Schema {
    from : String
    to : String
    message : String
    
    # v2 message format
    messageFormat: String
    messageFormated: String
    
    # optional, for conflict check
    messageId : { type : String, index : true }
    
    isOnChannel : Boolean
    medias: [{ type: String, ref: mediaCollectionName }]
    time : { type : Date, index : true }
  }, { collection : collectionName }
  
  MessageSchema
  
module.exports = getMessageSchema;