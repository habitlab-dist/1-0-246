(function(){
  var ref$, gexport, gexport_module, as_array, bandits, get_seconds_spent_for_each_session_per_intervention, list_enabled_interventions_for_goal, get_goals, ThompsonMAB, train_multi_armed_bandit_for_goal, intervention_utils, intervention_manager, goal_progress, __get__, __set__, out$ = typeof exports != 'undefined' && exports || this;
  ref$ = require('libs_common/gexport'), gexport = ref$.gexport, gexport_module = ref$.gexport_module;
  as_array = require('libs_common/collection_utils').as_array;
  bandits = require('percipio').bandits;
  ref$ = require('libs_backend/intervention_utils'), get_seconds_spent_for_each_session_per_intervention = ref$.get_seconds_spent_for_each_session_per_intervention, list_enabled_interventions_for_goal = ref$.list_enabled_interventions_for_goal;
  get_goals = require('libs_backend/goal_utils').get_goals;
  /**
   * This algorithm recommends interventions using the Generalized Thompson Sampling Algorithm.
   * This Thompson Sampling Algorithm draws inspiration from:
   * Daniel J. Russo, Benjamin Van Roy, Abbas Kazerouni, Ian
   * Osband and Zheng Wen (2018), “A Tutorial on Thompson Sampling”, Foundations and
   * Trends in Machine Learning: Vol. 11, No. 1, pp 1–96. DOI: 10.1561/2200000070.
   * This Thompson Sampling is designed solely for handling a multi-armbed-bandit problem with TIME observations.
   * Currently, we will train the algorithm with all previous sessions on each instance of the extension
   * TODO: Investigate whether this will cause a performance bottleneck and rewrite the algorithm to 
   * maintain the posterior and only train with one new instance each time.
   */
  out$.ThompsonMAB = ThompsonMAB = (function(){
    /**
     * Instantiates Thompson Multi Armed Bandit with Prior Distribution Parameters.
     * Note, our observations are time, so we can assume that our observations are log-Gaussian distributed.
     * For each arm (intervention), we will have (mu, sigma) parameters.
     * We will choose our prior parameters to be $$\mu_i=-1/2$$ and $$\sigma_i^2=1$$ so $$E[\theta_i]=1$$
     * for each intervention $$i$$.
     * We will also assume that our sigma_tilde (Gaussian Noise) is 1. TODO: Investigate this assumption.
     * @param arms_list: a list of intervention names.
     * @param sampling_factor: coefficient that represents degree to which the Thompson Sampling is considered
     * relative to novelty factor. If higher than novelty factor, sampling factor is considered more.
     * @param novelty_factor: coefficient that represents degree to which the novelty of an intervention
     * is considered relative to the sampling_factor for recommending an intervention.
     */
    ThompsonMAB.displayName = 'ThompsonMAB';
    var prototype = ThompsonMAB.prototype, constructor = ThompsonMAB;
    function ThompsonMAB(arms_list, sampling_factor, novelty_factor){
      var mu, sigma, i$, ref$, len$, intervention_name, gaussian;
      this.arms_list = arms_list;
      this.sampling_factor = sampling_factor;
      this.novelty_factor = novelty_factor;
      if (!(this.sampling_factor != null)) {
        this.sampling_factor = 1;
      }
      if (!(this.novelty_factor != null)) {
        this.novelty_factor = 0;
      }
      this.sigma_tilde = 1;
      mu = -1 / 2;
      sigma = 1;
      this.posterior_params = {};
      for (i$ = 0, len$ = (ref$ = this.arms_list).length; i$ < len$; ++i$) {
        intervention_name = ref$[i$];
        this.posterior_params[intervention_name] = [mu, sigma];
      }
      gaussian = require('gaussian');
      this.norm_distribution = gaussian(0, 1);
    }
    /**
     * Learns this new observation and updates the posterior.
     * @param arm: name of intervention.
     * @param observation: time spent with that intervention.
     */
    ThompsonMAB.prototype.learn = function(arm, observation){
      var intervention_name, old_std, old_mean, old_precision, noise_precision, new_precision, new_mean, new_std;
      if (observation <= 0) {
        observation = 1;
      }
      intervention_name = arm;
      old_std = this.posterior_params[intervention_name][1];
      old_mean = this.posterior_params[intervention_name][0];
      old_precision = 1.0 / Math.pow(old_std, 2);
      noise_precision = 1.0 / Math.pow(this.sigma_tilde, 2);
      new_precision = old_precision + noise_precision;
      new_mean = (noise_precision * (Math.log(observation) + 0.5 / noise_precision) + old_precision * old_mean) / new_precision;
      new_std = Math.sqrt(1.0 / new_precision);
      return this.posterior_params[intervention_name] = [new_mean, new_std];
    };
    /**
     * @return dictionary of {intervention_name: time}
     */
    ThompsonMAB.prototype.sample_times = function(){
      var dictionary, i$, ref$, len$, intervention_name, params, omean, std, Z;
      dictionary = {};
      for (i$ = 0, len$ = (ref$ = this.arms_list).length; i$ < len$; ++i$) {
        intervention_name = ref$[i$];
        params = this.posterior_params[intervention_name];
        omean = params[0];
        std = params[1];
        Z = this.norm_distribution.ppf(Math.random());
        dictionary[intervention_name] = Math.exp(omean + std * Z);
      }
      return dictionary;
    };
    /**
     * @param dictionary: {intervention_name: number}
     * @return normalized dictionary.
     */
    ThompsonMAB.prototype.normalize = function(dictionary){
      var total, key;
      total = 0;
      for (key in dictionary) {
        total += dictionary[key];
      }
      for (key in dictionary) {
        dictionary[key] /= total;
      }
      return dictionary;
    };
    /**
      * Based on our posterior parameters, recommend which intervention to choose to minimize time spent.
      * @param novelty: dictionary formatted like {<intervention_name>: <novelty>} 
      * where novelty is the time since that intervention was used. Optional.
      * @return: the name of the intervention we recommend.
      */
    ThompsonMAB.prototype.predict = function(novelty){
      var sample, best_intervention, i$, ref$, len$, intervention_name, novelty_value, reward;
      sample = this.normalize(this.sample_times());
      if (novelty != null) {
        novelty = this.normalize(novelty);
      }
      best_intervention = {};
      for (i$ = 0, len$ = (ref$ = this.arms_list).length; i$ < len$; ++i$) {
        intervention_name = ref$[i$];
        novelty_value = 0;
        if (novelty != null) {
          novelty_value = novelty[intervention_name];
        }
        reward = -1 * this.sampling_factor * sample[intervention_name] + this.novelty_factor * novelty_value;
        if (best_intervention.intervention_name == null || best_intervention.reward < reward) {
          best_intervention.intervention_name = intervention_name;
          best_intervention.reward = reward;
        }
      }
      return best_intervention.intervention_name;
    };
    return ThompsonMAB;
  }());
  /**
   * Trains predictor for choosing which intervention to use given a goal using Thompson Sampling.
   * Each sample is the session length using an intervention.
   * @param sample_coefficient, novelty_coefficient: see ThompsonMAB
   * @return A predictor for which intervention to choose.
   */
  out$.train_multi_armed_bandit_for_goal = train_multi_armed_bandit_for_goal = async function(goal_name, intervention_names, sample_coefficient, novelty_coefficient){
    var bandit, goals, intervention_times, intervention_name, i$, ref$, len$, time;
    bandit = new ThompsonMAB(intervention_names, sample_coefficient, novelty_coefficient);
    if (intervention_names == null) {
      intervention_names = (await intervention_utils.list_enabled_interventions_for_goal(goal_name));
    }
    goals = (await get_goals());
    intervention_times = (await intervention_utils.get_seconds_spent_for_each_session_per_intervention(goals[goal_name].domain));
    for (intervention_name in intervention_times) {
      for (i$ = 0, len$ = (ref$ = intervention_times[intervention_name]).length; i$ < len$; ++i$) {
        time = ref$[i$];
        bandit.learn(intervention_name, time);
      }
    }
    return bandit;
  };
  intervention_utils = require('libs_backend/intervention_utils');
  intervention_manager = require('libs_backend/intervention_manager');
  goal_progress = require('libs_backend/goal_progress');
  out$.__get__ = __get__ = function(name){
    return eval(name);
  };
  out$.__set__ = __set__ = function(name, val){
    return eval(name + ' = val');
  };
  gexport_module('multi_armed_bandit_thompson', function(it){
    return eval(it);
  });
}).call(this);
