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
  
  MessageSchema.methods.toString = ()->
    if @messageFormat is 'html'
      "#{@from}: #{@message}"
    else
      if @message.match /^\u0001ACTION\s.+\u0001$/ig
        "* #{@from} feels #{@message.replace /^\u0001ACTION\s|\u0001$/ig, ''}"
      else
        "#{@from}: #{@message}"
  MessageSchema
  
module.exports = getMessageSchema;