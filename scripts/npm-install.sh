#!/usr/bin/env bash
# Cursor/IDE may inject a dead local proxy (127.0.0.1:15236); bypass for npm.
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy
exec npm "$@"
