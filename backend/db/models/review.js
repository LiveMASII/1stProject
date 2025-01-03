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

  Review.associate = function(models) {
    Review.belongsTo(models.Spot, { foreignKey: 'spotId' });
    Review.belongsTo(models.User, { foreignKey: 'userId' });
    Review.hasMany(models.ReviewImage, { foreignKey: 'reviewId', onDelete: 'CASCADE' });
  };

  return Review;
};
