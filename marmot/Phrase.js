module.exports = function(sequelize, DataTypes) {
  return  {
	attributes:{
		key: { type: DataTypes.STRING(256), allowNull: false},
		locale: { type: DataTypes.STRING(8), allowNull: false},
		phrase: { type: DataTypes.BLOB, allowNull: false },
		rank: { type: DataTypes.STRING(16)},
		on: { type: DataTypes.STRING(64) },
		origin: { type: DataTypes.STRING(64) },
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
		fields:'key locale'.split(' ')
	}]
  }
}
