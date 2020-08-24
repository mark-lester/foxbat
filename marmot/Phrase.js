module.exports = function(sequelize, DataTypes) {
  return  {
	attributes:{
		key: { type: DataTypes.STRING(256), allowNull: false},
		locale: { type: DataTypes.STRING(8), allowNull: false},
		phrase: { type: DataTypes.STRING(1024), allowNull: false },
		rank: { type: DataTypes.STRING(16)},
		control: { type: DataTypes.STRING(64) },
		origin: { type: DataTypes.STRING(64) },
	},
	relations:[{
		relatedModel:'Phrase',
		as:'PluralPhrase',
		type:'hasMany',
	},{
		relatedModel:'Translation',
		type:'hasMany',
	}],
	indexes:[{
		name:'key',
		unique:true,
		fields:'key locale'.split(' ')
	}]
  }
}
