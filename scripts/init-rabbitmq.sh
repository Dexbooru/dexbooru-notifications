#!/bin/bash

EXCHANGE_NAME="notification_events"
EXCHANGE_TYPE="topic"
VHOST="/"

RABBITMQ_CTL="rabbitmqctl"

# --- 1. Declare the Topic Exchange ---
$RABBITMQ_CTL declare_exchange -p $VHOST $EXCHANGE_NAME $EXCHANGE_TYPE durable

# --- 2. Define Queues and Bindings ---
declare -A QUEUE_BINDINGS=(
    ["q.friend_invite"]="user.friend_invite.*"
    ["q.post_like_first"]="post.like.first.*"
    ["q.post_like_10x"]="post.like.multiple_10.*"
    ["q.post_comment_first"]="post.comment.first.*"
    ["q.post_comment_5x"]="post.comment.multiple_5.*"
)

for QUEUE_NAME in "${!QUEUE_BINDINGS[@]}"; do
    BINDING_KEY=${QUEUE_BINDINGS[$QUEUE_NAME]}

    # Declare the Queue (Durable)
    $RABBITMQ_CTL declare_queue -p $VHOST $QUEUE_NAME durable

    # Declare the Binding
    $RABBITMQ_CTL set_binding -p $VHOST $EXCHANGE_NAME $QUEUE_NAME $BINDING_KEY
done