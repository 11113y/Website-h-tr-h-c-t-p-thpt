#!/bin/bash
# Script to set streak warning for lehuulinh965
mysql -h 127.0.0.1 -u root -e "UPDATE web_hoc_toan.users SET last_active_at = DATE_SUB(NOW(), INTERVAL 1 DAY), points = 984 WHERE username = 'lehuulinh965';"
echo "Successfully updated lehuulinh965 to have a streak warning status!"
