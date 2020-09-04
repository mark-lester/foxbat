module.exports = function(sequelize, DataTypes) {
  return  {
	  attributes:{
		locale: { type: DataTypes.STRING(8), allowNull: false},
		translation: { type: DataTypes.STRING(1024), allowNull: false },
	},
	relations:[{
		relatedModel:'Phrase',
		type:'belongsTo',
	},{
		relatedModel:'Namespace',
		type:'belongsTo',
	}],
	indexes:[{
		name:'key',
		unique:true,
		fields:'PhraseId NameSpaceId locale'.split(' ')
	}],
	include:['Namespace']
  }
}
