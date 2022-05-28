'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Event.belongsTo(
        models.Group, { foreignKey: 'groupId' }
      );

      Event.belongsTo(
        models.Venue, {foreignKey: 'venueId'}
      );

      Event.hasMany(
        models.Image, { foreignKey: 'eventId', onDelete: 'CASCADE', hooks: true}
      );

      Event.belongsToMany(
        models.User, { through: models.Attendee }
      );

      Event.hasMany(
        models.Attendee, {foreignKey: 'eventId',  onDelete: 'CASCADE', hooks: true}
      )
    }
  }
  Event.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    venueId: {
      type:DataTypes.INTEGER
    },
    groupId: {
      allowNull: false,
      type:DataTypes.INTEGER
    },
    name: {
      allowNull:false,
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.STRING,
    },
    capacity: {
      allowNull: false,
      type:DataTypes.INTEGER
    },
    price: {
      allowNull: false,
      type: DataTypes.DECIMAL
    },
    description: {
      type: DataTypes.TEXT
    },
    startDate: {
      allowNull: false,
      type: DataTypes.DATE
    },
    endDate: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};
