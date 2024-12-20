'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      hashedPassword: {
        type: DataTypes.STRING.BINARY,
        allowNull: false,
      },
      firstName: {  // Add firstName field
        type: DataTypes.STRING,
        allowNull: true,  // Optional, set to true if not required
      },
      lastName: {  // Add lastName field
        type: DataTypes.STRING,
        allowNull: true,  // Optional, set to true if not required
      }
    },
    {
      sequelize,
      modelName: 'User',
      defaultScope: {
        attributes: { exclude: ['hashedPassword', 'email', 'createdAt', 'updatedAt'] },
      },
    }
  );
  return User;
};
