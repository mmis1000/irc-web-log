cache = null

getUserSchema = (mongoose, mediaCollectionName = "Media", collectionName = "Users")->
  UserSchema = mongoose.Schema {
    _id: String
    images: [{ type: String, ref: mediaCollectionName }]
    ids: [{ type: String, index : true }]
    nicknames: [String]
    
    firstName: String
    midName: String
    lastName: String
    
    profileUrl: String
  }, { collection : collectionName }
  
  UserSchema.methods.getFullName = ()->
    namePart = [];
    namePart.push @firstName if @firstName
    namePart.push @midName if @midName
    namePart.push @lastName if @lastName
    return namePart.join ' ' if namePart.length > 0
    
    return @nicknames[0] if @nicknames.length > 0
    
    return @_id
  
  UserSchema
  
module.exports = getUserSchema;