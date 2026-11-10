#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE hospital_auth_db;
    CREATE DATABASE hospital_patient_db;
    CREATE DATABASE hospital_doctor_db;
    CREATE DATABASE hospital_appointment_db;
    CREATE DATABASE hospital_billing_db;
EOSQL
