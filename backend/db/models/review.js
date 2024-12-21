'use strict';
module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    review: {
      type: DataTypes.TEXT,
    },
  }, {});

  // Associations
  Review.associate = function(models) {
    Review.belongsTo(models.Spot, { foreignKey: 'spotId' });
    Review.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Review;
};
