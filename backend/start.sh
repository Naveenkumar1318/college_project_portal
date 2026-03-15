#!/bin/bash

service mysql start

mysql -u root -e "CREATE DATABASE IF NOT EXISTS adhiyamaan_project_collab;"

uvicorn app:app --host 0.0.0.0 --port 8000