getMediaSchema = (mongoose, fileCollectionName = "File", collectionName = 'Medias')->
  MediaSchema = mongoose.Schema {
    _id: String
    
    files: [{ type: String, ref: fileCollectionName }]
    role: String
    placeHolderText: String
    meta: {}
  }, { collection : collectionName }
  
  MediaSchema

module.exports = getMediaSchema