'use strict';
module.exports = (sequelize, DataTypes) => {
  const ReviewImage = sequelize.define('ReviewImage', {
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Reviews',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});

  ReviewImage.associate = function(models) {
    ReviewImage.belongsTo(models.Review, { foreignKey: 'reviewId' });
    
  };

  return ReviewImage;
};
