module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // Server setup app (monitoring and starting stopping restarting the server)
    {
      name      : 'setup-authoring-server',
      script    : 'setupServer.js',
      env: {
        NODE_ENV: 'development',
        PORT:8001
      },
      env_production : {
        NODE_ENV: 'production',
        PORT:8001
      }
    },

    // Second application
    {
      name      : 'authoring-server',
      script    : 'server.js',
      env: {
        NODE_ENV: 'development',
        PORT:8000
      },
      env_production : {
        NODE_ENV: 'production',
        PORT:443
      }

    }
  ]

};
