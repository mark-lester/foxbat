module.exports = function(sequelize, DataTypes) {
  return  {
	  attributes:{
		PhraseId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
		NamespaceId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
	},
	relations:[{
		relatedModel:'Phrase',
		type:'belongsTo',
	},{
		relatedModel:'Namespace',
		type:'belongsTo',
	}]
  }
}
