#!/bin/bash

# Substitute environment variables in the nginx configuration
envsubst '$app_env' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
nginx -g 'daemon off;'
