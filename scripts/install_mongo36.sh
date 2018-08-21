#!/bin/bash
set -e
 
echo "Installing repo"
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
 
echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.6 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
 
 
echo "Installing binaries"
apt-get update
apt-get install -y mongodb-org
service mongod stop
 
 
echo "Setting up default settings"
rm -rf /var/lib/mongodb/*
cat > /etc/mongod.conf <<'EOF'
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
 
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
 
net:
  port: 27017
  bindIp: localhost,0.0.0.0
  maxIncomingConnections: 100
  
security:
  authorization: enabled
 
EOF
 
service mongod start
sleep 5
 
mongo admin <<'EOF'
use admin
rs.initiate()
exit
EOF
 
sleep 5
 
echo "Adding admin user"
mongo admin <<'EOF'
use admin
rs.initiate()
var user = {
  "user" : "admin",
  "pwd" : "weak",
  roles : [
      {
          "role" : "userAdminAnyDatabase",
          "db" : "admin"
      }
  ]
}
db.createUser(user);
exit
EOF
 
echo "Complete"
