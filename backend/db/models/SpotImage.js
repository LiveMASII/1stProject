'use strict';
module.exports = (sequelize, DataTypes) => {
  const SpotImage = sequelize.define('SpotImage', {
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    preview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {});

  // Associations
  SpotImage.associate = function(models) {
    SpotImage.belongsTo(models.Spot, { foreignKey: 'spotId' });
  };

  return SpotImage;
};
