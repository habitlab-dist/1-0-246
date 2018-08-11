(function(){
  var polymer_ext, moment, ThompsonMAB, prelude, get_multi_armed_bandit_algorithm, intervention_utils, User;
  polymer_ext = require('libs_frontend/polymer_utils').polymer_ext;
  moment = require('moment');
  ThompsonMAB = require('libs_backend/multi_armed_bandit_thompson').ThompsonMAB;
  prelude = require('prelude-ls');
  get_multi_armed_bandit_algorithm = require('libs_backend/multi_armed_bandit').get_multi_armed_bandit_algorithm;
  intervention_utils = require('libs_common/intervention_utils');
  User = (function(){
    /**
      * Instantiates user with behavior.
      * @param {intervention: {min, max}} behavior min and max seconds user will spend on intervention
      */
    User.displayName = 'User';
    var prototype = User.prototype, constructor = User;
    function User(behavior){
      this.behavior = behavior;
      console.log(this.behavior);
    }
    /**
      * Spends time on intervention.
      * @param {string} intervention name of intervention.
      * @return {time, regret} number of seconds spent on intervention and calculated regret.
      */
    User.prototype.spendTime = function(intervention){
      var best_choice, intervention_name, time, intervention_time;
      best_choice = undefined;
      for (intervention_name in this.behavior) {
        time = this.behavior[intervention_name].min + Math.random() * (this.behavior[intervention_name].max - this.behavior[intervention_name].min);
        if (best_choice == null || best_choice > time) {
          console.log("best_choice = " + time);
          best_choice = time;
        }
        if (intervention_name === intervention) {
          intervention_time = time;
        }
      }
      console.log({
        time: intervention_time,
        regret: intervention_time - best_choice
      });
      return {
        time: intervention_time,
        regret: intervention_time - best_choice
      };
    };
    return User;
  }());
  polymer_ext({
    is: 'thompson-novelty-debug',
    properties: {
      goal: {
        type: String,
        value: 'facebook/spend_less_time',
        observer: 'goal_changed'
      },
      weight: {
        type: Number,
        value: 0.5
      },
      interventions: {
        type: Array,
        value: [
          {
            name: "facebook/scroll_blocker",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/feed_injection_timer",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/remove_news_feed",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/rich_notifications",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/remove_comments",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/remove_clickbait",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/toast_notifications",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }, {
            name: "facebook/show_timer_banner",
            time_min: 3000,
            time_max: 4000,
            novelty: 10000000,
            choice_freq: 0,
            last_chosen: Date.now()
          }
        ]
      }
    },
    slider_changed: function(evt){
      return console.log("NEW WEIGHT: " + this.weight);
    },
    to_id: function(intervention_name){
      var alphabet, output;
      alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"].concat(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"].concat(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]));
      output = intervention_name.split('').filter(function(it){
        return alphabet.indexOf(it) !== -1;
      }).join('');
      return output;
    },
    get_novelty: function(){
      var novelty, i$, ref$, len$, intervention;
      novelty = {};
      for (i$ = 0, len$ = (ref$ = this.interventions).length; i$ < len$; ++i$) {
        intervention = ref$[i$];
        intervention.novelty = Date.now() - intervention.last_chosen;
        novelty[intervention.name] = intervention.novelty;
      }
      return novelty;
    },
    choose_intervention: async function(){
      var i$, ref$, len$, intervention, user, chosen_intervention, time, new_interventions;
      for (i$ = 0, len$ = (ref$ = this.interventions).length; i$ < len$; ++i$) {
        intervention = ref$[i$];
        this.S("#" + this.to_id(intervention.name)).css("background-color", "white");
      }
      user = new User(this.extract_behavior());
      console.log(this.extract_behavior());
      if (this.bandit == null) {
        this.bandit = new ThompsonMAB(this.get_intervention_list(), this.weight, 1 - this.weight);
      }
      chosen_intervention = this.bandit.predict(this.get_novelty());
      console.log(chosen_intervention);
      time = user.spendTime(chosen_intervention);
      this.bandit.learn(chosen_intervention, time.time);
      this.regret_this_round = time.regret;
      if (this.total_regret == null) {
        this.total_regret = 0;
      }
      this.total_regret += this.regret_this_round;
      if (this.rounds == null) {
        this.rounds = 0;
      }
      this.rounds += 1;
      this.average_regret = this.total_regret / this.rounds;
      new_interventions = [];
      for (i$ = 0, len$ = (ref$ = this.interventions).length; i$ < len$; ++i$) {
        intervention = ref$[i$];
        if (intervention.name === chosen_intervention) {
          intervention.choice_freq += 1;
          intervention.last_chosen = Date.now();
          this.S("#" + this.to_id(intervention.name)).css("background-color", "yellow");
        }
        new_interventions.push(intervention);
      }
      return this.interventions = JSON.parse(JSON.stringify(new_interventions));
    },
    choose_50_interventions: async function(){
      var i$, i, results$ = [];
      for (i$ = 1; i$ <= 50; ++i$) {
        i = i$;
        results$.push(this.choose_intervention());
      }
      return results$;
    },
    extract_behavior: function(){
      var behavior, i$, ref$, len$, intervention;
      behavior = {};
      for (i$ = 0, len$ = (ref$ = this.interventions).length; i$ < len$; ++i$) {
        intervention = ref$[i$];
        behavior[intervention.name] = {
          min: intervention.time_min,
          max: intervention.time_max
        };
      }
      return behavior;
    },
    get_intervention_list: function(){
      var intervention_list, i$, ref$, len$, intervention;
      intervention_list = [];
      for (i$ = 0, len$ = (ref$ = this.interventions).length; i$ < len$; ++i$) {
        intervention = ref$[i$];
        intervention_list.push(intervention.name);
      }
      return intervention_list;
    },
    ready: function(){
      var self;
      self = this;
      return self.once_available('.intervention_score_range', function(){
        return self.slider_changed();
      });
    }
  }, {
    source: require('libs_frontend/polymer_methods'),
    methods: ['$$$', 'SM', 'S', 'once_available']
  });
}).call(this);
