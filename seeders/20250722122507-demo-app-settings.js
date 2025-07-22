'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('app_setting', [{
      key: 'appName',
      value: 'Demo App'
    }, {
      key: 'appVersion',
      value: '1.0.0'
    },
    {
      key: 'flask_api_url',
      value: 'http://localhost:5000/api/'
    }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('app_setting', null, {});
  }
};
