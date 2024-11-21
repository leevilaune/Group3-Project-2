#!/usr/bin/env bash

# sorry, just linux things

# Name of the tmux session
SESSION_NAME="dev_environment"

# Start a new tmux session with a specific name
tmux new-session -d -s $SESSION_NAME

# Pane 1: Run the backend commands
tmux send-keys "source .venv/bin/activate" C-m
tmux send-keys "flask --app backend/api.py run --debug --port 3000" C-m

# Split the window horizontally
tmux split-window -h

# Pane 2: Run the frontend commands
tmux send-keys "cd ./frontend/" C-m
tmux send-keys "live-server" C-m

# Attach to the tmux session
tmux attach-session -t $SESSION_NAME
