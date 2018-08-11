(function(){
  var post_json, load_css_file, ref$, get_user_id, get_install_id, get_enabled_goals, get_goals, unique, msg, addtolist, getlist, prelude, shuffled, polymer_ext, fetchjson, postjson;
  post_json = require('libs_backend/ajax_utils').post_json;
  load_css_file = require('libs_common/content_script_utils').load_css_file;
  ref$ = require('libs_backend/background_common'), get_user_id = ref$.get_user_id, get_install_id = ref$.get_install_id;
  ref$ = require('libs_backend/goal_utils'), get_enabled_goals = ref$.get_enabled_goals, get_goals = ref$.get_goals;
  unique = require('libs_common/array_utils').unique;
  msg = require('libs_common/localization_utils').msg;
  ref$ = require('libs_backend/db_utils'), addtolist = ref$.addtolist, getlist = ref$.getlist;
  prelude = require('prelude-ls');
  shuffled = require('shuffled');
  polymer_ext = require('libs_frontend/polymer_utils').polymer_ext;
  fetchjson = async function(url){
    var logging_server_url, this$ = this;
    if (localStorage.getItem('local_logging_server') === 'true') {
      logging_server_url = 'http://localhost:5000/';
    } else {
      logging_server_url = 'https://habitlab-intervention.herokuapp.com/';
    }
    return (await fetch(logging_server_url + url).then(function(it){
      return it.json();
    }));
  };
  postjson = async function(url, data){
    var logging_server_url;
    if (localStorage.getItem('local_logging_server') === 'true') {
      logging_server_url = 'http://localhost:5000/';
    } else {
      logging_server_url = 'https://habitlab-intervention.herokuapp.com/';
    }
    return (await post_json(logging_server_url + url, data));
  };
  polymer_ext({
    is: 'idea-generation-panel',
    properties: {
      idea_contribution_money: {
        type: Boolean,
        value: localStorage.idea_contribution_money === 'true'
      },
      ideavoting_submit_prompt: {
        type: Boolean,
        value: localStorage.ideavoting_submit_prompt === 'true'
      },
      display_suggest_idea: {
        type: Boolean,
        value: false
      },
      index_background_color: {
        type: String,
        value: 'rgb(81, 167,249)'
      },
      sites_list: {
        type: Array
      },
      site_ideas_mapping: {
        type: Array,
        value: []
      },
      site_ideas_mapping_counter: {
        type: Array,
        value: []
      },
      current_site: {
        type: String,
        value: ''
      },
      current_left_idea_id: {
        type: String,
        value: ''
      },
      current_right_idea_id: {
        type: String,
        value: ''
      },
      current_left_idea: {
        type: String,
        value: ''
      },
      current_right_idea: {
        type: String,
        value: ''
      },
      num_votes: {
        type: Number,
        value: 0
      },
      max_votes: {
        type: Number,
        value: 3
      }
    }
    /*
    inject_site_ideas_mapping: (site_list) ->>
      if not site_list?
        site_list = this.site_list
      # localStorage.setItem('testing_firsttime', true)
      #if localStorage.getItem('testing_firsttime') == 'true'
      #  localStorage.setItem('testing_firsttime', false)
      # inject site ideas mappings to db
      # 1. get the server loc
      ### TODO: remove for testing
      # localStorage.setItem('local_logging_server', true) 
      ###
      # 2. Concat data to transmit
      ### TODO: currently mannuly get from reddit
      ideas_placeholder = ['placeholder_1', 'placeholder_2', 'placeholder_3', 'placeholder_4', 'placeholder_5', 'placeholder_6']
      for site in site_list
        for idea in ideas_placeholder
          # console.log("posting this site: " + site + " with this idea: " + idea)
          site_idea_pair = { site : site, idea : idea , vote : 0}
          console.log(site_idea_pair)
          data = {} <<< site_idea_pair
          # 4. Send it
          upload_successful = true
          try
            console.log 'Posting data to: postideas'
            response = await postjson('postideas', data)
            if response.success
              dlog 'success'
              # return {status: 'success'}
            else
              upload_successful = false
              dlog 'response from server was not successful in postideas'
              dlog response
              dlog data
              console.log 'response from server was not successful in postideas'
              # return {status: 'failure', url: 'https://habitlab.stanford.edu'}
          catch
            upload_successful = false
            dlog 'error thrown in postideas'
            dlog e
            dlog data
            console.log 'error thrown in postideas'
            # return {status: 'failure', url: 'https://habitlab.stanford.edu'}
    */,
    upvote_idea: async function(option){
      var self, goal, userid, install_id, downvote_idea, upvote_idea, winner, loser, data;
      self = this;
      goal = this.current_site;
      this.num_votes++;
      userid = (await get_user_id());
      install_id = (await get_install_id());
      downvote_idea = '';
      upvote_idea = '';
      winner = '';
      loser = '';
      if (option === 'right') {
        upvote_idea = self.current_right_idea_id;
        downvote_idea = self.current_left_idea_id;
        winner = self.current_right_idea;
        loser = self.current_left_idea;
      } else {
        upvote_idea = self.current_left_idea_id;
        downvote_idea = self.current_right_idea_id;
        winner = self.current_left_idea;
        loser = self.current_right_idea;
      }
      data = (await postjson('upvote_proposed_idea', {
        goal: goal,
        winnerid: upvote_idea,
        loserid: downvote_idea,
        winner: winner,
        loser: loser,
        userid: userid,
        installid: install_id
      }));
      this.pairs_voted.add(this.current_site + '|||' + self.current_left_idea_id + '|||' + self.current_right_idea_id);
      return (await addtolist('idea_pairs_voted', this.current_site + '|||' + self.current_left_idea_id + '|||' + self.current_right_idea_id));
    },
    select_answer_leftside: async function(evt){
      var self;
      self = this;
      if (this.animation_inprogress) {
        return;
      }
      self.upvote_idea('left');
      this.SM('.animate_left').css("filter", "grayscale(0%)");
      this.SM('.animate_left').css("background-color", "#0000FF");
      this.$$('.animate_left').innerText = this.$$('.fix_left').innerText;
      this.SM('.answer-leftside-animate').css("margin-top", '0');
      this.SM('.answer-leftside-animate').css("z-index", '1');
      this.SM('.answer-leftside-fix').css("z-index", '0');
      this.SM('.answer-leftside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      this.SM('.animate_right').css("background-color", "#0000FF");
      this.SM('.animate_right').css("filter", "grayscale(30%)");
      this.$$('.animate_right').innerText = this.$$('.fix_right').innerText;
      this.SM('.answer-rightside-animate').css("margin-top", '0');
      this.SM('.answer-rightside-animate').css("z-index", '1');
      this.SM('.answer-rightside-fix').css("z-index", '0');
      this.SM('.answer-rightside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      (await self.display_idea());
      this.animation_inprogress = true;
      return setTimeout(function(){
        return self.animation_inprogress = false;
      }, 1000);
    },
    select_answer_rightside: async function(evt){
      var self;
      self = this;
      if (this.animation_inprogress) {
        return;
      }
      self.upvote_idea('right');
      this.SM('.animate_right').css("filter", "grayscale(0%)");
      this.SM('.animate_right').css("background-color", "#0000FF");
      this.$$('.animate_right').innerText = this.$$('.fix_right').innerText;
      this.SM('.answer-rightside-animate').css("margin-top", '0');
      this.SM('.answer-rightside-animate').css("z-index", '1');
      this.SM('.answer-rightside-fix').css("z-index", '0');
      this.SM('.answer-rightside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      this.SM('.animate_left').css("background-color", "#0000FF");
      this.SM('.animate_left').css("filter", "grayscale(30%)");
      this.$$('.animate_left').innerText = this.$$('.fix_left').innerText;
      this.SM('.answer-leftside-animate').css("margin-top", '0');
      this.SM('.answer-leftside-animate').css("z-index", '1');
      this.SM('.answer-leftside-fix').css("z-index", '0');
      this.SM('.answer-leftside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      (await self.display_idea());
      this.animation_inprogress = true;
      return setTimeout(function(){
        return self.animation_inprogress = false;
      }, 1000);
    },
    select_opt_out: async function(evt){
      var self, goal, userid, install_id, leftidea, rightidea, leftideaid, rightideaid;
      self = this;
      if (this.animation_inprogress) {
        return;
      }
      goal = this.current_site;
      userid = (await get_user_id());
      install_id = (await get_install_id());
      leftidea = self.current_left_idea;
      rightidea = self.current_right_idea;
      leftideaid = self.current_left_idea_id;
      rightideaid = self.current_right_idea_id;
      this.pairs_voted.add(this.current_site + '|||' + self.current_left_idea_id + '|||' + self.current_right_idea_id);
      postjson('opt_out_nudgeidea', {
        goal: goal,
        leftidea: leftidea,
        rightidea: rightidea,
        leftideaid: leftideaid,
        rightideaid: rightideaid,
        userid: userid,
        installid: install_id
      });
      addtolist('idea_pairs_voted', this.current_site + '|||' + self.current_left_idea_id + '|||' + self.current_right_idea_id);
      this.SM('.animate_right').css("filter", "grayscale(30%)");
      this.SM('.animate_right').css("background-color", "#0000FF");
      this.$$('.animate_right').innerText = this.$$('.fix_right').innerText;
      this.SM('.answer-rightside-animate').css("margin-top", '0');
      this.SM('.answer-rightside-animate').css("z-index", '1');
      this.SM('.answer-rightside-fix').css("z-index", '0');
      this.SM('.answer-rightside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      this.SM('.animate_left').css("filter", "grayscale(30%)");
      this.SM('.animate_left').css("background-color", "#0000FF");
      this.$$('.animate_left').innerText = this.$$('.fix_left').innerText;
      this.SM('.answer-leftside-animate').css("margin-top", '0');
      this.SM('.answer-leftside-animate').css("z-index", '1');
      this.SM('.answer-leftside-fix').css("z-index", '0');
      this.SM('.answer-leftside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      (await self.display_idea());
      this.animation_inprogress = true;
      return setTimeout(function(){
        return self.animation_inprogress = false;
      }, 1000);
    },
    user_typing_idea: function(evt){
      return this.idea_text = this.$$('#nudge_typing_area').value;
    },
    add_own_idea: function(){
      this.$$('#add_idea_dialog').open();
      if (this.idea_text != null && this.idea_text.length > 0) {
        return this.$$('#nudge_typing_area').value = this.idea_text;
      }
    },
    submit_idea: async function(){
      var selected_goal_idx, goal_info, idea_text, idea_email, userid, install_id, site_idea_pair, data, upload_successful, response, e;
      selected_goal_idx = this.$$('#idea_site_selector').selected;
      goal_info = this.goal_info_list[selected_goal_idx];
      idea_text = this.$$('#nudge_typing_area').value;
      idea_email = this.$$('#email_typing_area').value;
      this.$$('#nudge_typing_area').value = '';
      this.$$('#email_typing_area').value = '';
      this.idea_text = '';
      userid = (await get_user_id());
      install_id = (await get_install_id());
      site_idea_pair = {
        goal: goal_info.name,
        idea: idea_text,
        userid: userid,
        installid: install_id,
        email: idea_email
      };
      console.log(site_idea_pair);
      data = import$({}, site_idea_pair);
      console.log(data);
      upload_successful = true;
      try {
        response = (await postjson('postidea_candidate', data));
        if (response.response === 'success') {
          dlog('success');
        } else {
          upload_successful = false;
          dlog('response from server was not successful in postidea_candidate');
          dlog(response);
          dlog(data);
        }
      } catch (e$) {
        e = e$;
        upload_successful = false;
        dlog('error thrown in postidea_candidate');
        dlog(e);
        dlog(data);
      }
      return this.$$('#add_idea_dialog').close();
    }
    /*
    display_idea: ->>
      self = this
      all_goals = await get_goals()
      # display initial choice
      for site_ideas_pair in self.site_ideas_mapping
        for site_counter_pair in self.site_ideas_mapping_counter
          if site_ideas_pair.goal == site_counter_pair.goal
            # check if all the pairs has been rotated, if not we display
            if site_counter_pair.counter < site_ideas_pair.ideas.length/2
              # corner case
              self.$$('.vote-question').innerText = msg("Which do you think would be a better nudge for " + all_goals[site_ideas_pair.goal].sitename_printable + "?")
              self.current_site = site_ideas_pair.goal
              index = site_counter_pair.counter * 2
              if site_counter_pair.counter == Math.floor(site_ideas_pair.ideas.length/2)
                self.$$('.fix_left').innerText = msg(site_ideas_pair.ideas[index])
                self.$$('.fix_right').innerText = msg(site_ideas_pair.ideas[0])
                self.current_left_idea = site_ideas_pair.ideas[index]
                self.current_right_idea = site_ideas_pair.ideas[0]
                self.current_left_idea_id = site_ideas_pair.ideas_id[index]
                self.current_right_idea_id = site_ideas_pair.ideas_id[0]
              else
                self.$$('.fix_left').innerText = msg(site_ideas_pair.ideas[index])
                self.$$('.fix_right').innerText = msg(site_ideas_pair.ideas[index + 1])
                self.current_left_idea = site_ideas_pair.ideas[index]
                self.current_right_idea = site_ideas_pair.ideas[index + 1]
                self.current_left_idea_id = site_ideas_pair.ideas_id[index]
                self.current_right_idea_id = site_ideas_pair.ideas_id[index + 1]
              site_counter_pair.counter = site_counter_pair.counter + 1
              # console.log self.site_ideas_mapping_counter
              return
      # if get to this point, then we should disable button
      self.$$('.fix_left').innerText = 'No more nudge ideas to vote on'
      self.$$('.fix_right').innerText = 'No more nudge ideas to vote on'
      document.getElementById("disable_left").disabled = true; 
      document.getElementById("disable_right").disabled = true;
      document.getElementById("disable_opt_out").disabled = true;
    */,
    display_idea: async function(){
      var self, all_goals, i$, ref$, len$, site_ideas_pair, goal, j$, ref1$, len1$, ref2$, leftidea, leftidea_id, k$, len2$, ref3$, rightidea, rightidea_id;
      self = this;
      all_goals = (await get_goals());
      console.log(this.num_votes);
      console.log(this.max_votes);
      console.log(self.ideavoting_submit_prompt);
      if (this.num_votes === this.max_votes && self.ideavoting_submit_prompt) {
        console.log(self.ideavoting_submit_prompt);
        console.log('should display prompt');
        self.display_suggest_idea = true;
      }
      console.log(self.display_suggest_idea);
      for (i$ = 0, len$ = (ref$ = self.site_ideas_mapping).length; i$ < len$; ++i$) {
        site_ideas_pair = ref$[i$];
        goal = site_ideas_pair.goal;
        for (j$ = 0, len1$ = (ref1$ = shuffled(prelude.zip(site_ideas_pair.ideas, site_ideas_pair.ideas_id))).length; j$ < len1$; ++j$) {
          ref2$ = ref1$[j$], leftidea = ref2$[0], leftidea_id = ref2$[1];
          for (k$ = 0, len2$ = (ref2$ = shuffled(prelude.zip(site_ideas_pair.ideas, site_ideas_pair.ideas_id))).length; k$ < len2$; ++k$) {
            ref3$ = ref2$[k$], rightidea = ref3$[0], rightidea_id = ref3$[1];
            if (leftidea === rightidea) {
              continue;
            }
            if (this.pairs_voted.has(goal + '|||' + leftidea + '|||' + rightidea) || this.pairs_voted.has(goal + '|||' + rightidea + '|||' + leftidea)) {
              continue;
            }
            self.current_site = site_ideas_pair.goal;
            self.$$('.vote-question').innerText = msg("Which do you think would be a better nudge for " + all_goals[site_ideas_pair.goal].sitename_printable + "?");
            self.$$('.fix_left').innerText = leftidea;
            self.$$('.fix_right').innerText = rightidea;
            self.current_left_idea = leftidea;
            self.current_left_idea_id = leftidea_id;
            self.current_right_idea = rightidea;
            self.current_right_idea_id = rightidea_id;
            document.getElementById("disable_left").disabled = false;
            document.getElementById("disable_right").disabled = false;
            document.getElementById("disable_opt_out").disabled = false;
            return;
          }
        }
      }
      console.log('disabling');
      self.$$('.fix_left').innerText = 'No more nudge ideas to vote on';
      self.$$('.fix_right').innerText = 'No more nudge ideas to vote on';
      document.getElementById("disable_left").disabled = true;
      document.getElementById("disable_right").disabled = true;
      return document.getElementById("disable_opt_out").disabled = true;
    },
    ready: async function(){
      var allideas;
      allideas = (await fetchjson('getideas_vote_all'));
      this.allideas = allideas;
      return this.rerender();
    },
    continue_voting: function(){
      return this.display_suggest_idea = false;
    },
    rerender: async function(){
      var allideas, idea_pairs_voted_list, i$, len$, item, self, all_goals, goal_info_list, goals_list, enabled_goals, goal_to_idea_info, idea_info, goal, site_ideas_mapping, site_ideas_mapping_counter, idea_temp, idea_id_temp, idea_info_list, j$, len1$, this$ = this;
      allideas = this.allideas;
      if (allideas == null) {
        return;
      }
      this.pairs_voted = new Set();
      idea_pairs_voted_list = (await getlist('idea_pairs_voted'));
      for (i$ = 0, len$ = idea_pairs_voted_list.length; i$ < len$; ++i$) {
        item = idea_pairs_voted_list[i$];
        this.pairs_voted.add(item);
      }
      self = this;
      all_goals = (await get_goals());
      goal_info_list = Object.values(all_goals);
      goal_info_list.unshift({
        name: "generic/spend_less_time",
        sitename_printable: "Any Website"
      });
      self.goal_info_list = goal_info_list;
      goals_list = goal_info_list.map(function(it){
        return it.name;
      });
      enabled_goals = (await get_enabled_goals());
      goal_to_idea_info = {};
      for (i$ = 0, len$ = allideas.length; i$ < len$; ++i$) {
        idea_info = allideas[i$];
        goal = idea_info.goal;
        if (goal_to_idea_info[goal] == null) {
          goal_to_idea_info[goal] = [];
        }
        goal_to_idea_info[goal].push(idea_info);
      }
      site_ideas_mapping = [];
      site_ideas_mapping_counter = [];
      for (i$ = 0, len$ = goals_list.length; i$ < len$; ++i$) {
        goal = goals_list[i$];
        if (!enabled_goals[goal]) {
          continue;
        }
        idea_temp = [];
        idea_id_temp = [];
        idea_info_list = goal_to_idea_info[goal];
        if (idea_info_list != null) {
          for (j$ = 0, len1$ = idea_info_list.length; j$ < len1$; ++j$) {
            idea_info = idea_info_list[j$];
            idea_temp.push(idea_info.idea);
            idea_id_temp.push(idea_info._id);
          }
        }
        site_ideas_mapping.push({
          goal: goal,
          ideas: idea_temp,
          ideas_id: idea_id_temp,
          counter: 0
        });
        site_ideas_mapping_counter.push({
          goal: goal,
          counter: 0
        });
      }
      self.site_ideas_mapping = site_ideas_mapping;
      self.site_ideas_mapping_counter = site_ideas_mapping_counter;
      return (await self.display_idea());
    }
    /*
    oldready: ->>
      self = this
      all_goals = await get_goals()
      goal_info_list = Object.values all_goals
      sites_list = goal_info_list.map (.sitename_printable)
      sites_list = sites_list.filter -> it?
      sites_list = unique sites_list
      sites_list.sort()
      this.sites_list = sites_list
      ### TODO: remove this
      #self.inject_site_ideas_mapping(sites_list)
      # getting the site ideas mapping
      enabled_goals = await get_enabled_goals()
      enabled_goals_keys = Object.keys(enabled_goals)
      enabled_spend_less_site = []
      for item in enabled_goals_keys
        enabled_spend_less_site.push(item.split("/")[0])
      console.log(enabled_spend_less_site)
      ### TODO: remove for testing
      # localStorage.setItem('local_logging_server', true) 
      ###
      for site in enabled_spend_less_site
        site_upper = site.charAt(0).toUpperCase() + site.slice(1)
        console.log("Fetching from the server of shared interventions from: " + site_upper);
        data = await fetchjson('getideas_vote?website=' + site_upper)
        idea_temp = []
        idea_id_temp = []
        for item in data
          idea_temp.push(item.idea)
          idea_id_temp.push(item._id)
        self.site_ideas_mapping.push({
          site: site
          ideas: idea_temp
          ideas_id: idea_id_temp
          counter: 0
        });
        self.site_ideas_mapping_counter.push({
          site: site,
          counter: 0
        });
      # console.log self.site_ideas_mapping
      await self.display_idea()
      */
  }, [
    {
      source: require('libs_common/localization_utils'),
      methods: ['msg']
    }, {
      source: require('libs_frontend/polymer_methods'),
      methods: ['text_if', 'once_available', 'S', 'SM']
    }, {
      source: require('libs_frontend/polymer_methods_resize'),
      methods: ['on_resize']
    }
  ]);
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
