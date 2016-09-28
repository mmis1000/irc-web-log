getMediaSchema = (mongoose, fileCollectionName = "File", collectionName = 'Medias')->
  MediaSchema = mongoose.Schema {
    _id: String
    time : { type : Date, index : true }
    files: [{ type: String, ref: fileCollectionName }]
    role: String
    placeHolderText: String
    meta: {}
  }, { collection : collectionName }
  
  MediaSchema

module.exports = getMediaSchema