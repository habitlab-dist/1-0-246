(function(){
  var ref$, get_intervention, get_tab_id, get_session_id, get_is_new_session, get_is_preview_mode, get_is_suggestion_mode, get_is_previously_seen, log_utils, make_basic_data, log_impression, log_intervention_suggested, log_intervention_suggestion_action, log_disable, log_action, log_upvote, log_downvote, log_feedback, out$ = typeof exports != 'undefined' && exports || this;
  ref$ = require('libs_common/intervention_info'), get_intervention = ref$.get_intervention, get_tab_id = ref$.get_tab_id, get_session_id = ref$.get_session_id, get_is_new_session = ref$.get_is_new_session, get_is_preview_mode = ref$.get_is_preview_mode, get_is_suggestion_mode = ref$.get_is_suggestion_mode, get_is_previously_seen = ref$.get_is_previously_seen;
  log_utils = require('libs_frontend/log_utils');
  make_basic_data = function(data){
    if (data == null) {
      data = {};
    }
    data.url = window.location.href;
    data.tab_id = get_tab_id();
    data.session_id = get_session_id();
    data.is_new_session = get_is_new_session();
    data.is_preview_mode = get_is_preview_mode();
    data.is_suggestion_mode = get_is_suggestion_mode();
    data.is_previously_seen = get_is_previously_seen();
    return data;
  };
  out$.log_impression = log_impression = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_impression_internal(get_intervention().name, data));
  };
  out$.log_intervention_suggested = log_intervention_suggested = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_intervention_suggested_internal(get_intervention().name, data));
  };
  out$.log_intervention_suggestion_action = log_intervention_suggestion_action = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_intervention_suggestion_action_internal(get_intervention().name, data));
  };
  out$.log_disable = log_disable = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_disable_internal(get_intervention().name, data));
  };
  out$.log_action = log_action = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_action_internal(get_intervention().name, data));
  };
  out$.log_upvote = log_upvote = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_upvote_internal(get_intervention().name, data));
  };
  out$.log_downvote = log_downvote = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_downvote_internal(get_intervention().name, data));
  };
  out$.log_feedback = log_feedback = async function(data){
    data = make_basic_data(data);
    return (await log_utils.log_feedback_internal(get_intervention().name, data));
  };
}).call(this);
