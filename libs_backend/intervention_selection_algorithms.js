(function(){
  var shuffled, moment, prelude, ref$, list_available_interventions_for_enabled_goals, get_manually_managed_interventions, get_manually_managed_interventions_localstorage, list_all_interventions, get_enabled_interventions, get_number_sessions_for_each_intervention, is_intervention_enabled, get_time_since_intervention, get_intervention_info, get_intersection, list_enabled_interventions_for_goal, get_novelty, get_enabled_goals, get_goals, get_is_goal_frequent, getkey_dictdict, setkey_dictdict, getvar_experiment, setvar_experiment, as_array, train_multi_armed_bandit_for_goal, ThompsonMAB, gexport, gexport_module, one_random_intervention_per_enabled_goal, one_random_intervention_per_enabled_goal_with_frequency, try_parse_json, is_within_n_days_ago, how_many_days_ago, is_experiment_still_running, get_current_condition_for_experiment, choose_among_interventions_random, choose_among_interventions_same, choose_among_interventions_oneperday, choose_among_interventions_onepertwodays, choose_among_interventions_oneperthreedays, choose_among_interventions_by_rule, experiment_always_same, experiment_oneperday, experiment_onepertwodays, experiment_oneperthreedays, experiment_alternate_between_same_vs_random_daily_deterministic, experiment_alternate_between_same_vs_random_varlength_deterministic, experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare, thompsonsampling, novelty, thompson_novelty, selection_algorithms_for_visit, get_intervention_selection_algorithm_for_visit, multi_armed_bandit, out$ = typeof exports != 'undefined' && exports || this;
  shuffled = require('shuffled');
  moment = require('moment');
  prelude = require('prelude-ls');
  ref$ = require('libs_backend/intervention_utils'), list_available_interventions_for_enabled_goals = ref$.list_available_interventions_for_enabled_goals, get_manually_managed_interventions = ref$.get_manually_managed_interventions, get_manually_managed_interventions_localstorage = ref$.get_manually_managed_interventions_localstorage, list_all_interventions = ref$.list_all_interventions, get_enabled_interventions = ref$.get_enabled_interventions, get_number_sessions_for_each_intervention = ref$.get_number_sessions_for_each_intervention, is_intervention_enabled = ref$.is_intervention_enabled, get_time_since_intervention = ref$.get_time_since_intervention, get_intervention_info = ref$.get_intervention_info, get_intersection = ref$.get_intersection, list_enabled_interventions_for_goal = ref$.list_enabled_interventions_for_goal, get_novelty = ref$.get_novelty;
  ref$ = require('libs_backend/goal_utils'), get_enabled_goals = ref$.get_enabled_goals, get_goals = ref$.get_goals, get_is_goal_frequent = ref$.get_is_goal_frequent;
  ref$ = require('libs_backend/db_utils'), getkey_dictdict = ref$.getkey_dictdict, setkey_dictdict = ref$.setkey_dictdict, getvar_experiment = ref$.getvar_experiment, setvar_experiment = ref$.setvar_experiment;
  as_array = require('libs_common/collection_utils').as_array;
  ref$ = require('libs_backend/multi_armed_bandit_thompson'), train_multi_armed_bandit_for_goal = ref$.train_multi_armed_bandit_for_goal, ThompsonMAB = ref$.ThompsonMAB;
  ref$ = require('libs_common/gexport'), gexport = ref$.gexport, gexport_module = ref$.gexport_module;
  out$.one_random_intervention_per_enabled_goal = one_random_intervention_per_enabled_goal = async function(enabled_goals){
    var enabled_interventions, goals, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = shuffled(available_interventions)[0];
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.one_random_intervention_per_enabled_goal_with_frequency = one_random_intervention_per_enabled_goal_with_frequency = async function(enabled_goals){
    var enabled_interventions, goals, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, is_frequent, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      is_frequent = (await get_is_goal_frequent(goal_name));
      if (!is_frequent && Math.random() > 0.2) {
        continue;
      }
      selected_intervention = shuffled(available_interventions)[0];
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  /*
  export one_random_intervention_per_enabled_goal = (enabled_goals) ->>
    if not enabled_goals?
      enabled_goals = await get_enabled_goals()
    manually_enabled_interventions = await get_most_recent_manually_enabled_interventions()
    manually_enabled_interventions_list = as_array manually_enabled_interventions
    manually_disabled_interventions = await get_most_recent_manually_disabled_interventions()
    manually_disabled_interventions_list = as_array manually_disabled_interventions
    goals = await get_goals()
    output = []
    output_set = {}
    for goal_name,goal_enabled of enabled_goals
      goal_info = goals[goal_name]
      interventions = goal_info.interventions
      # do any manually enabled interventions already satisfy this goal? if yes we don't need to select one
      should_select_intervention = true
      for intervention in interventions
        if manually_enabled_interventions[intervention]
          should_select_intervention = false
          break
      if not should_select_intervention
        continue
      # what interventions are available that have not been manually disabled?
      available_interventions = [intervention for intervention in interventions when not manually_disabled_interventions[intervention]]
      if available_interventions.length == 0
        continue
      selected_intervention = shuffled(available_interventions)[0]
      output.push selected_intervention
      output_set[selected_intervention] = true
    return prelude.sort(output)
  */
  /*
  export each_intervention_enabled_with_probability_half = (enabled_goals) ->>
    interventions = await list_available_interventions_for_enabled_goals()
    return prelude.sort [x for x in interventions when Math.random() < 0.5]
  
  export one_intervention_per_goal_multi_armed_bandit = (enabled_goals) ->>
    if not enabled_goals?
      enabled_goals = await get_enabled_goals()
    manually_enabled_interventions = await get_most_recent_manually_enabled_interventions()
    manually_enabled_interventions_list = as_array manually_enabled_interventions
    manually_disabled_interventions = await get_most_recent_manually_disabled_interventions()
    manually_disabled_interventions_list = as_array manually_disabled_interventions
    goals = await get_goals()
    output = []
    output_set = {}
    for goal_name,goal_enabled of enabled_goals
      goal_info = goals[goal_name]
      interventions = goal_info.interventions
      # do any manually enabled interventions already satisfy this goal? if yes we don't need to select one
      should_select_intervention = true
      for intervention in interventions
        if manually_enabled_interventions[intervention]
          should_select_intervention = false
          break
      if not should_select_intervention
        continue
      # what interventions are available that have not been manually disabled?
      available_interventions = [intervention for intervention in interventions when not manually_disabled_interventions[intervention]]
      if available_interventions.length == 0
        continue
      selected_intervention = await multi_armed_bandit.get_next_intervention_to_test_for_goal(goal_name, available_interventions)
      output.push selected_intervention
      output_set[selected_intervention] = true
    return prelude.sort(output)
  
  selection_algorithms = {
    'one_intervention_per_goal_multi_armed_bandit': one_intervention_per_goal_multi_armed_bandit
    'one_random_intervention_per_enabled_goal': one_random_intervention_per_enabled_goal
    'each_intervention_enabled_with_probability_half': each_intervention_enabled_with_probability_half
    'default': one_intervention_per_goal_multi_armed_bandit
  }
  
  export get_intervention_selection_algorithm = ->>
    algorithm_name = localStorage.getItem('selection_algorithm')
    if not (algorithm_name? and selection_algorithms[algorithm_name]?)
      algorithm_name = 'default'
    return selection_algorithms[algorithm_name]
  */
  /*
  export experiment_always_same = (enabled_goals) ->>
    if not enabled_goals?
      enabled_goals = await get_enabled_goals()
    enabled_interventions = await get_enabled_interventions()
    goals = await get_goals()
    output = []
    output_set = {}
    for goal_name,goal_enabled of enabled_goals
      goal_info = goals[goal_name]
      if (not goal_info?) or (not goal_info.interventions?)
        continue
      interventions = goal_info.interventions
      # what interventions are available that have not been disabled?
      available_interventions = [intervention for intervention in interventions when enabled_interventions[intervention]]
      if available_interventions.length == 0
        continue
      selected_intervention = await getkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_always_same_intervention')
      if not selected_intervention? or available_interventions.indexOf(selected_intervention) == -1
        selected_intervention = shuffled(available_interventions)[0]
        await setkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_always_same_intervention', selected_intervention)
      output.push selected_intervention
      output_set[selected_intervention] = true
    return prelude.sort(output)
  */
  try_parse_json = function(text){
    var e;
    if (typeof text !== 'string') {
      return;
    }
    try {
      return JSON.parse(text);
    } catch (e$) {
      e = e$;
    }
  };
  is_within_n_days_ago = function(date, n){
    var i$, ref$, len$, i;
    for (i$ = 0, len$ = (ref$ = (fn$())).length; i$ < len$; ++i$) {
      i = ref$[i$];
      if (moment().subtract(i, 'day').format('YYYYMMDD') === date) {
        return true;
      }
    }
    return false;
    function fn$(){
      var i$, to$, results$ = [];
      for (i$ = 0, to$ = n; i$ < to$; ++i$) {
        results$.push(i$);
      }
      return results$;
    }
  };
  how_many_days_ago = function(date){
    var i$, ref$, len$, i;
    for (i$ = 0, len$ = (ref$ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]).length; i$ < len$; ++i$) {
      i = ref$[i$];
      if (moment().subtract(i, 'day').format('YYYYMMDD') === date) {
        return i;
      }
    }
    return -1;
  };
  is_experiment_still_running = function(experiment_info){
    var conditionduration, conditions, numconditions, day, totalduration;
    if (experiment_info == null) {
      return false;
    }
    conditionduration = experiment_info.conditionduration;
    if (conditionduration == null) {
      return false;
    }
    conditions = experiment_info.conditions;
    if (conditions == null) {
      return false;
    }
    numconditions = conditions.length;
    if (numconditions == null) {
      return false;
    }
    day = experiment_info.day;
    if (day == null) {
      return false;
    }
    totalduration = conditionduration * numconditions;
    return is_within_n_days_ago(day, totalduration);
  };
  get_current_condition_for_experiment = function(experiment_info){
    var days_since_experiment_start, conditionduration, conditionidx, condition;
    if (!is_experiment_still_running(experiment_info)) {
      return;
    }
    days_since_experiment_start = how_many_days_ago(experiment_info.day);
    conditionduration = experiment_info.conditionduration;
    conditionidx = Math.floor(days_since_experiment_start / conditionduration);
    condition = experiment_info.conditions[conditionidx];
    return condition;
  };
  choose_among_interventions_random = async function(available_interventions, goal_name){
    var selected_intervention;
    selected_intervention = shuffled(available_interventions)[0];
    return selected_intervention;
  };
  choose_among_interventions_same = async function(available_interventions, goal_name){
    var curday, selected_intervention_info, selected_intervention;
    curday = moment().format('YYYYMMDD');
    selected_intervention_info = (await getkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_always_same_intervention_info'));
    selected_intervention = null;
    selected_intervention_info = try_parse_json(selected_intervention_info);
    if (selected_intervention_info != null) {
      selected_intervention = selected_intervention_info.intervention;
    }
    if (selected_intervention == null || available_interventions.indexOf(selected_intervention) === -1) {
      selected_intervention = shuffled(available_interventions)[0];
      (await setkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_always_same_intervention_info', JSON.stringify({
        day: curday,
        intervention: selected_intervention
      })));
    }
    return selected_intervention;
  };
  choose_among_interventions_oneperday = async function(available_interventions, goal_name){
    var curday, selected_intervention_info, selected_intervention, day;
    curday = moment().format('YYYYMMDD');
    selected_intervention_info = (await getkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_oneperday_intervention_info'));
    selected_intervention = null;
    selected_intervention_info = try_parse_json(selected_intervention_info);
    if (selected_intervention_info != null) {
      day = selected_intervention_info.day;
      if (is_within_n_days_ago(day, 1)) {
        selected_intervention = selected_intervention_info.intervention;
      }
    }
    if (selected_intervention == null || available_interventions.indexOf(selected_intervention) === -1) {
      selected_intervention = shuffled(available_interventions)[0];
      (await setkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_oneperday_intervention_info', JSON.stringify({
        day: curday,
        intervention: selected_intervention
      })));
    }
    return selected_intervention;
  };
  choose_among_interventions_onepertwodays = async function(available_interventions, goal_name){
    var curday, selected_intervention_info, selected_intervention, day;
    curday = moment().format('YYYYMMDD');
    selected_intervention_info = (await getkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_onepertwodays_intervention_info'));
    selected_intervention = null;
    selected_intervention_info = try_parse_json(selected_intervention_info);
    if (selected_intervention_info != null) {
      day = selected_intervention_info.day;
      if (is_within_n_days_ago(day, 2)) {
        selected_intervention = selected_intervention_info.intervention;
      }
    }
    if (selected_intervention == null || available_interventions.indexOf(selected_intervention) === -1) {
      selected_intervention = shuffled(available_interventions)[0];
      (await setkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_onepertwodays_intervention_info', JSON.stringify({
        day: curday,
        intervention: selected_intervention
      })));
    }
    return selected_intervention;
  };
  choose_among_interventions_oneperthreedays = async function(available_interventions, goal_name){
    var curday, selected_intervention_info, selected_intervention, day;
    curday = moment().format('YYYYMMDD');
    selected_intervention_info = (await getkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_oneperthreedays_intervention_info'));
    selected_intervention = null;
    selected_intervention_info = try_parse_json(selected_intervention_info);
    if (selected_intervention_info != null) {
      day = selected_intervention_info.day;
      if (is_within_n_days_ago(day, 3)) {
        selected_intervention = selected_intervention_info.intervention;
      }
    }
    if (selected_intervention == null || available_interventions.indexOf(selected_intervention) === -1) {
      selected_intervention = shuffled(available_interventions)[0];
      (await setkey_dictdict('experiment_vars_for_goal', goal_name, 'experiment_oneperthreedays_intervention_info', JSON.stringify({
        day: curday,
        intervention: selected_intervention
      })));
    }
    return selected_intervention;
  };
  out$.choose_among_interventions_by_rule = choose_among_interventions_by_rule = async function(available_interventions, goal_name, rule){
    var selection_algorithm;
    selection_algorithm = {
      'random': choose_among_interventions_random,
      'same': choose_among_interventions_same,
      'oneperday': choose_among_interventions_oneperday,
      'onepertwodays': choose_among_interventions_onepertwodays,
      'oneperthreedays': choose_among_interventions_oneperthreedays
    }[rule];
    return (await selection_algorithm(available_interventions, goal_name));
  };
  out$.experiment_always_same = experiment_always_same = async function(enabled_goals){
    var enabled_interventions, goals, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, 'same'));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.experiment_oneperday = experiment_oneperday = async function(enabled_goals){
    var enabled_interventions, goals, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, 'oneperday'));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.experiment_onepertwodays = experiment_onepertwodays = async function(enabled_goals){
    var enabled_interventions, goals, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, 'onepertwodays'));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.experiment_oneperthreedays = experiment_oneperthreedays = async function(enabled_goals){
    var enabled_interventions, goals, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, 'oneperthreedays'));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.experiment_alternate_between_same_vs_random_daily_deterministic = experiment_alternate_between_same_vs_random_daily_deterministic = async function(enabled_goals){
    var enabled_interventions, goals, experiment_info, curday, condition, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    experiment_info = (await getvar_experiment('experiment_alternate_between_same_vs_random_daily_deterministic'));
    experiment_info = try_parse_json(experiment_info);
    if (experiment_info == null) {
      experiment_info = {};
    }
    curday = moment().format('YYYYMMDD');
    if (is_experiment_still_running(experiment_info)) {
      condition = get_current_condition_for_experiment(experiment_info);
    } else {
      if (experiment_info.conditions == null) {
        experiment_info.conditions = shuffled(['random', 'same']);
      }
      experiment_info.conditionduration = 1;
      experiment_info.day = curday;
      condition = get_current_condition_for_experiment(experiment_info);
      (await setvar_experiment('experiment_alternate_between_same_vs_random_daily_deterministic', JSON.stringify(experiment_info)));
    }
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, condition));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.experiment_alternate_between_same_vs_random_varlength_deterministic = experiment_alternate_between_same_vs_random_varlength_deterministic = async function(enabled_goals){
    var enabled_interventions, goals, experiment_info, curday, condition, duration_options, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    experiment_info = (await getvar_experiment('experiment_alternate_between_same_vs_random_varlength_deterministic'));
    experiment_info = try_parse_json(experiment_info);
    if (experiment_info == null) {
      experiment_info = {};
    }
    curday = moment().format('YYYYMMDD');
    if (is_experiment_still_running(experiment_info)) {
      condition = get_current_condition_for_experiment(experiment_info);
    } else {
      if (experiment_info.conditions == null) {
        experiment_info.conditions = shuffled(['random', 'same']);
      }
      duration_options = [1, 3, 5, 7];
      experiment_info.conditionduration = duration_options[Math.floor(Math.random() * duration_options.length)];
      experiment_info.day = curday;
      condition = get_current_condition_for_experiment(experiment_info);
      (await setvar_experiment('experiment_alternate_between_same_vs_random_varlength_deterministic', JSON.stringify(experiment_info)));
    }
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, condition));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  out$.experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare = experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare = async function(enabled_goals){
    var enabled_interventions, goals, experiment_info, curday, condition, output, output_set, goal_name, goal_enabled, goal_info, interventions, available_interventions, res$, i$, len$, intervention, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    goals = (await get_goals());
    experiment_info = (await getvar_experiment('experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare'));
    experiment_info = try_parse_json(experiment_info);
    if (experiment_info == null) {
      experiment_info = {};
    }
    curday = moment().format('YYYYMMDD');
    if (is_experiment_still_running(experiment_info)) {
      condition = get_current_condition_for_experiment(experiment_info);
    } else {
      if (experiment_info.conditions == null) {
        experiment_info.conditions = shuffled(['random', 'same']);
      }
      if (experiment_info.duration_order == null) {
        experiment_info.duration_order = shuffled([1, 3, 5, 7]);
      }
      if (experiment_info.duration_idx == null) {
        experiment_info.duration_idx = 0;
      } else {
        experiment_info.duration_idx = (experiment_info.duration_idx + 1) % experiment_info.duration_order.length;
      }
      experiment_info.conditionduration = experiment_info.duration_order[experiment_info.duration_idx];
      experiment_info.day = curday;
      condition = get_current_condition_for_experiment(experiment_info);
      (await setvar_experiment('experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare', JSON.stringify(experiment_info)));
    }
    output = [];
    output_set = {};
    for (goal_name in enabled_goals) {
      goal_enabled = enabled_goals[goal_name];
      goal_info = goals[goal_name];
      if (goal_info == null || goal_info.interventions == null) {
        continue;
      }
      interventions = goal_info.interventions;
      res$ = [];
      for (i$ = 0, len$ = interventions.length; i$ < len$; ++i$) {
        intervention = interventions[i$];
        if (enabled_interventions[intervention]) {
          res$.push(intervention);
        }
      }
      available_interventions = res$;
      if (available_interventions.length === 0) {
        continue;
      }
      selected_intervention = (await choose_among_interventions_by_rule(available_interventions, goal_name, condition));
      output.push(selected_intervention);
      output_set[selected_intervention] = true;
    }
    return prelude.sort(output);
  };
  /**
   * This selection algorithm recommends an intervention for each goal using the Thompson Sampling Algorithm.
    * @return List of intervention names (strings), one intervention for each user goal.
   */
  out$.thompsonsampling = thompsonsampling = async function(enabled_goals){
    var res$, goal_name, value, output, i$, len$, enabled_interventions, is_frequent, mab, selected_intervention;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    res$ = [];
    for (goal_name in enabled_goals) {
      value = enabled_goals[goal_name];
      res$.push(goal_name);
    }
    enabled_goals = res$;
    output = [];
    for (i$ = 0, len$ = enabled_goals.length; i$ < len$; ++i$) {
      goal_name = enabled_goals[i$];
      enabled_interventions = (await list_enabled_interventions_for_goal(goal_name));
      if (enabled_interventions.length === 0) {
        continue;
      }
      is_frequent = (await get_is_goal_frequent(goal_name));
      if (!is_frequent && Math.random() > 0.2) {
        continue;
      }
      mab = (await train_multi_armed_bandit_for_goal(goal_name, enabled_interventions));
      selected_intervention = mab.predict();
      output.push(selected_intervention);
    }
    return prelude.sort(output);
  };
  /**
   * This selection algorithm ranks the interventions from lowest to highest novelty, prioritizing 
   * the least recently seen interventions over the most recently seen interventions.
   * @return List of intervention names (strings), one intervention for each user goal.
   */
  out$.novelty = novelty = async function(enabled_goals){
    var enabled_interventions, novel_interventions, output, intervention_name, enabled, intervention, time, i$, ref$, len$, goal_name;
    if (enabled_goals == null) {
      enabled_goals = (await get_enabled_goals());
    }
    enabled_interventions = (await get_enabled_interventions());
    novel_interventions = {};
    output = [];
    for (intervention_name in enabled_interventions) {
      enabled = enabled_interventions[intervention_name];
      intervention = (await get_intervention_info(intervention_name));
      time = (await get_time_since_intervention(intervention_name));
      for (i$ = 0, len$ = (ref$ = intervention.goals).length; i$ < len$; ++i$) {
        goal_name = ref$[i$];
        if (goal_name in enabled_goals && (novel_interventions[goal_name] == null || novel_interventions[goal_name].time < time)) {
          novel_interventions[goal_name] = {
            intervention: intervention_name,
            time: time
          };
        }
      }
    }
    for (goal_name in enabled_goals) {
      output.push(novel_interventions[goal_name].intervention);
    }
    return prelude.sort(output);
  };
  /**
   * Generates thompson-novely combo algorithm given weight (% of reward that should be from sampling)
   * Precondition: @param weight must be between 0 and 1, inclusive.
   */
  out$.thompson_novelty = thompson_novelty = function(weight){
    var denominator, sample_coefficient, novelty_coefficient;
    denominator = 0;
    if (weight < 0.5 && weight > 0) {
      denominator = 1 / weight;
    } else if (weight > 0 && weight < 1) {
      denominator = 1 / (1 - weight);
    } else {
      denominator = 1;
    }
    sample_coefficient = weight * denominator;
    novelty_coefficient = (1 - weight) * denominator;
    return async function(enabled_goals){
      var res$, goal_name, value, output, i$, len$, enabled_interventions, mab, novelty, selected_intervention;
      if (enabled_goals == null) {
        enabled_goals = (await get_enabled_goals());
      }
      res$ = [];
      for (goal_name in enabled_goals) {
        value = enabled_goals[goal_name];
        res$.push(goal_name);
      }
      enabled_goals = res$;
      output = [];
      for (i$ = 0, len$ = enabled_goals.length; i$ < len$; ++i$) {
        goal_name = enabled_goals[i$];
        enabled_interventions = (await list_enabled_interventions_for_goal(goal_name));
        if (enabled_interventions.length === 0) {
          continue;
        }
        mab = (await train_multi_armed_bandit_for_goal(goal_name, enabled_interventions, sample_coefficient, novelty_coefficient));
        novelty = (await get_novelty(enabled_interventions));
        selected_intervention = mab.predict(novelty);
        output.push(selected_intervention);
      }
      return prelude.sort(output);
    };
  };
  selection_algorithms_for_visit = {
    'thompsonnovelty05': thompson_novelty(0.5),
    'thompsonnovelty075': thompson_novelty(0.75),
    'thompsonnovelty09': thompson_novelty(0.9),
    'novelty': novelty,
    'thompsonsampling': thompsonsampling,
    'random': one_random_intervention_per_enabled_goal,
    'one_random_intervention_per_enabled_goal': one_random_intervention_per_enabled_goal,
    'one_random_intervention_per_enabled_goal_with_frequency': one_random_intervention_per_enabled_goal_with_frequency,
    'default': one_random_intervention_per_enabled_goal,
    'experiment_always_same': experiment_always_same,
    'experiment_oneperday': experiment_oneperday,
    'experiment_onepertwodays': experiment_onepertwodays,
    'experiment_oneperthreedays': experiment_oneperthreedays,
    'experiment_alternate_between_same_vs_random_daily_deterministic': experiment_alternate_between_same_vs_random_daily_deterministic,
    'experiment_alternate_between_same_vs_random_varlength_deterministic': experiment_alternate_between_same_vs_random_varlength_deterministic,
    'experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare': experiment_alternate_between_same_vs_random_varlength_deterministic_latinsquare
  };
  out$.get_intervention_selection_algorithm_for_visit = get_intervention_selection_algorithm_for_visit = async function(){
    var algorithm_name;
    algorithm_name = localStorage.getItem('selection_algorithm_for_visit');
    if (!(algorithm_name != null && selection_algorithms_for_visit[algorithm_name] != null)) {
      algorithm_name = 'default';
    }
    return selection_algorithms_for_visit[algorithm_name];
  };
  multi_armed_bandit = require('libs_backend/multi_armed_bandit').get_multi_armed_bandit_algorithm('thompson');
  gexport_module('intervention_selection_algorithms', function(it){
    return eval(it);
  });
}).call(this);
