cache = null
moment = require 'moment'

getMessageSchema = (mongoose, mediaCollectionName = "Media", collectionName = "Messages")->
  MessageSchema = mongoose.Schema {
    from : { type : String, index : true }
    to : { type : String, index : true }
    message : String
    
    # v2 message format
    messageFormat: String
    messageFormated: String
    
    # optional, for conflict check
    messageId : { type : String, index : true }
    
    # if the text is meaningful and should be display along with medias
    asText: { type : Boolean, index : true }
    
    isOnChannel : Boolean
    medias: [{ type: String, ref: mediaCollectionName }]
    time : { type : Date, index : true }
    meta: {}
  }, { collection : collectionName }
  
  MessageSchema.index({ from: 1, time: 1 });
  MessageSchema.index({ to: 1, time: -1 });
  
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