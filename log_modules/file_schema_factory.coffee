getFileSchema = (mongoose, collectionName = "Files")->
  FileSchema = mongoose.Schema {
    _id: String
    
    # these property may work only after getFile got called
    MIME: String
    length: Number
    photoSize: [Number]
    duration: Number
    meta: {}
    # these properety should be work at any time
    isThumb: Boolean
    contentSource: String
    contentSrc: {}
  }, { collection : collectionName }
  
  FileSchema

module.exports = getFileSchema