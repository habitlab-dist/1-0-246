(function(){
  var ref$, memoize, memoizeSingleAsync, gexport, gexport_module, get_days_since_epoch, get_user_id, get_install_id, sleep, dexie, generate_random_id, chrome_manifest, habitlab_version, developer_mode, unofficial_version, get_db_major_version_interventionlogdb, get_db_minor_version_interventionlogdb, delete_db_if_outdated_interventionlogdb, get_current_schema_interventionlogdb, get_current_dbver_interventionlogdb, get_interventions_seen_today, get_log_names, intervention_logdb_cache, clear_intervention_logdb_cache, getInterventionLogDb, seen_interventions_cache, check_if_intervention_has_been_seen_and_record_as_seen_if_not, check_if_intervention_has_been_seen, getInterventionLogDb_uncached, deleteInterventionLogDb, getInterventionLogCollection, add_log_history, add_log_goals, log_goal_suggestion, log_goal_suggestion_action, add_log_interventions, add_log_enabledisable, add_log_habitlab_disabled, add_log_habitlab_enabled, add_log_feedback, addtolog, getlog, clearlog, get_num_impressions, get_num_impressions_for_days_before_today, get_num_impressions_today, get_num_actions, get_num_actions_for_days_before_today, get_num_actions_today, log_pageview, log_pagenav, log_pageclick, log_impression_internal, log_intervention_suggested_internal, log_intervention_suggestion_action_internal, log_disable_internal, log_action_internal, log_upvote_internal, log_downvote_internal, log_feedback_internal, intervention_utils, goal_utils, db_utils, out$ = typeof exports != 'undefined' && exports || this;
  ref$ = require('libs_common/memoize'), memoize = ref$.memoize, memoizeSingleAsync = ref$.memoizeSingleAsync;
  ref$ = require('libs_common/gexport'), gexport = ref$.gexport, gexport_module = ref$.gexport_module;
  get_days_since_epoch = require('libs_common/time_utils').get_days_since_epoch;
  ref$ = require('libs_backend/background_common'), get_user_id = ref$.get_user_id, get_install_id = ref$.get_install_id;
  sleep = require('libs_common/common_libs').sleep;
  dexie = require('dexie');
  generate_random_id = require('libs_common/generate_random_id').generate_random_id;
  if ((typeof chrome != 'undefined' && chrome !== null ? (ref$ = chrome.runtime) != null ? ref$.getManifest : void 8 : void 8) != null) {
    chrome_manifest = chrome.runtime.getManifest();
    habitlab_version = chrome_manifest.version;
    developer_mode = chrome_manifest.update_url == null;
    unofficial_version = chrome.runtime.id !== 'obghclocpdgcekcognpkblghkedcpdgd';
  } else {
    habitlab_version = 'test';
    developer_mode = true;
    unofficial_version = true;
  }
  out$.get_db_major_version_interventionlogdb = get_db_major_version_interventionlogdb = function(){
    return '8';
  };
  out$.get_db_minor_version_interventionlogdb = get_db_minor_version_interventionlogdb = function(){
    return '1';
  };
  out$.delete_db_if_outdated_interventionlogdb = delete_db_if_outdated_interventionlogdb = async function(){
    if (localStorage.getItem('db_minor_version_interventionlogdb') !== get_db_minor_version_interventionlogdb()) {
      localStorage.setItem('db_minor_version_interventionlogdb', get_db_minor_version_interventionlogdb());
    }
    if (localStorage.getItem('db_major_version_interventionlogdb') !== get_db_major_version_interventionlogdb()) {
      (await deleteInterventionLogDb());
      localStorage.removeItem('current_schema_interventionlogdb');
      localStorage.setItem('db_major_version_interventionlogdb', get_db_major_version_interventionlogdb());
    }
  };
  out$.get_current_schema_interventionlogdb = get_current_schema_interventionlogdb = function(){
    var result;
    result = localStorage.getItem('current_schema_interventionlogdb');
    if (result == null) {
      return {};
    }
    return JSON.parse(result);
  };
  out$.get_current_dbver_interventionlogdb = get_current_dbver_interventionlogdb = function(){
    var result;
    result = localStorage.getItem('current_dbver_interventionlogdb');
    if (result == null) {
      return 0;
    }
    return parseInt(result);
  };
  out$.get_interventions_seen_today = get_interventions_seen_today = async function(){
    var interventions, enabled, invns, i$, len$, intervention, result, ref$, key, combined;
    interventions = (await intervention_utils.list_all_interventions());
    enabled = (await intervention_utils.get_enabled_interventions());
    invns = [];
    for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
      intervention = interventions[i$];
      result = (await get_num_impressions_today(intervention));
      if (result > 0) {
        invns.push(intervention);
      }
    }
    for (i$ = 0, len$ = (ref$ = Object.keys(enabled)).length; i$ < len$; ++i$) {
      key = ref$[i$];
      if (enabled[key] === false) {
        delete enabled[key];
      }
    }
    combined = Array.from(new Set(invns.concat(enabled)));
    combined.pop();
    return combined;
  };
  out$.get_log_names = get_log_names = async function(){
    var interventions_list, logs_list;
    interventions_list = (await intervention_utils.list_all_interventions());
    logs_list = ['goals', 'interventions', 'feedback', 'pages', 'enabledisable', 'history'].map(function(it){
      return 'logs/' + it;
    });
    return interventions_list.concat(logs_list);
  };
  intervention_logdb_cache = null;
  out$.clear_intervention_logdb_cache = clear_intervention_logdb_cache = function(){
    if (intervention_logdb_cache != null) {
      intervention_logdb_cache.close();
    }
    return intervention_logdb_cache = null;
  };
  out$.getInterventionLogDb = getInterventionLogDb = async function(){
    var output;
    if (intervention_logdb_cache != null && intervention_logdb_cache.isOpen()) {
      return intervention_logdb_cache;
    }
    output = (await getInterventionLogDb_uncached());
    intervention_logdb_cache = output;
    return intervention_logdb_cache;
  };
  seen_interventions_cache = localStorage.getItem('seen_interventions_cache');
  if (seen_interventions_cache != null) {
    seen_interventions_cache = JSON.parse(seen_interventions_cache);
  } else {
    seen_interventions_cache = {};
  }
  out$.check_if_intervention_has_been_seen_and_record_as_seen_if_not = check_if_intervention_has_been_seen_and_record_as_seen_if_not = async function(intervention_name){
    var intervention_log_db, intervention_log_collection, intervention_seen, num_items_in_log, cur_epoch;
    if (seen_interventions_cache[intervention_name]) {
      return true;
    }
    seen_interventions_cache[intervention_name] = true;
    intervention_log_db = (await getInterventionLogDb());
    intervention_log_collection = intervention_log_db[intervention_name];
    intervention_seen = false;
    if (intervention_log_collection != null) {
      num_items_in_log = (await intervention_log_collection.count());
      if (num_items_in_log > 0) {
        intervention_seen = true;
      }
    }
    if (intervention_seen) {
      return true;
    }
    seen_interventions_cache[intervention_name] = true;
    localStorage.setItem('seen_interventions_cache', JSON.stringify(seen_interventions_cache));
    cur_epoch = get_days_since_epoch();
    (await db_utils.setvar('last_epoch_new_intervention_seen', cur_epoch));
    return false;
  };
  out$.check_if_intervention_has_been_seen = check_if_intervention_has_been_seen = async function(intervention_name){
    var intervention_log_db, intervention_log_collection, num_items_in_log;
    if (seen_interventions_cache[intervention_name]) {
      return true;
    }
    intervention_log_db = (await getInterventionLogDb());
    intervention_log_collection = intervention_log_db[intervention_name];
    if (intervention_log_collection == null) {
      return false;
    }
    num_items_in_log = (await intervention_log_collection.count());
    return num_items_in_log > 0;
  };
  getInterventionLogDb_uncached = async function(){
    var log_names, db, dbver, prev_schema, stores_to_create, i$, len$, logname, new_schema, res$, k, v, realdb;
    (await delete_db_if_outdated_interventionlogdb());
    log_names = (await get_log_names());
    db = new dexie('interventionlog', {
      autoOpen: false
    });
    dbver = get_current_dbver_interventionlogdb();
    prev_schema = get_current_schema_interventionlogdb();
    stores_to_create = {};
    for (i$ = 0, len$ = log_names.length; i$ < len$; ++i$) {
      logname = log_names[i$];
      if (prev_schema[logname] == null) {
        stores_to_create[logname] = '++id,[type+day],type,day,itemid,synced';
      }
    }
    res$ = {};
    for (k in prev_schema) {
      v = prev_schema[k];
      res$[k] = v;
    }
    new_schema = res$;
    if (Object.keys(stores_to_create).length > 0) {
      db.version(dbver).stores(prev_schema);
      dbver += 1;
      for (k in stores_to_create) {
        v = stores_to_create[k];
        new_schema[k] = v;
      }
      db.on('ready', function(){
        localStorage.setItem('current_schema_interventionlogdb', JSON.stringify(new_schema));
        return localStorage.setItem('current_dbver_interventionlogdb', dbver);
      });
      db.on('versionchange', function(){
        intervention_logdb_cache = null;
        db.close();
        return intervention_logdb_cache = null;
      });
    }
    db.version(dbver).stores(new_schema);
    realdb = (await db.open());
    return realdb;
  };
  out$.deleteInterventionLogDb = deleteInterventionLogDb = async function(){
    var db;
    console.log('deleteInterventionLogDb called');
    localStorage.removeItem('current_schema_interventionlogdb');
    localStorage.removeItem('current_dbver_interventionlogdb');
    db = new dexie('interventionlog');
    (await db['delete']());
  };
  out$.getInterventionLogCollection = getInterventionLogCollection = async function(name){
    var db;
    db = (await getInterventionLogDb());
    return db[name];
  };
  out$.add_log_history = add_log_history = async function(data){
    var history_id;
    data = import$({}, data);
    if (data.id != null) {
      history_id = data.id;
      data.history_id = history_id;
      delete data.id;
    }
    return (await addtolog('logs/history', data));
  };
  out$.add_log_goals = add_log_goals = async function(data){
    data = import$({}, data);
    if (data.enabled_interventions == null) {
      data.enabled_interventions = (await intervention_utils.get_enabled_interventions());
    }
    if (data.enabled_goals == null) {
      data.enabled_goals = (await goal_utils.get_enabled_goals());
    }
    return (await addtolog('logs/goals', data));
  };
  out$.log_goal_suggestion = log_goal_suggestion = async function(data){
    data = import$({}, data);
    data.type = 'goal_suggestion';
    if (data.enabled_interventions == null) {
      data.enabled_interventions = (await intervention_utils.get_enabled_interventions());
    }
    if (data.enabled_goals == null) {
      data.enabled_goals = (await goal_utils.get_enabled_goals());
    }
    return (await addtolog('logs/goals', data));
  };
  out$.log_goal_suggestion_action = log_goal_suggestion_action = async function(data){
    data = import$({}, data);
    data.type = 'goal_suggestion_action';
    if (data.enabled_interventions == null) {
      data.enabled_interventions = (await intervention_utils.get_enabled_interventions());
    }
    if (data.enabled_goals == null) {
      data.enabled_goals = (await goal_utils.get_enabled_goals());
    }
    return (await addtolog('logs/goals', data));
  };
  out$.add_log_interventions = add_log_interventions = async function(data){
    data = import$({}, data);
    if (data.enabled_interventions == null) {
      data.enabled_interventions = (await intervention_utils.get_enabled_interventions());
    }
    if (data.enabled_goals == null) {
      data.enabled_goals = (await goal_utils.get_enabled_goals());
    }
    return (await addtolog('logs/interventions', data));
  };
  out$.add_log_enabledisable = add_log_enabledisable = async function(data){
    data = import$({}, data);
    if (data.enabled_interventions == null) {
      data.enabled_interventions = (await intervention_utils.get_enabled_interventions());
    }
    if (data.enabled_goals == null) {
      data.enabled_goals = (await goal_utils.get_enabled_goals());
    }
    return (await addtolog('logs/enabledisable', data));
  };
  out$.add_log_habitlab_disabled = add_log_habitlab_disabled = async function(data){
    data = import$({}, data);
    data.type = 'disabled';
    return (await add_log_enabledisable(data));
  };
  out$.add_log_habitlab_enabled = add_log_habitlab_enabled = async function(data){
    data = import$({}, data);
    data.type = 'enabled';
    return (await add_log_enabledisable(data));
  };
  out$.add_log_feedback = add_log_feedback = async function(data){
    data = import$({}, data);
    if (data.enabled_interventions == null) {
      data.enabled_interventions = (await intervention_utils.get_enabled_interventions());
    }
    if (data.enabled_goals == null) {
      data.enabled_goals = (await goal_utils.get_enabled_goals());
    }
    return (await addtolog('logs/feedback', data));
  };
  out$.addtolog = addtolog = async function(name, data){
    var collection, result;
    data = import$({}, data);
    if (data.type == null) {
      data.type = 'general';
    }
    data.userid = (await get_user_id());
    data.install_id = (await get_install_id());
    data.day = get_days_since_epoch();
    data.synced = 0;
    data.timestamp = Date.now();
    data.localtime = new Date().toString();
    data.itemid = generate_random_id();
    data.log_major_ver = get_db_major_version_interventionlogdb();
    data.log_minor_ver = get_db_minor_version_interventionlogdb();
    data.habitlab_version = habitlab_version;
    if (developer_mode) {
      data.developer_mode = true;
    }
    if (unofficial_version) {
      data.unofficial_version = chrome.runtime.id;
    }
    collection = (await getInterventionLogCollection(name));
    result = (await collection.add(data));
    return data;
  };
  out$.getlog = getlog = async function(name){
    var collection, result;
    collection = (await getInterventionLogCollection(name));
    result = (await collection.toArray());
    return result;
  };
  out$.clearlog = clearlog = async function(name){
    var collection, num_deleted;
    collection = (await getInterventionLogCollection(name));
    num_deleted = (await collection['delete']());
  };
  out$.get_num_impressions = get_num_impressions = async function(name){
    var collection, num_impressions;
    collection = (await getInterventionLogCollection(name));
    num_impressions = (await collection.where('type').equals('impression').count());
    return num_impressions;
  };
  out$.get_num_impressions_for_days_before_today = get_num_impressions_for_days_before_today = async function(name, days_before_today){
    var collection, day, num_impressions;
    collection = (await getInterventionLogCollection(name));
    day = get_days_since_epoch() - days_before_today;
    num_impressions = (await collection.where('[type+day]').equals(['impression', day]).count());
    return num_impressions;
  };
  out$.get_num_impressions_today = get_num_impressions_today = async function(name){
    return (await get_num_impressions_for_days_before_today(name, 0));
  };
  out$.get_num_actions = get_num_actions = async function(name){
    var collection, num_actions;
    collection = (await getInterventionLogCollection(name));
    num_actions = (await collection.where('type').equals('action').count());
    return num_actions;
  };
  out$.get_num_actions_for_days_before_today = get_num_actions_for_days_before_today = async function(name, days_before_today){
    var collection, day, num_actions;
    collection = (await getInterventionLogCollection(name));
    day = get_days_since_epoch() - days_before_today;
    num_actions = (await collection.where('[type+day]').equals(['action', day]).count());
    return num_actions;
  };
  out$.get_num_actions_today = get_num_actions_today = async function(name){
    return (await get_num_actions_for_days_before_today(name, 0));
  };
  out$.get_num_actions = get_num_actions = async function(name){
    var collection, day, num_actions;
    collection = (await getInterventionLogCollection(name));
    day = get_days_since_epoch();
    num_actions = (await collection.where('[type+day]').equals(['action', day]).count());
    return num_actions;
  };
  out$.log_pageview = log_pageview = async function(data){
    var pagepath;
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'view';
    pagepath = window.location.pathname;
    if (window.location.search.length > 0) {
      pagepath += window.location.search;
    }
    if (window.location.hash.length > 0) {
      pagepath += window.location.hash;
    }
    data.page = pagepath;
    return (await addtolog('logs/pages', data));
  };
  out$.log_pagenav = log_pagenav = async function(data){
    var pagepath;
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'nav';
    pagepath = window.location.pathname;
    if (window.location.search.length > 0) {
      pagepath += window.location.search;
    }
    if (window.location.hash.length > 0) {
      pagepath += window.location.hash;
    }
    data.page = pagepath;
    return (await addtolog('logs/pages', data));
  };
  out$.log_pageclick = log_pageclick = async function(data){
    var pagepath;
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'click';
    pagepath = window.location.pathname;
    if (window.location.search.length > 0) {
      pagepath += window.location.search;
    }
    if (window.location.hash.length > 0) {
      pagepath += window.location.hash;
    }
    data.page = pagepath;
    return (await addtolog('logs/pages', data));
  };
  out$.log_impression_internal = log_impression_internal = async function(name, data){
    var intervention_info;
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'impression';
    data.intervention = name;
    (await check_if_intervention_has_been_seen_and_record_as_seen_if_not(name));
    intervention_info = (await intervention_utils.get_intervention_info(name));
    if (intervention_info.generic_intervention != null) {
      name = intervention_info.generic_intervention;
    }
    (await db_utils.setkey_dict('time_intervention_most_recently_seen', name, Date.now()));
    return (await addtolog(name, data));
  };
  out$.log_intervention_suggested_internal = log_intervention_suggested_internal = async function(name, data){
    var cur_epoch, intervention_info;
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'suggested';
    data.intervention = name;
    (await check_if_intervention_has_been_seen_and_record_as_seen_if_not(name));
    cur_epoch = get_days_since_epoch();
    (await db_utils.setvar('last_epoch_intervention_suggested', cur_epoch));
    intervention_info = (await intervention_utils.get_intervention_info(name));
    if (intervention_info.generic_intervention != null) {
      name = intervention_info.generic_intervention;
    }
    (await db_utils.setkey_dict('time_intervention_most_recently_seen', name, Date.now()));
    return (await addtolog(name, data));
  };
  out$.log_intervention_suggestion_action_internal = log_intervention_suggestion_action_internal = async function(name, data){
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'suggestion_action';
    data.intervention = name;
    return (await addtolog(name, data));
  };
  out$.log_disable_internal = log_disable_internal = async function(name, data){
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'disable';
    data.intervention = name;
    return (await addtolog(name, data));
  };
  out$.log_action_internal = log_action_internal = async function(name, data){
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'action';
    data.intervention = name;
    return (await addtolog(name, data));
  };
  out$.log_upvote_internal = log_upvote_internal = async function(name, data){
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'upvote';
    data.intervention = name;
    return (await addtolog(name, data));
  };
  out$.log_downvote_internal = log_downvote_internal = async function(name, data){
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'downvote';
    data.intervention = name;
    return (await addtolog(name, data));
  };
  out$.log_feedback_internal = log_feedback_internal = async function(name, data){
    if (data != null) {
      data = import$({}, data);
    } else {
      data = {};
    }
    data.type = 'feedback';
    data.intervention = name;
    return (await addtolog(name, data));
  };
  intervention_utils = require('libs_backend/intervention_utils');
  goal_utils = require('libs_backend/goal_utils');
  db_utils = require('libs_backend/db_utils');
  gexport_module('log_utils_backend', function(it){
    return eval(it);
  });
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
