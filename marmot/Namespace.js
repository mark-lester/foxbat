module.exports = function(sequelize, DataTypes) {
  return  {
	attributes:{
		namespace: { type: DataTypes.STRING(512),index:true,unique:'name' },
		locale: { type: DataTypes.STRING(8), allowNull: false }
//		public_key:{ type: DataTypes.STRING(64),index:true,unique:'public_key' allowNull: false },
	},
	relations:[{
		relatedModel:'Instance',
		type:'hasMany',
	}]
  }
}

