#!/bin/bash

if [[ $(/usr/sbin/lsof -ti :3000 && /usr/sbin/lsof -ti :8000) ]]; then
    echo "Server already running... Cool!"
else
    echo "Starting reg Server"
    # cd /var/app/pixelpeople && . ~/.nvm/nvm.sh && nohup node server.js 0<&- &>/home/ec2-user/boot-log.log &
    cd /var/app/pixelpeople && . ~/.nvm/nvm.sh && DEBUG=express:* node server.js 0<&- &>>/home/ec2-user/boot-log.log &

    echo "Starting sock Server"
    # cd /var/app/pixelpeople && . ~/.nvm/nvm.sh && nohup node socketServer.js 0<&- &>/home/ec2-user/boot-log.log &
    cd /var/app/pixelpeople && . ~/.nvm/nvm.sh && DEBUG=express:* node socketServer.js 0<&- &>>/home/ec2-user/boot-log.log &
    echo "I rly deed it"
fi