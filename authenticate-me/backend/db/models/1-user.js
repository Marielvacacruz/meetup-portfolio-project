'use strict';
const bcrypt = require('bcryptjs');

const {
  Model, Validator, UnknownConstraintError} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    toSafeObject() {
      const { id, email, firstName, lastName} = this;
      return { id, email, firstName, lastName};
    }
    validatePassword(password) {
      return bcrypt.compareSync(password, this.hashedPassword.toString());
    }

    static getCurrentUserById(id) {
      return User.scope("currentUser").findByPk(id);
    }

    static async login({ credential, password }) {
      const { Op } = require('sequelize');
      const user = await User.scope('loginUser').findOne({
        where: {
          [Op.or]: {
            username: credential,
            email: credential
          }
        }
      });
      if (user && user.validatePassword(password)) {
        return await User.scope('currentUser').findByPk(user.id);
      }
    }

    static async signup({ username, email, password, firstName, lastName }) {
      const hashedPassword = bcrypt.hashSync(password);
      const user = await User.create({
        username,
        email,
        firstName,
        lastName,
        hashedPassword
      });
      return await User.scope('currentUser').findByPk(user.id);
    }

    static associate(models) {
      User.hasMany(
        models.Group, { foreignKey: 'organizerId', onDelete: 'CASCADE', hooks: true }
      );

      User.belongsToMany(
        models.Group, { through: models.Member }
      );

      User.belongsToMany(
        models.Event, {through: models.Attendee }
      );

      User.hasMany(
        models.Member, {foreignKey: 'userId'}
      );

      User.hasMany(
        models.Attendee, {foreignKey: 'userId'}
      );
    }
  }
  User.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    username:{
      //allowNull: false,
      type: DataTypes.STRING,
      validate: {
        len: [4, 30],
        isNotEmail(value){
          if (Validator.isEmail(value)){
            throw new Error("Cannot be an email.")
          }
        }
      },
      unique:true
    },
    firstName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    lastName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    email: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        len: [3, 256]
      },
      unique:true
    },
    hashedPassword:{
      allowNull: false,
      type: DataTypes.STRING.BINARY,
      validate: {
        len: [60, 60]
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    defaultScope: {
      attributes: {
        exclude: ["hashedPassword", "email", "createdAt", "updatedAt" ]
      }
    },
    scopes: {
      currentUser: {
        attributes: {exclude: ["hashedPassword"]}
      },
      loginUser: {
        attributes: {}
      }
    }
  });
  return User;
};
