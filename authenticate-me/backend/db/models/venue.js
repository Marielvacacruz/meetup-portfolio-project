'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Venue extends Model {

    static associate(models) {
      Venue.hasMany(
        models.Event, { foreignKey: 'venueId'}
      );

      Venue.belongsTo(
        models.Group, { foreignKey: 'groupId'}
      );
    }
  }
  Venue.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.STRING
    },
    groupId: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    address: {
      allowNull: false,
      type:DataTypes.STRING
    },
    city: {
      allowNull: false,
      type: DataTypes.STRING
    },
    state: {
      allowNull: false,
      type: DataTypes.STRING
    },
    lat: {
      allowNull: false,
      type: DataTypes.DECIMAL
    },
    lng: {
      allowNull: false,
      type: DataTypes.DECIMAL
    },
  }, {
    sequelize,
    modelName: 'Venue',
  });
  return Venue;
};
