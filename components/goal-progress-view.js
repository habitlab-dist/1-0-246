(function(){
  var ref$, polymer_ext, list_polymer_ext_tags_with_info, get_seconds_spent_on_all_domains_today, get_seconds_spent_on_all_domains_days_before_today, get_seconds_spent_on_domain_all_days, get_goal_info, get_goal_target, get_progress_on_goal_this_week, post_json, chrome_get_token, reverse, moment, getSum;
  ref$ = require('libs_frontend/polymer_utils'), polymer_ext = ref$.polymer_ext, list_polymer_ext_tags_with_info = ref$.list_polymer_ext_tags_with_info;
  ref$ = require('libs_common/time_spent_utils'), get_seconds_spent_on_all_domains_today = ref$.get_seconds_spent_on_all_domains_today, get_seconds_spent_on_all_domains_days_before_today = ref$.get_seconds_spent_on_all_domains_days_before_today, get_seconds_spent_on_domain_all_days = ref$.get_seconds_spent_on_domain_all_days;
  ref$ = require('libs_backend/goal_utils'), get_goal_info = ref$.get_goal_info, get_goal_target = ref$.get_goal_target;
  get_progress_on_goal_this_week = require('libs_backend/goal_progress').get_progress_on_goal_this_week;
  post_json = require('libs_backend/ajax_utils').post_json;
  chrome_get_token = require('libs_backend/background_common').chrome_get_token;
  reverse = require('prelude-ls').reverse;
  moment = require('moment');
  getSum = function(total, num){
    return total + num;
  };
  polymer_ext({
    is: 'goal-progress-view',
    properties: {
      loaded: {
        type: Boolean,
        value: false
      },
      goal: {
        type: String,
        observer: 'goalChanged'
      },
      browser: {
        type: Array
      },
      mobile: {
        type: Array
      },
      total: {
        type: Object
      },
      selected: {
        type: Number
      },
      data: {
        type: Object
      },
      sync: {
        type: Boolean,
        value: localStorage.sync_with_mobile === 'true'
      }
    },
    compute_data: function(chart, goal_progress, goal_info, goal_target){
      var goal_data, i$, i, progress_labels, res$, to$, ridx$, output, this$ = this;
      goal_data = [];
      for (i$ = 0; i$ <= 7; ++i$) {
        i = i$;
        goal_data.push(this.goal_target);
      }
      chart = chart.days;
      chart = chart.map((function(it){
        return it / 60;
      })).map(function(it){
        return it.toFixed(1);
      });
      res$ = [];
      for (i$ = 0, to$ = chart.length; i$ < to$; ++i$) {
        ridx$ = i$;
        res$.push(ridx$);
      }
      progress_labels = res$;
      progress_labels.forEach(function(element, index, array){
        array[index] = moment().subtract(array[index], 'day').format('ddd MM/D');
      });
      output = {
        labels: reverse(progress_labels),
        datasets: [
          {
            label: 'minutes',
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            data: reverse(chart)
          }, {
            label: 'Daily goal',
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(0,255,0,0.4)",
            borderColor: "rgba(0,255,0,1)",
            pointBorderColor: "rgba(0,255,0,1)",
            pointBackgroundColor: '#00ff00',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(0,255,0,1)",
            pointHoverBorderColor: "rgba(0,255,0,1)",
            data: goal_data
          }
        ]
      };
      return output;
    },
    goalChanged: async function(goal){
      var goal_info, goal_progress, progress_values, progress_labels, res$, i$, to$, ridx$, target, goal_data, i, this$ = this;
      goal_info = (await get_goal_info(goal));
      goal_progress = (await get_progress_on_goal_this_week(goal));
      this.goal_progress = goal_progress;
      this.goal_info = goal_info;
      progress_values = goal_progress.map(function(it){
        return it.progress;
      });
      progress_values = progress_values.map(function(it){
        return Math.round(it * 10) / 10;
      });
      res$ = [];
      for (i$ = 0, to$ = goal_progress.length; i$ < to$; ++i$) {
        ridx$ = i$;
        res$.push(ridx$);
      }
      progress_labels = res$;
      progress_labels.forEach(function(element, index, array){
        array[index] = moment().subtract(array[index], 'day').format('ddd MM/D');
      });
      target = (await get_goal_target(this.goal));
      goal_data = [];
      for (i$ = 0, to$ = progress_values.length; i$ <= to$; ++i$) {
        i = i$;
        goal_data.push(target);
      }
      if (this.goal !== goal) {
        return;
      }
      return this.data = {
        labels: reverse(progress_labels),
        datasets: [
          {
            label: goal_info.progress_description,
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            data: reverse(progress_values)
          }, {
            label: 'Daily goal',
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(0,255,0,0.4)",
            borderColor: "rgba(0,255,0,1)",
            pointBorderColor: "rgba(0,255,0,1)",
            pointBackgroundColor: '#00ff00',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(0,255,0,1)",
            pointHoverBorderColor: "rgba(0,255,0,1)",
            data: goal_data
          }
        ]
      };
    },
    ready: async function(){
      var goal_info, domain, source, mobile_server, data, browser, mobile, i$, ref$, len$, browser_id, android_id;
      if (this.sync) {
        this.goal_target = (await get_goal_target(this.goal));
        goal_info = (await get_goal_info(this.goal));
        domain = goal_info.domain;
        console.log('post request for');
        console.log(domain);
        source = 'browser';
        console.log(localStorage.id_secret);
        mobile_server = 'https://habitlab-mobile-website.herokuapp.com';
        if (localStorage.local_logging_server === 'true') {
          mobile_server = 'http://localhost:5000';
        }
        data = (await post_json(mobile_server + '/account_external_stats', {
          domain: domain,
          from: source,
          secret: localStorage.id_secret,
          timestamp: Date.now(),
          utcOffset: moment().utcOffset()
        }));
        console.log('finished post request for');
        console.log(domain);
        console.log(data);
        browser = [];
        mobile = [];
        for (i$ = 0, len$ = (ref$ = Object.keys(data.browser)).length; i$ < len$; ++i$) {
          browser_id = ref$[i$];
          if (data.browser.hasOwnProperty(browser_id)) {
            if (data.browser[browser_id].weeks.reduce(getSum) !== 0) {
              browser.push(data.browser[browser_id]);
            }
          }
        }
        for (i$ = 0, len$ = (ref$ = Object.keys(data.android)).length; i$ < len$; ++i$) {
          android_id = ref$[i$];
          if (data.android.hasOwnProperty(android_id)) {
            if (data.android[android_id].weeks.reduce(getSum) !== 0) {
              mobile.push(data.android[android_id]);
            }
          }
        }
        this.browser = browser;
        this.mobile = mobile;
        this.total = data.total;
        this.selected = 0;
      }
      return this.loaded = true;
    }
  }, {
    source: require('libs_frontend/polymer_methods'),
    methods: ['S', 'once_available']
  });
}).call(this);
