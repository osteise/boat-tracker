require('dotenv').config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ?? '',
  },
});