(function(){
  var ref$, gexport, gexport_module, setvar_experiment, getvar_experiment, enabledisable_interventions_based_on_difficulty, send_feature_disabled, abtest_list, abtest_funcs, abtest_conditions, nondefault_abtest_list, blocking_abtest_list, blocking_abtest_set, nondefault_abtest_set, is_blocking_abtest, is_nondefault_abtest, get_available_abtest_conditions, get_abtest_list, get_assigned_abtest_conditions, add_abtest, set_abtest, run_abtest, setup_abtest_newuser, setup_abtest_olduser, out$ = typeof exports != 'undefined' && exports || this;
  ref$ = require('libs_common/gexport'), gexport = ref$.gexport, gexport_module = ref$.gexport_module;
  ref$ = require('libs_backend/db_utils'), setvar_experiment = ref$.setvar_experiment, getvar_experiment = ref$.getvar_experiment;
  enabledisable_interventions_based_on_difficulty = require('libs_backend/intervention_utils').enabledisable_interventions_based_on_difficulty;
  send_feature_disabled = require('libs_backend/logging_enabled_utils').send_feature_disabled;
  abtest_list = [];
  abtest_funcs = {};
  abtest_conditions = {};
  nondefault_abtest_list = ['internal_special_user'];
  blocking_abtest_list = ['difficulty_selection_screen'];
  blocking_abtest_set = new Set(blocking_abtest_list);
  nondefault_abtest_set = new Set(nondefault_abtest_list);
  is_blocking_abtest = function(name){
    return blocking_abtest_set.has(name);
  };
  is_nondefault_abtest = function(name){
    return nondefault_abtest_set.has(name);
  };
  out$.get_available_abtest_conditions = get_available_abtest_conditions = function(name){
    return abtest_conditions[name];
  };
  out$.get_abtest_list = get_abtest_list = function(){
    return abtest_list;
  };
  out$.get_assigned_abtest_conditions = get_assigned_abtest_conditions = async function(){
    var output, abtest_list, i$, len$, abtest, experiment_val;
    output = {};
    abtest_list = get_abtest_list();
    for (i$ = 0, len$ = abtest_list.length; i$ < len$; ++i$) {
      abtest = abtest_list[i$];
      experiment_val = (await getvar_experiment(abtest));
      if (experiment_val == null) {
        continue;
      }
      output[abtest] = experiment_val;
    }
    return output;
  };
  out$.add_abtest = add_abtest = function(name, conditions, func){
    abtest_list.push(name);
    abtest_funcs[name] = func;
    abtest_conditions[name] = conditions;
  };
  out$.set_abtest = set_abtest = async function(name, condition){
    var abtest_func;
    abtest_func = abtest_funcs[name];
    if (is_blocking_abtest(name)) {
      (await abtest_func(condition));
    } else {
      abtest_func(condition);
    }
  };
  out$.run_abtest = run_abtest = async function(name){
    var conditions, condition;
    conditions = abtest_conditions[name];
    condition = conditions[Math.floor(Math.random() * conditions.length)];
    (await set_abtest(name, condition));
  };
  add_abtest('internal_special_user', ['off', 'stanford_august2018_meeting'], async function(chosen_algorithm){
    localStorage.setItem('internal_special_user', chosen_algorithm);
    setvar_experiment('internal_special_user', chosen_algorithm);
  });
  add_abtest('selection_algorithm_for_visit', ['one_random_intervention_per_enabled_goal_with_frequency'], async function(chosen_algorithm){
    localStorage.setItem('selection_algorithm_for_visit', chosen_algorithm);
    setvar_experiment('selection_algorithm_for_visit', chosen_algorithm);
  });
  add_abtest('intervention_firstimpression_notice', ['power'], async function(chosen_algorithm){
    localStorage.setItem('intervention_firstimpression_notice', chosen_algorithm);
    setvar_experiment('intervention_firstimpression_notice', chosen_algorithm);
  });
  add_abtest('difficulty_selection_screen', ['nodefault_optional', 'nochoice_nothing', 'nochoice_easy', 'nochoice_medium', 'nochoice_hard'], async function(chosen_algorithm){
    if (chosen_algorithm === 'nochoice_nothing') {
      localStorage.setItem('difficulty_selector_disabled', true);
      localStorage.user_chosen_difficulty = 'nothing';
      setvar_experiment('user_chosen_difficulty', 'nothing');
      (await enabledisable_interventions_based_on_difficulty('nothing'));
    }
    if (chosen_algorithm === 'nochoice_easy') {
      localStorage.setItem('difficulty_selector_disabled', true);
      localStorage.user_chosen_difficulty = 'easy';
      setvar_experiment('user_chosen_difficulty', 'easy');
      (await enabledisable_interventions_based_on_difficulty('easy'));
    }
    if (chosen_algorithm === 'nochoice_medium') {
      localStorage.setItem('difficulty_selector_disabled', true);
      localStorage.user_chosen_difficulty = 'medium';
      setvar_experiment('user_chosen_difficulty', 'medium');
      (await enabledisable_interventions_based_on_difficulty('medium'));
    }
    if (chosen_algorithm === 'nochoice_hard') {
      localStorage.setItem('difficulty_selector_disabled', true);
      localStorage.user_chosen_difficulty = 'hard';
      setvar_experiment('user_chosen_difficulty', 'hard');
      (await enabledisable_interventions_based_on_difficulty('hard'));
    }
    if (chosen_algorithm === 'none') {
      localStorage.setItem('difficulty_selector_disabled', true);
    }
    if (chosen_algorithm === 'nodefault_forcedchoice') {
      localStorage.setItem('difficulty_selector_forcedchoice', true);
    }
    localStorage.setItem('difficulty_selection_screen', chosen_algorithm);
    setvar_experiment('difficulty_selection_screen', chosen_algorithm);
  });
  add_abtest('intervention_suggestion_algorithm', ['off', 'always', '1day', '3day', '5day', '7day'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('suggest_interventions', false);
    } else {
      localStorage.setItem('suggest_interventions', true);
    }
    localStorage.setItem('intervention_suggestion_algorithm', chosen_algorithm);
    setvar_experiment('intervention_suggestion_algorithm', chosen_algorithm);
  });
  add_abtest('goal_suggestion_threshold', [0, 180, 300, 600, 1200, 1800, 3600], async function(chosen_algorithm){
    localStorage.setItem('goal_suggestion_threshold', chosen_algorithm);
    setvar_experiment('goal_suggestion_threshold', chosen_algorithm);
  });
  add_abtest('onboarding_ideavoting_abtest', ['on'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('idea_voting_disabled', true);
    } else {
      localStorage.setItem('idea_voting_disabled', false);
    }
    localStorage.setItem('onboarding_ideavoting_abtest', chosen_algorithm);
    setvar_experiment('onboarding_ideavoting_abtest', chosen_algorithm);
  });
  add_abtest('daily_goal_reminders_abtest', ['off'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('allow_daily_goal_notifications', false);
      send_feature_disabled({
        page: 'background',
        feature: 'allow_daily_goal_notifications',
        manual: false,
        reason: 'daily_goal_reminders_abtest'
      });
    }
    setvar_experiment('daily_goal_reminders_abtest', chosen_algorithm);
  });
  add_abtest('reward_gifs_abtest', ['off'], async function(chosen_algorithm){
    var algorithms;
    if (chosen_algorithm == null) {
      algorithms = ['off'];
      chosen_algorithm = algorithms[Math.floor(Math.random() * algorithms.length)];
    }
    if (chosen_algorithm === 'off') {
      localStorage.setItem('allow_reward_gifs', false);
      send_feature_disabled({
        page: 'background',
        feature: 'allow_reward_gifs',
        manual: false,
        reason: 'reward_gifs_abtest'
      });
    }
    setvar_experiment('reward_gifs_abtest', chosen_algorithm);
  });
  add_abtest('intervention_intensity_polling_abtest', ['on'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('intervention_intensity_polling', false);
      send_feature_disabled({
        page: 'background',
        feature: 'intervention_intensity_polling',
        manual: false,
        reason: 'intervention_intensity_polling_abtest'
      });
    } else {
      localStorage.setItem('intervention_intensity_polling', true);
    }
    setvar_experiment('intervention_intensity_polling_abtest', chosen_algorithm);
  });
  add_abtest('allow_nongoal_timer', ['off'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('allow_nongoal_timer', false);
      send_feature_disabled({
        page: 'background',
        feature: 'allow_nongoal_timer',
        manual: false,
        reason: 'nongoal_timer_abtest'
      });
    }
    setvar_experiment('allow_nongoal_timer', chosen_algorithm);
  });
  add_abtest('idea_contribution_money', ['on'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('idea_contribution_money', false);
    } else {
      localStorage.setItem('idea_contribution_money', true);
    }
    setvar_experiment('idea_contribution_money', chosen_algorithm);
  });
  add_abtest('ideavoting_submit_prompt', ['on', 'off'], async function(chosen_algorithm){
    if (chosen_algorithm === 'off') {
      localStorage.setItem('ideavoting_submit_prompt', true);
    } else {
      localStorage.setItem('ideavoting_submit_prompt', false);
    }
    setvar_experiment('ideavoting_submit_prompt', chosen_algorithm);
  });
  out$.setup_abtest_newuser = setup_abtest_newuser = async function(){
    var i$, ref$, len$, abtest_name;
    for (i$ = 0, len$ = (ref$ = abtest_list).length; i$ < len$; ++i$) {
      abtest_name = ref$[i$];
      if (is_nondefault_abtest(abtest_name)) {
        continue;
      }
      (await run_abtest(abtest_name));
    }
  };
  out$.setup_abtest_olduser = setup_abtest_olduser = async function(){
    if (localStorage.intervention_suggestion_algorithm == null) {
      (await run_abtest('intervention_suggestion_algorithm'));
    }
    if (localStorage.goal_suggestion_threshold == null) {
      (await run_abtest('goal_suggestion_threshold'));
    }
  };
  gexport_module('abtest_utils', function(it){
    return eval(it);
  });
}).call(this);
