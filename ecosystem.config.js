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
  ],
  "deploy" : {
    "production" : {
      "user" : "node",
      // Multi host is possible, just by passing IPs/hostname as an array
      "host" : "109.235.69.105",
      // Branch
      "ref"  : "origin/master",
      // Git repository to clone
      "repo" : "https://github.com/gick/reveries-authoring.git",
      // Path of the application on target servers
      "path" : "/usr/src/",
      // Can be used to give options in the format used in the configura-
      // tion file.  This is useful for specifying options for which there
      // is no separate command-line flag, see 'man ssh' 
      // can be either a single string or an array of strings
      "ssh_options": "StrictHostKeyChecking=no",
      // To prepare the host by installing required software (eg: git) 
      // even before the setup process starts
      // can be multiple commands separated by the character ";"
      // or path to a script on your local machine
      "pre-setup" : "apt-get install git",
      // Commands / path to a script on the host machine
      // This will be executed on the host after cloning the repository
      // eg: placing configurations in the shared dir etc
      "post-setup": "ls -la",
      // Commands to execute locally (on the same machine you deploy things)
      // Can be multiple commands separated by the character ";"
      "pre-deploy-local" : "echo 'This is a local executed command'",
      // Commands to be executed on the server after the repo has been cloned
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.json --env production",
      // Environment variables that must be injected in all applications on this env
      "env"  : {
        "NODE_ENV": "production"
      }
    },


}}
