(function(){
  var ref$, send_feature_enabled, send_feature_disabled;
  ref$ = require('libs_backend/logging_enabled_utils'), send_feature_enabled = ref$.send_feature_enabled, send_feature_disabled = ref$.send_feature_disabled;
  Polymer({
    is: 'misc-options',
    properties: {
      allow_daily_goal_notifications: {
        type: Boolean,
        value: function(){
          var stored_value;
          stored_value = localStorage.getItem('allow_daily_goal_notifications');
          if (stored_value != null) {
            return stored_value === 'true';
          }
          return true;
        }(),
        observer: 'allow_daily_goal_notifications_changed'
      },
      allow_nongoal_timer: {
        type: Boolean,
        value: function(){
          var stored_value;
          stored_value = localStorage.getItem('allow_nongoal_timer');
          if (stored_value != null) {
            return stored_value === 'true';
          }
          return true;
        }(),
        observer: 'allow_nongoal_timer_changed'
      }
    },
    rerender: function(){
      this.allow_daily_goal_notifications = function(){
        var stored_value;
        stored_value = localStorage.getItem('allow_daily_goal_notifications');
        if (stored_value != null) {
          return stored_value === 'true';
        }
        return true;
      }();
      return this.allow_nongoal_timer = function(){
        var stored_value;
        stored_value = localStorage.getItem('allow_nongoal_timer');
        if (stored_value != null) {
          return stored_value === 'true';
        }
        return true;
      }();
    },
    allow_nongoal_timer_changed: function(allow_nongoal_timer, prev_value_allow_nongoal_timer){
      var send_change, prev_allow_nongoal_timer;
      if (prev_value_allow_nongoal_timer == null) {
        return;
      }
      if (allow_nongoal_timer == null) {
        return;
      }
      send_change = true;
      prev_allow_nongoal_timer = localStorage.getItem('allow_nongoal_timer');
      if (prev_allow_nongoal_timer != null) {
        prev_allow_nongoal_timer = prev_allow_nongoal_timer === 'true';
        if (prev_allow_nongoal_timer === allow_nongoal_timer) {
          send_change = false;
        }
      }
      localStorage.setItem('allow_nongoal_timer', allow_nongoal_timer);
      if (allow_nongoal_timer) {
        if (send_change) {
          return send_feature_enabled({
            page: 'settings',
            feature: 'allow_nongoal_timer',
            manual: true
          });
        }
      } else {
        if (send_change) {
          return send_feature_disabled({
            page: 'settings',
            feature: 'allow_nongoal_timer',
            manual: true
          });
        }
      }
    },
    allow_daily_goal_notifications_changed: function(allow_daily_goal_notifications, prev_value_allow_daily_goal_notifications){
      var send_change, prev_allow_daily_goal_notifications;
      if (prev_value_allow_daily_goal_notifications == null) {
        return;
      }
      if (allow_daily_goal_notifications == null) {
        return;
      }
      send_change = true;
      prev_allow_daily_goal_notifications = localStorage.getItem('allow_daily_goal_notifications');
      if (prev_allow_daily_goal_notifications != null) {
        prev_allow_daily_goal_notifications = prev_allow_daily_goal_notifications === 'true';
        if (prev_allow_daily_goal_notifications === allow_daily_goal_notifications) {
          send_change = false;
        }
      }
      localStorage.setItem('allow_daily_goal_notifications', allow_daily_goal_notifications);
      if (allow_daily_goal_notifications) {
        if (send_change) {
          return send_feature_enabled({
            page: 'settings',
            feature: 'allow_daily_goal_notifications',
            manual: true
          });
        }
      } else {
        if (send_change) {
          return send_feature_disabled({
            page: 'settings',
            feature: 'allow_daily_goal_notifications',
            manual: true
          });
        }
      }
    }
  });
}).call(this);
